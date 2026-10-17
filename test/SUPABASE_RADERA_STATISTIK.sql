-- Installera funktionen; denna fil raderar INGEN spelhistorik.
-- Kör hela filen. Appen begär sedan förhandsvisning och separat bekräftad radering.
begin;
create or replace function public.manage_badminton_statistics(
 p_group_id uuid default null,
 p_confirmation text default null,
 p_expected_signature text default null
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
 ids uuid[]; group_name text; required_text text; signature text;
 session_count integer; round_count integer; position_count integer; score_count integer; active_count integer;
 result jsonb;
begin
 if auth.uid() is null or not coalesce(public.is_badminton_super_admin(),false) then
  raise exception 'Endast Super Admin får radera serverstatistik' using errcode='42501';
 end if;
 -- Serialize destructive operations and prevent status changes/new sessions during execution.
 if p_confirmation is not null then
  perform pg_catalog.pg_advisory_xact_lock(173014,1);
  lock table public.badminton_sessions in share row exclusive mode;
 end if;
 if p_group_id is not null then
  select g.name into group_name from public.badminton_groups g where g.id=p_group_id for share;
  if not found then raise exception 'Gruppen finns inte längre'; end if;
  required_text:=group_name;
 else required_text:='RADERA ALL STATISTIK'; end if;
 select coalesce(array_agg(s.id order by s.id),'{}'::uuid[]) into ids
 from public.badminton_sessions s
 where s.status='completed' and (p_group_id is null or s.group_id=p_group_id);
 session_count:=cardinality(ids);
 select count(*) into round_count from public.badminton_rounds r where r.session_id=any(ids);
 select count(*) into position_count from public.badminton_round_players rp
 join public.badminton_rounds r on r.id=rp.round_id where r.session_id=any(ids);
 select count(*) into score_count from public.badminton_live_scores sc where sc.session_id=any(ids);
 select count(*) into active_count from public.badminton_sessions s
 where s.status='active' and (p_group_id is null or s.group_id=p_group_id);
 signature:=pg_catalog.md5(coalesce(p_group_id::text,'all')||':'||required_text||':'||ids::text||':'||round_count||':'||position_count||':'||score_count);
 result:=jsonb_build_object('group_id',p_group_id,'group_name',group_name,'confirmation',required_text,
  'signature',signature,'sessions',session_count,'rounds',round_count,'positions',position_count,
  'scores',score_count,'active_sessions',active_count,'deleted',false);
 if p_confirmation is null then return result; end if;
 if p_confirmation is distinct from required_text then raise exception 'Bekräftelsetexten stämmer inte'; end if;
 if p_expected_signature is null or p_expected_signature is distinct from signature then
  raise exception 'Historiken har ändrats. Stäng dialogen och hämta en ny förhandsvisning';
 end if;
 -- Every DELETE is constrained to completed sessions in the requested scope.
 -- Unexpected foreign-key restrictions abort the entire transaction; no partial deletion.
 delete from public.badminton_round_players rp using public.badminton_rounds r
 where rp.round_id=r.id and r.session_id=any(ids);
 delete from public.badminton_live_scores sc where sc.session_id=any(ids);
 delete from public.badminton_rounds r where r.session_id=any(ids);
 delete from public.badminton_sessions s where s.id=any(ids) and s.status='completed';
 return result||jsonb_build_object('deleted',true);
end $$;
revoke all on function public.manage_badminton_statistics(uuid,text,text) from public,anon,authenticated;
grant execute on function public.manage_badminton_statistics(uuid,text,text) to authenticated;
notify pgrst,'reload schema';
commit;
