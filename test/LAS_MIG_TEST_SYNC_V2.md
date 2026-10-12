# Testversion v2: synkronisering och två flaggor

Öppna https://scaniagotaxi.github.io/Fj-derligan/test/ efter GitHub Pages-publicering.
Denna version utgår från Badminton_App_v2.0_Morka_Centrerade_Popup_TEST.zip,
behåller mörka centrerade popupfönster och använder de tydligare På/Av-reglagen.

## Vad som har reparerats

- Spelarinställningar hämtas och sparas med spelar-ID och grupp-ID.
- Flagga 2 är valfri och visas tillsammans med flagga 1 i spelvyn och Live.
- Live använder databasens kön och flaggor.
- QR-sessionens variabel är deklarerad; QR-biblioteket laddas lokalt.
- Poäng sparas per session, runda och bana; Live läser dem från poäng-RPC:n.
- Rundbyte och färdigmarkering försöker igen efter server-/nätverksfel.
- Omladdning kontrollerar och återställer molnkopplingen för ett tidigare sparat spel.
- Service worker fungerar och rensar bara testsidans egna cachenycklar.
- Testsidans localStorage och BroadcastChannel-namn är separata från ordinarie app.
  Logga därför in på nytt på testsidan.

## Supabase-förutsättningar – inte utförda av Codex

Använd en testgrupp. Supabase-projektet delas fortfarande med ordinarie app.
Kodtester med simulerad databas bevisar klientens beteende men verifierar inte
produktionens schema, RLS eller RPC-definitioner.

1. Granska `SUPABASE_TEST_SYNC_V2.sql` och kör den i Supabase SQL Editor.
   Den lägger till fyra spelarinställningskolumner om de saknas och en separat
   `get_badminton_live_view_v2` som berikar den befintliga tokenkontrollerade
   Live-funktionen. Den befintliga Live-funktionen ersätts inte.
   Befintlig RLS för `badminton_players` måste tillåta Admin att läsa och uppdatera
   spelare i sin grupp. Klienten visar fel om sparningen nekas.

2. Granska och kör `SUPABASE_LIVE_POANG.sql`.
   Den är nu anpassad till det verifierade schemat: Super Admin eller Admin i
   `badminton_group_admins` får hantera poäng för gruppens aktiva spel. Den kräver
   ingen `badminton_sessions.user_id`. Anonyma Live-besökare får bara läsa poäng
   via giltig visningskod. Direkt åtkomst till poängtabellen är stängd för klienter.
   Skriptet skapar tabell och fyra behörighetskontrollerade funktioner i en
   transaktion. Kör hela filen, inte enskilda utdrag.

Inga SQL-skript har körts mot din databas som del av denna ändring.

## Test med två enheter

1. Logga in på testsidan och välj en testgrupp.
2. Hämta gruppens spelare. Ändra flagga 1, flagga 2, kön och spelpreferens.
   Kontrollera att status visar “Spelarinställningar sparade i Supabase”.
3. På en annan enhet: logga in, välj samma grupp och hämta spelarna.
   Inställningarna ska stämma. De hämtas vid import/återupptagning, inte genom
   bakgrundspollning av en öppen spelarlista.
4. Skapa eller återuppta ett testspel och skapa en QR/länk. Öppna länken på den
   andra enheten utan Admin-inloggning. Kontrollera två flaggor och spelarfigurer.
5. Aktivera poängräkning, ändra poäng och byt runda. Kontrollera Live-vyn.
6. Markera rundan som klar, ladda om Admin-sidan och kontrollera att molnkopplingen
   återställs. Bekräfta därefter poängändring och rundbyte i Live.
7. Vid fel, kopiera statusmeddelandet. Skicka inga lösenord eller åtkomsttoken.

## Automatiserad verifiering

Starta från projektroten:

    python3 -m http.server 8003 --bind 127.0.0.1

I en annan terminal i samma rot, med Playwright tillgängligt:

    NODE_PATH=/workspace/onboarding-tools/node_modules node validation/sync-v2.cjs

Testet använder Chromium i `/usr/bin/chromium` och endast lokal testsida plus
simulerade Supabase-svar. Det använder inga riktiga konton och skriver ingen
produktionsdata. Det verifierar import/sparning, nekad sparning, två flaggor,
QR-kod, poäng, separat Live-webbläsare, tillfälliga serverfel, reload och offline.
