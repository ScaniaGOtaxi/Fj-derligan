# Badminton App – Netlify, 18 oktober 2026

## Ladda upp
1. Packa upp ZIP-filen.
2. Öppna ditt befintliga Netlify-projekt för https://badminkton.netlify.app/ → Deploys.
3. Dra in den uppackade mappen som innehåller index.html direkt. Ingen byggprocess behövs.
4. När Netlify är klar: ladda om sidan och öppna Hjälp.

## Ingår
Alla funktioner i den senaste testversionen, inklusive:
- Uppdaterad hjälp utan det borttagna stycket om startbilden.
- Kompakt grupp- och spelarhantering samt rundtips.
- Serverstatistik för Admin och Super Admin.
- Dagsrapport och diplom med godkänd grafik.
- Dela diplom som bild, dela bara första PDF-sidan eller hela rapporten.
- Utloggning efter lyckat lösenordsbyte och återställning.
- Automatiskt avslut när alla rundor och väntande poäng är sparade.
- Orange Avsluta spel-knapp med manuellt avslut och förklaring när den är inaktiv.
- Popup efter avslut med Visa statistik och Stäng; den återkommer inte när ett avslutat spel laddas om.

## Databas och inställningar
Samma befintliga Supabase-databas och konton används. Inga nya SQL-installationer behövs för dessa senaste ändringar. Befintliga serverfunktioner för gruppspelare, poäng, statistik och statistik-radering måste redan vara installerade.
Lokala inställningar behåller prefix badminton-netlify. Sparade val på den befintliga Netlify-webbplatsen behålls.
Lösenordsåterställning kräver att Supabase Authentication → URL Configuration → Redirect URLs tillåter https://badminkton.netlify.app/ och https://badminkton.netlify.app/index.html.

## Avsluta spel
När samtliga rundor är Klar och sparade avslutas molnspelet automatiskt efter att väntande poäng har sparats. Avsluta spel kan också avsluta tidigare efter bekräftelse; ospelade rundor markeras inte som spelade. Resultaten behålls i Statistik och Live-länken upphör att fungera.
För ett äldre spel med alla rundor klara: återuppta spelet eller ladda om så att appen kan kontrollera och avsluta det.

## Dela diplom
Dela diplom som bild skickar första sidan som PNG till mobilens delningsmeny. Dela diplom via WhatsApp delar bara första sidan som PDF. Dela PDF · WhatsApp delar hela rapporten.
Webbläsaren avgör om fildelning stöds. Om stödet saknas laddas filen ner för manuell bifogning i WhatsApp. Inget skickas automatiskt.

Källversion: 0354a4baf425f8344e0c930e577e7430063c45ba.
Paketet är förberett för manuell uppladdning. Det publicerar inget automatiskt till Netlify.
