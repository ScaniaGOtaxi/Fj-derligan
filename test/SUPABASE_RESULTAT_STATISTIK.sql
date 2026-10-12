-- Result history for the verified group-admin schema. Read-only function.
begin;
create or replace function public.get_badminton_result_statistics(p_group_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare results jsonb;
begin
 if auth.uid() is null then raise exception 'Inloggning krävs'; end if;
 if not public.is_badminton_super_admin() and not exists (
  select 1 from public.badminton_group_admins ga
  join public.badminton_admins a on a.user_id=ga.user_id
  where ga.group_id=p_group_id and ga.user_id=auth.uid() and a.role='admin'
 ) then raise exception 'Du saknar behörighet till gruppen'; end if;
 select coalesce(jsonb_agg(jsonb_build_object(
  'session_id',m.session_id,'session_name',m.session_name,
  'round_number',m.round_number,'round_status','completed',
  'court_number',m.court_number,'red',m.red,'blue',m.blue,'players',m.players
 ) order by m.created_at,m.round_number,m.court_number),'[]'::jsonb)
 into results from (
  select s.id session_id,s.name session_name,s.created_at,r.round_number,
   rp.court_number,sc.red,sc.blue,
   jsonb_agg(jsonb_build_object('id',p.id,'name',p.name,'team',rp.team_number)
    order by rp.team_number,p.name,p.id) players
  from public.badminton_sessions s
  join public.badminton_rounds r on r.session_id=s.id and r.status='completed'
  join public.badminton_round_players rp on rp.round_id=r.id
   and rp.activity in ('single','double') and rp.court_number is not null
  join public.badminton_players p on p.id=rp.player_id and p.group_id=p_group_id
  left join public.badminton_live_scores sc on sc.session_id=s.id
   and sc.round_number=r.round_number and sc.court_number=rp.court_number
  where s.group_id=p_group_id
  group by s.id,s.name,s.created_at,r.round_number,rp.court_number,sc.red,sc.blue
 ) m;
 return results;
end $$;
revoke all on function public.get_badminton_result_statistics(uuid) from public,anon,authenticated;
grant execute on function public.get_badminton_result_statistics(uuid) to authenticated;
notify pgrst, 'reload schema';
commit;
