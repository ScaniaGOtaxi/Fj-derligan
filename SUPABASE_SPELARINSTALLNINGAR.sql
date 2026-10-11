-- Kör i Supabase SQL Editor en gång innan den nya ZIP-versionen används.
-- Befintliga spelare och sessioner behålls.
alter table public.badminton_players
  add column if not exists country_code text,
  add column if not exists second_country_code text,
  add column if not exists player_gender text default 'man',
  add column if not exists player_mode text default 'normal';

-- Befintliga RLS-regler för badminton_players fortsätter gälla.
-- Inga nya öppna rättigheter eller publika skrivregler läggs till.
