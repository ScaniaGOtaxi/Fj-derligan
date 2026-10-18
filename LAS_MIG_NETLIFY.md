# Badminton App – Netlify, 18 oktober 2026

1. Packa upp ZIP-filen.
2. Öppna ditt befintliga Netlify-projekt för https://badminkton.netlify.app/ → Deploys.
3. Dra in den uppackade mappen som innehåller index.html direkt. Ingen byggprocess behövs.
4. När Netlify är klar: ladda om sidan och öppna Hjälp.

Alla senaste testappens funktioner ingår: den uppdaterade hjälpfliken, kompakt grupp- och spelarhantering, rundtips, serverstatistik, diplomet med den godkända grafiken, delning av enbart första PDF-sidan och hela rapporten, samt utloggning efter lyckat lösenordsbyte eller återställning.

Paketet använder samma befintliga Supabase-databas. Ingen ny SQL krävs för dessa senaste ändringar. Befintliga serverfunktioner för gruppspelare, poäng, statistik och statistik-radering behöver redan vara installerade.
Webbplatsens tidigare lokala lagring behåller prefix badminton-netlify. Befintliga sparade inställningar behålls.
Om återställningslänkar inte fungerar, kontrollera Supabase Authentication → URL Configuration → Redirect URLs för https://badminkton.netlify.app/ och https://badminkton.netlify.app/index.html.

Efter lyckat lösenordsbyte avslutas den lokala inloggningen och ny inloggning krävs. Appen begär även avslut av övriga sessioner. Befintliga åtkomsttoken på andra enheter kan gälla tills de löper ut.

Dela diplom via WhatsApp delar endast första sidan som PDF. Dela PDF · WhatsApp delar hela rapporten. Mobilens delningsmeny används; utan stöd laddas filen ner för manuell bifogning.

Källversion: e45865ef18882cbc4bbf341d144e7aabaa1564d3.
Detta paket är klart för manuell uppladdning. Att skapa paketet publicerar inget till ditt Netlify-konto och ändrar inga serverdata.
