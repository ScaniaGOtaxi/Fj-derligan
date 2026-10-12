-- Adapted to the verified group-admin schema. Review, then run the whole file.
begin;
create table if not exists public.badminton_live_scores (
 session_id uuid not null references public.badminton_sessions(id) on delete cascade,
 round_number integer not null check(round_number > 0),
 court_number integer not null check(court_number > 0),
 red integer not null default 0 check(red >= 0),
 blue integer not null default 0 check(blue >= 0),
 enabled boolean not null default false,
 updated_at timestamptz not null default now(),
 primary key(session_id,round_number,court_number)
);
alter table public.badminton_live_scores enable row level security;
-- All client access goes through the checked functions below.
revoke all on public.badminton_live_scores from public,anon,authenticated;

create or replace function public.badminton_can_manage_live_scores(p_session_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists (
  select 1 from public.badminton_sessions s
  where s.id=p_session_id and s.status='active' and (
   public.is_badminton_super_admin() or exists (
    select 1 from public.badminton_group_admins ga
    join public.badminton_admins a on a.user_id=ga.user_id
    where ga.group_id=s.group_id and ga.user_id=auth.uid() and a.role='admin'
   )
  )
 );
$$;
revoke all on function public.badminton_can_manage_live_scores(uuid) from public,anon,authenticated;

create or replace function public.set_badminton_live_scores(
 p_session_id uuid,p_round_number integer,p_enabled boolean,p_scores jsonb
) returns void language plpgsql security definer set search_path='' as $$
declare c text; v jsonb; court_count integer;
begin
 if not public.badminton_can_manage_live_scores(p_session_id) then
  raise exception 'Du saknar behörighet till det aktiva spelets grupp';
 end if;
 if not exists(select 1 from public.badminton_rounds r where r.session_id=p_session_id and r.round_number=p_round_number) then
  raise exception 'Rundan saknas';
 end if;
 if p_enabled is null or jsonb_typeof(p_scores) is distinct from 'object' then
  raise exception 'Ogiltiga poänginställningar';
 end if;
 select s.court_count into court_count from public.badminton_sessions s where s.id=p_session_id;
 for c,v in select key,value from jsonb_each(p_scores) loop
  if c !~ '^[1-3]$' or c::integer > court_count then raise exception 'Ogiltigt bannummer'; end if;
  if jsonb_typeof(v) is distinct from 'object' or v->>'red' is null or v->>'blue' is null
   or (v->>'red') !~ '^[0-9]+$' or (v->>'blue') !~ '^[0-9]+$' then
   raise exception 'Poäng måste vara icke-negativa heltal';
  end if;
  insert into public.badminton_live_scores(session_id,round_number,court_number,red,blue,enabled)
  values(p_session_id,p_round_number,c::integer,(v->>'red')::integer,(v->>'blue')::integer,p_enabled)
  on conflict(session_id,round_number,court_number) do update
   set red=excluded.red,blue=excluded.blue,enabled=excluded.enabled,updated_at=now();
 end loop;
end $$;

create or replace function public.get_badminton_admin_scores(p_session_id uuid,p_round_number integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if not public.badminton_can_manage_live_scores(p_session_id) then
  raise exception 'Du saknar behörighet till det aktiva spelets grupp';
 end if;
 select coalesce(jsonb_agg(jsonb_build_object('court_number',court_number,'red',red,'blue',blue,'enabled',enabled) order by court_number),'[]'::jsonb)
 into result from public.badminton_live_scores where session_id=p_session_id and round_number=p_round_number;
 return result;
end $$;

create or replace function public.get_badminton_live_scores(p_session_id uuid,p_viewer_token text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare live jsonb; n integer; result jsonb; score_enabled boolean;
begin
 -- Existing function raises for invalid tokens and inactive sessions.
 live:=public.get_badminton_live_view(p_session_id,p_viewer_token);
 n:=(live->>'current_round')::integer;
 if n is null then raise exception 'Live-rundan saknas'; end if;
 select coalesce(jsonb_object_agg(court_number,jsonb_build_object('red',red,'blue',blue)),'{}'::jsonb),coalesce(bool_or(enabled),false)
 into result,score_enabled from public.badminton_live_scores where session_id=p_session_id and round_number=n;
 return jsonb_build_object('round_number',n,'enabled',score_enabled,'scores',result);
end $$;
revoke all on function public.set_badminton_live_scores(uuid,integer,boolean,jsonb) from public,anon,authenticated;
revoke all on function public.get_badminton_admin_scores(uuid,integer) from public,anon,authenticated;
revoke all on function public.get_badminton_live_scores(uuid,text) from public,anon,authenticated;
grant execute on function public.set_badminton_live_scores(uuid,integer,boolean,jsonb) to authenticated;
grant execute on function public.get_badminton_admin_scores(uuid,integer) to authenticated;
grant execute on function public.get_badminton_live_scores(uuid,text) to anon,authenticated;
notify pgrst, 'reload schema';
commit;
