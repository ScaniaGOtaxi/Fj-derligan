# Super Admin – radera serverstatistik

Funktionen är förberedd för testappen. Installation av SQL-filen skapar endast serverfunktionen och raderar ingen historik.

## Aktivera
1. Öppna `test/SUPABASE_RADERA_STATISTIK.sql` i GitHub.
2. Kopiera hela filen till rätt Supabase-projekts SQL Editor och kör hela filen.
3. Ladda om testappen. Logga in som Super Admin och öppna Statistik → Radera serverstatistik – Super Admin.

Test- och produktionsappen delar för närvarande samma Supabase-databas. En verklig radering från testappen påverkar därför även den ordinarie appens serverhistorik.

## Omfattning
- Vald grupp: endast avslutade (`status = completed`) spel i den valda gruppen.
- Alla grupper: avslutade spel i samtliga grupper.
- Spel, rundor, spelarplaceringar och poängposter för dessa spel raderas.
- Pågående spel, inklusive deras färdigspelade rundor och poäng, behålls.
- Andra sessionstatusar än completed behålls också.
- Spelarprofiler, gruppmedlemskap, grupper och administratörskonton behålls.
- Lokal statistik och lokalt sparade kopior i webbläsare raderas inte. Enheter kan visa äldre uppgifter tills de hämtar historiken igen.
- Raderingen går inte att ångra i appen. Använd databasens backup/återställning vid behov; funktionen skapar ingen backup.

## Användning
Välj grupp under Spelinställningar om gruppalternativet ska användas. Under Statistik öppnas raderingsverktyget. Förhandsvisningen visar berörda poster och hur många pågående spel som skyddas. Avbryt ändrar ingen data.

Skriv exakt gruppens namn, eller `RADERA ALL STATISTIK` för alla grupper. Först därefter går det att trycka Radera permanent. Om historiken har ändrats sedan förhandsvisningen måste dialogen stängas och öppnas igen. Ingen automatisk radering sker när en grupp väljs eller en dialog öppnas.

## Serverkontroller och verifiering
Serverfunktionen kräver både inloggning och Super Admin. Vanlig Admin och anonym åtkomst nekas även via direkta API-anrop. Funktionen kontrollerar skriven bekräftelse och en signatur över förhandsvisningens underlag. Raderingen sker i en transaktion. Om en okänd referens hindrar radering avbryts allt; inga delvis raderade rundor lämnas kvar.

Förutsätter befintliga grundtabeller, `is_badminton_super_admin()` och `badminton_live_scores`. Om ett annat system lagt till referenser utan kaskadradering kan dessa blockera radering. Utred då databasfelet; ta inte bort begränsningar eller grupper för att kringgå det.

Testat lokalt i PostgreSQL/PGlite: behörigheter, upprepad installation, gruppomfattning, alla grupper, bekräftelse, ändrad förhandsvisning, skydd av pågående spel och full återställning vid referensfel. Chromium-test använder simulerade svar för dialog, avbryt, retry och synlighet. Ingen verklig serverstatistik har raderats under utvecklingen.
