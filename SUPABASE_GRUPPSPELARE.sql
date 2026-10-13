-- Kör hela filen i Supabase SQL Editor. Befintliga spelare behåller sitt ID,
-- sin ursprungsgrupp och sin historik. Extra grupper kopplas via en ny tabell.
-- Samma databas och gruppkopplingar används av test och ordinarie app.
begin;
create table if not exists public.badminton_player_groups (
 group_id uuid not null references public.badminton_groups(id) on delete cascade,
 player_id uuid not null references public.badminton_players(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key (group_id,player_id)
);
create index if not exists badminton_player_groups_player_idx on public.badminton_player_groups(player_id);
create index if not exists badminton_players_group_membership_idx on public.badminton_players(group_id);
alter table public.badminton_player_groups enable row level security;
revoke all on public.badminton_player_groups from public,anon,authenticated;

create or replace function public.badminton_can_manage_player_group(p_group_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists (
  select 1 from public.badminton_groups g where g.id=p_group_id and (
   public.is_badminton_super_admin() or exists (
    select 1 from public.badminton_group_admins ga
    join public.badminton_admins a on a.user_id=ga.user_id
    where ga.group_id=g.id and ga.user_id=auth.uid() and a.role='admin'
   )
  )
 );
$$;
create or replace function public.badminton_player_in_group(p_player_id uuid,p_group_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.badminton_players p where p.id=p_player_id
  and (p.group_id=p_group_id or exists(select 1 from public.badminton_player_groups pg
   where pg.player_id=p.id and pg.group_id=p_group_id)));
$$;
revoke all on function public.badminton_can_manage_player_group(uuid) from public,anon,authenticated;
revoke all on function public.badminton_player_in_group(uuid,uuid) from public,anon,authenticated;

create or replace function public.get_badminton_group_players(p_group_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if not public.badminton_can_manage_player_group(p_group_id) then raise exception 'Du saknar behörighet till gruppen'; end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',p.name,
  'country_code',p.country_code,'second_country_code',p.second_country_code,
  'player_gender',p.player_gender,'player_mode',p.player_mode,
  'home_group_id',p.group_id) order by lower(p.name),p.id),'[]'::jsonb)
 into result from public.badminton_players p where p.group_id=p_group_id or exists(
  select 1 from public.badminton_player_groups pg where pg.player_id=p.id and pg.group_id=p_group_id);
 return result;
end $$;

create or replace function public.get_badminton_player_catalog(p_group_id uuid,p_offset integer default 0)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if not public.badminton_can_manage_player_group(p_group_id) then raise exception 'Du saknar behörighet till gruppen'; end if;
 if p_offset is null or p_offset<0 then raise exception 'Ogiltig sidnumrering'; end if;
 select coalesce(jsonb_agg(item order by sort_name,player_id),'[]'::jsonb) into result from (
  select p.id player_id,lower(p.name) sort_name,jsonb_build_object(
   'id',p.id,'name',p.name,'country_code',p.country_code,'second_country_code',p.second_country_code,
   'already_member',public.badminton_player_in_group(p.id,p_group_id),
   'groups',coalesce((select jsonb_agg(g.name order by g.name) from public.badminton_groups g
    where g.id=p.group_id or exists(select 1 from public.badminton_player_groups pg where pg.player_id=p.id and pg.group_id=g.id)),'[]'::jsonb)
  ) item from public.badminton_players p
  order by lower(p.name),p.id limit 200 offset p_offset
 ) catalog;
 return result;
end $$;

create or replace function public.add_badminton_group_players(p_group_id uuid,p_player_ids uuid[])
returns integer language plpgsql security definer set search_path='' as $$
declare player_id uuid; player_name text; added integer; total integer:=0;
begin
 if not public.badminton_can_manage_player_group(p_group_id) then raise exception 'Du saknar behörighet till målgruppen'; end if;
 if p_player_ids is null or cardinality(p_player_ids)=0 or cardinality(p_player_ids)>1000 then raise exception 'Välj mellan 1 och 1000 spelare'; end if;
 -- Serialisera namnkoll och tilldelning per grupp, även mot Skapa ny spelare.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_group_id::text,0));
 for player_id in select distinct unnest(p_player_ids) order by 1 loop
  select p.name into player_name from public.badminton_players p where p.id=player_id for update;
  if not found then
   raise exception 'En vald spelare saknas i spelarregistret';
  end if;
  if public.badminton_player_in_group(player_id,p_group_id) then continue; end if;
  if exists(select 1 from public.badminton_players p where public.badminton_player_in_group(p.id,p_group_id)
    and lower(btrim(p.name))=lower(btrim(player_name))) then
   raise exception 'Gruppen har redan en annan spelare med namnet %. Använd ett särskiljande namn.',player_name;
  end if;
  insert into public.badminton_player_groups(group_id,player_id) values(p_group_id,player_id) on conflict do nothing;
  get diagnostics added=row_count; total:=total+added;
 end loop;
 return total;
end $$;

create or replace function public.create_badminton_group_player(p_group_id uuid,p_name text)
returns uuid language plpgsql security definer set search_path='' as $$
declare player_id uuid;
begin
 if not public.badminton_can_manage_player_group(p_group_id) then raise exception 'Du saknar behörighet till gruppen'; end if;
 if p_name is null or length(btrim(p_name)) not between 1 and 80 then raise exception 'Ange ett spelarnamn på 1–80 tecken'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_group_id::text,0));
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('badminton-player-name:'||lower(btrim(p_name)),0));
 if exists(select 1 from public.badminton_players p where lower(btrim(p.name))=lower(btrim(p_name))) then raise exception 'Namnet finns redan i spelarregistret. Använd Lägg till befintliga spelare, eller ange ett särskiljande namn för en annan person.'; end if;
 insert into public.badminton_players(group_id,name) values(p_group_id,btrim(p_name)) returning id into player_id;
 return player_id;
end $$;

create or replace function public.update_badminton_group_player(p_group_id uuid,p_player_id uuid,p_values jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if not public.badminton_can_manage_player_group(p_group_id) or not public.badminton_player_in_group(p_player_id,p_group_id) then
  raise exception 'Du saknar behörighet till spelaren i gruppen'; end if;
 if jsonb_typeof(p_values) is distinct from 'object'
  or (p_values->>'country_code') is null or (p_values->>'country_code') !~ '^[A-Z]{2}$'
  or (p_values->>'second_country_code' is not null and (p_values->>'second_country_code') !~ '^[A-Z]{2}$')
  or coalesce(p_values->>'player_gender','') not in ('man','kvinna')
  or coalesce(p_values->>'player_mode','') not in ('normal','moreSingles','onlySingles') then
  raise exception 'Ogiltiga spelarinställningar'; end if;
 update public.badminton_players p set country_code=p_values->>'country_code',second_country_code=p_values->>'second_country_code',
  player_gender=p_values->>'player_gender',player_mode=p_values->>'player_mode' where p.id=p_player_id
  returning to_jsonb(p) into result;
 return jsonb_build_array(result);
end $$;

-- Skydda delade profiler från äldre appens Radera spelare/Radera grupp.
create or replace function public.badminton_protect_shared_player()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='UPDATE' and new.group_id is not distinct from old.group_id then return new; end if;
 if exists(select 1 from public.badminton_player_groups pg where pg.player_id=old.id and pg.group_id<>old.group_id) then
  raise exception 'Spelaren % används i andra grupper och kan inte raderas eller flyttas från ursprungsgruppen',old.name;
 end if;
 if tg_op='DELETE' then return old; end if; return new;
end $$;
drop trigger if exists badminton_protect_shared_player on public.badminton_players;
create trigger badminton_protect_shared_player before delete or update of group_id on public.badminton_players
 for each row execute function public.badminton_protect_shared_player();
revoke all on function public.badminton_protect_shared_player() from public,anon,authenticated;

create or replace function public.remove_badminton_shared_group_player(p_group_id uuid,p_player_id uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.badminton_can_manage_player_group(p_group_id) then raise exception 'Du saknar behörighet till gruppen'; end if;
 if exists(select 1 from public.badminton_players p where p.id=p_player_id and p.group_id=p_group_id) then
  raise exception 'Spelaren hör till sin ursprungsgrupp. Den profilen kan inte kopplas bort här.'; end if;
 if exists(select 1 from public.badminton_sessions s join public.badminton_rounds r on r.session_id=s.id
  join public.badminton_round_players rp on rp.round_id=r.id
  where s.group_id=p_group_id and s.status='active' and rp.player_id=p_player_id) then
  raise exception 'Spelaren används i ett aktivt spel. Avsluta spelet innan gruppkopplingen tas bort.'; end if;
 delete from public.badminton_player_groups pg where pg.group_id=p_group_id and pg.player_id=p_player_id;
end $$;

-- Kontrollerad sparning av placeringar, också för spelare med annan ursprungsgrupp.
create or replace function public.save_badminton_group_round_players(p_session_id uuid,p_positions jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare session_group uuid; courts integer; position jsonb; r_id uuid; p_id uuid;
        activity text; court integer; team integer;
begin
 select s.group_id,s.court_count into session_group,courts from public.badminton_sessions s
 where s.id=p_session_id and s.status='active' for update;
 if not found or not public.badminton_can_manage_player_group(session_group) then raise exception 'Du saknar behörighet till det aktiva spelet'; end if;
 if jsonb_typeof(p_positions) is distinct from 'array' then raise exception 'Ogiltiga spelarplaceringar'; end if;
 if jsonb_array_length(p_positions)=0 or jsonb_array_length(p_positions)>12000 then raise exception 'Ogiltigt antal spelarplaceringar'; end if;
 if exists(select 1 from public.badminton_round_players rp join public.badminton_rounds r on r.id=rp.round_id
  where r.session_id=p_session_id) then raise exception 'Spelets spelarplaceringar är redan sparade'; end if;
 for position in select value from jsonb_array_elements(p_positions) loop
  r_id:=(position->>'round_id')::uuid; p_id:=(position->>'player_id')::uuid;
  activity:=position->>'activity'; court:=(position->>'court_number')::integer; team:=(position->>'team_number')::integer;
  if not exists(select 1 from public.badminton_rounds r where r.id=r_id and r.session_id=p_session_id)
   or not public.badminton_player_in_group(p_id,session_group) then raise exception 'Spelaren eller rundan saknar koppling till spelets grupp'; end if;
  if activity is null or activity not in ('rest','single','double')
   or (activity='rest' and (court is not null or team is not null))
   or (activity<>'rest' and (court is null or court<1 or court>courts or team is null or team not in (1,2))) then
   raise exception 'Ogiltig bana, lag eller aktivitet'; end if;
  if exists(select 1 from public.badminton_round_players rp where rp.round_id=r_id and rp.player_id=p_id) then
   raise exception 'Samma spelare kan bara placeras en gång i en runda'; end if;
  insert into public.badminton_round_players(round_id,player_id,court_number,team_number,activity)
  values(r_id,p_id,court,team,activity);
 end loop;
end $$;

revoke all on function public.get_badminton_group_players(uuid) from public,anon,authenticated;
revoke all on function public.get_badminton_player_catalog(uuid,integer) from public,anon,authenticated;
revoke all on function public.add_badminton_group_players(uuid,uuid[]) from public,anon,authenticated;
revoke all on function public.create_badminton_group_player(uuid,text) from public,anon,authenticated;
revoke all on function public.update_badminton_group_player(uuid,uuid,jsonb) from public,anon,authenticated;
revoke all on function public.remove_badminton_shared_group_player(uuid,uuid) from public,anon,authenticated;
revoke all on function public.save_badminton_group_round_players(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.get_badminton_group_players(uuid) to authenticated;
grant execute on function public.get_badminton_player_catalog(uuid,integer) to authenticated;
grant execute on function public.add_badminton_group_players(uuid,uuid[]) to authenticated;
grant execute on function public.create_badminton_group_player(uuid,text) to authenticated;
grant execute on function public.update_badminton_group_player(uuid,uuid,jsonb) to authenticated;
grant execute on function public.remove_badminton_shared_group_player(uuid,uuid) to authenticated;
grant execute on function public.save_badminton_group_round_players(uuid,jsonb) to authenticated;

-- Live och statistik följer spelets sparade spelar-ID, även i extra grupper.
create or replace function public.get_badminton_live_view_v2(
 p_session_id uuid, p_viewer_token text
) returns jsonb language plpgsql security definer set search_path='' as $$
declare live jsonb; enriched jsonb; session_group uuid;
begin
 live:=to_jsonb(public.get_badminton_live_view(p_session_id,p_viewer_token));
 if live is null or jsonb_typeof(live->'players') is distinct from 'array' or live ? 'error' then
  raise exception 'Ogiltig eller otillgänglig Live-session';
 end if;
 select group_id into session_group from public.badminton_sessions where id=p_session_id;
 if session_group is null then raise exception 'Sessionen saknas'; end if;
 select coalesce(jsonb_agg(item || jsonb_build_object(
  'country_code',coalesce(player.country_code,'SE'),
  'second_country_code',player.second_country_code,
  'player_gender',coalesce(player.player_gender,'man'),
  'player_id',player.id
 ) order by ordinal),'[]'::jsonb) into enriched
 from jsonb_array_elements(live->'players') with ordinality as entries(item,ordinal)
 left join lateral (
  select p.id,p.country_code,p.second_country_code,p.player_gender
  from public.badminton_rounds r
  join public.badminton_round_players rp on rp.round_id=r.id
  join public.badminton_players p on p.id=rp.player_id
  where r.session_id=p_session_id and r.round_number=(live->>'current_round')::integer
   and p.name=item->>'name'
   and rp.court_number is not distinct from (item->>'court')::integer
   and rp.team_number is not distinct from (item->>'team')::integer
   and rp.activity is not distinct from item->>'activity'
  order by p.id limit 1
 ) player on true;
 return jsonb_set(live,'{players}',enriched);
end $$;
revoke all on function public.get_badminton_live_view_v2(uuid,text) from public;
grant execute on function public.get_badminton_live_view_v2(uuid,text) to anon,authenticated;

-- Live och statistik följer spelets sparade spelar-ID, även i extra grupper.
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
  join public.badminton_players p on p.id=rp.player_id
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
