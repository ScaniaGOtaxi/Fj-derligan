# Produktionspaket – https://zdeb.se/app/

Datum: 2026-10-17. Källa: testversionen, commit eaf2e67a454518bba20e947c8134659306e7bd39.

1. Säkerhetskopiera befintliga filer på One.com innan uppdatering.
2. Packa upp ZIP-filen. Ladda innehållet i app/ till webbplatsens /app/-mapp. index.html ska hamna på https://zdeb.se/app/index.html. Lägg inte en extra app-mapp inuti /app/.
3. Ladda om https://zdeb.se/app/ med Ctrl+F5. På mobil: stäng och öppna den installerade appen vid behov.
4. För den nya Super Admin-funktionen: kör hela database/SUPABASE_RADERA_STATISTIK.sql i Supabase SQL Editor om den inte redan är installerad. Installationen raderar ingen statistik. SQL-filerna behöver inte laddas upp till webbhotellet.
5. Gruppen använder samma Supabase-databas som GitHub-versionen. Radering av serverhistorik gäller därför alla webbplatser som använder denna databas. Pågående spel skyddas av den nya funktionen.
6. Behåll https://zdeb.se/app/ och https://zdeb.se/app/index.html bland Supabase Authentication → URL Configuration → Redirect URLs. Kontrollera lösenordsåterställning och eventuella inbjudningslänkar efter uppladdning.

Paketet innehåller kompakta inställningar, spelarmenyer, rundtips under spelarlistan, standardinställningarna enligt bilden, rättat trepersonersschema och Super Admin-radering av avslutad serverhistorik per grupp eller alla grupper med förhandsvisning och skriven bekräftelse. Databasens spelare, grupper och konton behålls.

Appen använder relativa resurssökvägar under /app/, egen cache och lokala inställningar med prefix badminton-zdeb-app. Lokala inställningar på github.io flyttas inte automatiskt till zdeb.se. Supabases publika webbläsarnyckel finns i koden; inga service_role-nycklar eller One.com-lösenord ingår.

Detta är ett färdigt uppladdningspaket. Ingen uppladdning till One.com, SQL-installation eller radering av verkliga data utförs genom att skapa eller hämta ZIP-filen.
