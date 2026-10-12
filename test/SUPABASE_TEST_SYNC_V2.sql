-- Review and run in Supabase SQL Editor. No rows are deleted or rewritten.
-- Existing player RLS and the existing Live token validation remain in use.
begin;
alter table public.badminton_players
 add column if not exists country_code text,
 add column if not exists second_country_code text,
 add column if not exists player_gender text default 'man',
 add column if not exists player_mode text default 'normal';

-- Keep the existing RPC intact. Enrich only a successfully authorized Live response.
create or replace function public.get_badminton_live_view_v2(
 p_session_id uuid, p_viewer_token text
) returns jsonb language plpgsql security definer set search_path=public as $$
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
  from public.badminton_players p
  where p.group_id=session_group and p.name=item->>'name'
  order by p.id limit 1
 ) player on true;
 return jsonb_set(live,'{players}',enriched);
end $$;
revoke all on function public.get_badminton_live_view_v2(uuid,text) from public;
grant execute on function public.get_badminton_live_view_v2(uuid,text) to anon,authenticated;
commit;
