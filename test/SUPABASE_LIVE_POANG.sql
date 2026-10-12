begin;
-- Kör i Supabase SQL Editor. Live-poäng kan bara skrivas av inloggad
-- användare med tillgång till spelsessionen enligt befintlig databaspolicy.
create table if not exists public.badminton_live_scores (
 session_id uuid not null references public.badminton_sessions(id) on delete cascade,
 round_number integer not null,
 court_number integer not null,
 red integer not null default 0 check(red >= 0),
 blue integer not null default 0 check(blue >= 0),
 enabled boolean not null default false,
 updated_at timestamptz not null default now(),
 primary key(session_id,round_number,court_number)
);
alter table public.badminton_live_scores enable row level security;
-- Använd befintliga sessioners rättighetskontroll; administratören måste
-- kunna uppdatera sessionen för att skriva poäng.
create or replace function public.set_badminton_live_scores(
 p_session_id uuid,p_round_number integer,p_enabled boolean,p_scores jsonb
) returns void language plpgsql security invoker set search_path=public as $$
declare c text; v jsonb;
begin
 if auth.uid() is null then raise exception 'Logga in först'; end if;
 -- Endast användare som äger sessionen. Anpassa om ert schema använder annat fältnamn.
 if not exists(select 1 from public.badminton_sessions where id=p_session_id and user_id=auth.uid()) then
   raise exception 'Du har inte behörighet till sessionen';
 end if;
 for c,v in select key,value from jsonb_each(p_scores) loop
  insert into public.badminton_live_scores(session_id,round_number,court_number,red,blue,enabled)
  values(p_session_id,p_round_number,c::integer,greatest(0,(v->>'red')::integer),greatest(0,(v->>'blue')::integer),p_enabled)
  on conflict(session_id,round_number,court_number) do update set red=excluded.red,blue=excluded.blue,enabled=excluded.enabled,updated_at=now();
 end loop;
end $$;
-- Viewer-token kontrolleras av den befintliga Live-RPC:n innan poängen lämnas ut.
create or replace function public.get_badminton_live_scores(
 p_session_id uuid,p_viewer_token text
) returns jsonb language plpgsql security definer set search_path=public as $$
declare live jsonb; n integer; output jsonb;
begin
 live:=to_jsonb(public.get_badminton_live_view(p_session_id,p_viewer_token));
 n:=(live->>'current_round')::integer;
 select coalesce(jsonb_object_agg(court_number,jsonb_build_object('red',red,'blue',blue)),'{}'::jsonb)
 into output from public.badminton_live_scores where session_id=p_session_id and round_number=n;
 return jsonb_build_object('enabled',coalesce((select bool_or(enabled) from public.badminton_live_scores where session_id=p_session_id and round_number=n),false),'scores',output);
end $$;
revoke all on function public.set_badminton_live_scores(uuid,integer,boolean,jsonb) from public;
grant execute on function public.set_badminton_live_scores(uuid,integer,boolean,jsonb) to authenticated;
revoke all on function public.get_badminton_live_scores(uuid,text) from public;
grant execute on function public.get_badminton_live_scores(uuid,text) to anon,authenticated;

-- Policies required by the SECURITY INVOKER writer above.
-- This file requires badminton_sessions.user_id, as does the original writer.
-- Owners only; do not broaden these rules to anonymous writes.
drop policy if exists badminton_test_scores_owner_select_v2 on public.badminton_live_scores;
create policy badminton_test_scores_owner_select_v2 on public.badminton_live_scores
 for select to authenticated using (exists(select 1 from public.badminton_sessions s where s.id=session_id and s.user_id=auth.uid()));
drop policy if exists badminton_test_scores_owner_insert_v2 on public.badminton_live_scores;
create policy badminton_test_scores_owner_insert_v2 on public.badminton_live_scores
 for insert to authenticated with check (exists(select 1 from public.badminton_sessions s where s.id=session_id and s.user_id=auth.uid()));
drop policy if exists badminton_test_scores_owner_update_v2 on public.badminton_live_scores;
create policy badminton_test_scores_owner_update_v2 on public.badminton_live_scores
 for update to authenticated using (exists(select 1 from public.badminton_sessions s where s.id=session_id and s.user_id=auth.uid()))
 with check (exists(select 1 from public.badminton_sessions s where s.id=session_id and s.user_id=auth.uid()));
grant select,insert,update on public.badminton_live_scores to authenticated;

commit;
