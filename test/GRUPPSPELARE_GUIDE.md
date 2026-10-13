# Befintliga spelare i flera grupper — testversion

Funktionen finns bara i `test/`. Admin kan söka bland samtliga spelarprofiler men bara lägga till dem i grupper hen får hantera. Super Admin kan lägga till dem i alla grupper. Tilldelningen kopplar samma spelar-ID till ytterligare en grupp; den kopierar inte spelarprofilen.

## Installera

1. Uppdatera filerna i GitHub-repots **test/** med testversionens filer. Ändra inte filerna i repots rot.
2. Öppna **test/SUPABASE_GRUPPSPELARE.sql**, kopiera hela innehållet.
3. I rätt Supabase-projekt: **SQL Editor → New query**. Klistra in innehållet och tryck **Run**. Förväntat besked: **Success. No rows returned**.
4. Ladda om **https://scaniagotaxi.github.io/Fj-derligan/test/** med **Ctrl+F5**.

Grundtabellerna, `is_badminton_super_admin`, befintlig Live-tokenkontroll, profilkolumnerna och `badminton_live_scores` måste redan finnas. Dessa har använts av tidigare funktioner i appen. Hela filen körs i en transaktion och kan köras igen. Vid ett SQL-fel: kopiera felmeddelandet; kör inte enstaka delar för att försöka komma förbi det.

**Databasen delas med den ordinarie appen.** Migrationen behåller befintliga spelar-ID och ursprungsgrupper, lägger till extra gruppkopplingar och uppdaterar Live-/statistikfunktionerna så att delade spelare visas. Den lägger också till ett skydd mot att delade profiler raderas genom den äldre appen. Ordinarie appens äldre gruppfilter visar fortfarande bara ursprungsgruppens spelare; använd testsidan för den nya funktionen.

## Använd

1. Logga in som Admin eller Super Admin och välj målgruppen under **Spelinställningar**. Gruppens spelarlista hämtas automatiskt. Super Admin kan först skapa en ny grupp och välja **Hämta grupper**.
2. Tryck **Lägg till befintliga spelare**. Sök på spelarnamn eller gruppnamn. Listan visar alla spelarprofiler, också från grupper du inte administrerar. Gruppnamnen hjälper dig att skilja personer åt.
3. Kryssa i önskade spelare. **Markera sökträffar** markerar de synliga träffarna. Urvalet behålls när du ändrar sökningen; **Avmarkera alla** tömmer hela urvalet.
4. Tryck **Lägg till i gruppen**. Spelarna ligger kvar i sina gamla grupper. Redan tillagda spelare går inte att lägga till igen.
5. Saknas en person: skriv namnet vid **Skapa ny spelare i gruppen** och tryck på knappen. Ett redan befintligt namn ger ett meddelande att använda den befintliga profilen. För två olika personer med samma namn behövs särskiljande namn, till exempel för- och efternamn.
6. Markera därefter **dagens deltagare** i gruppens spelarlista och välj **Skapa spelschema**. Gruppmedlemskap väljer inte automatiskt någon till dagens spel. Ny hämtning av samma grupp bevarar markeringarna. Byte av grupp börjar med inga markerade deltagare.

Namn, flaggor, kön och spelpreferens hör till samma profil i alla grupper. Ändringar av profilinställningar gäller därför i alla spelarens grupper när respektive enhet hämtar dem igen. Befintliga separata profiler med samma namn slås inte ihop automatiskt. Två sådana profiler kan inte läggas till med samma namn i samma grupp eftersom rotationen fortfarande identifierar namn i spelarlistan.

Super Admins gruppöversikt visar **Ta bort gruppkoppling** för delade spelare. Profilen, andra grupper och sparad matchhistorik behålls. Kopplingen kan inte tas bort medan spelaren används i ett aktivt spel. Ursprungsprofilen och ursprungsgruppen kan inte raderas så länge profilen används i ytterligare grupper.

## Kontroller utförda lokalt

- Migrationen körd två gånger i PostgreSQL via PGlite; profil- och historikdata bevaras.
- Behörighetskontroller körda som `authenticated` och `anon`, inklusive nekad åtkomst och nekad tilldelning till annan Admins grupp.
- Webbläsartest med Chromium och samma SQL-funktioner: Admin, Super Admin, nyskapad grupp, sökning, markering, fel/retry, skapande, profiluppdatering och sparat schema.
- Mobilvy 375 px: popupen ryms och går att använda.
- Regressionstester för urval, flaggor, Live & QR, poängsynkronisering, statistik och offline-start.

Detta verifierar en lokal databas med den tidigare rapporterade grundstrukturen. Installation i ditt riktiga Supabase-projekt behöver fortfarande genomföras. Inga riktiga användarkonton, grupper eller spel har ändrats av testerna.

Testkommandon från repots rot, med Playwright, Chromium och `@electric-sql/pglite` tillgängliga:

```sh
python3 -m http.server 8008
# Kör följande i en andra terminal:
APP_URL=http://127.0.0.1:8008/test/ node validation/group-players-db.cjs
APP_URL=http://127.0.0.1:8008/test/ node validation/group-players-ui.cjs
APP_URL=http://127.0.0.1:8008/test/ node validation/super-admin-selection.cjs
APP_URL=http://127.0.0.1:8008/test/ node validation/sync-v2.cjs
APP_URL=http://127.0.0.1:8008/test/ node validation/results.cjs
```
