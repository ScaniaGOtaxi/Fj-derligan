# Netlify – https://badminkton.netlify.app/

1. Packa upp ZIP-filen.
2. Öppna ditt befintliga Netlify-projekt för badminkton.netlify.app och välj Deploys.
3. Dra in den uppackade mappen som innehåller index.html direkt. Välj inte någon yttre mapp om index.html ligger i en undermapp.
4. Ingen byggprocess behövs. Paketet är en färdig statisk webbapp.
5. Lägg till https://badminkton.netlify.app/ och https://badminkton.netlify.app/index.html i Supabase Authentication → URL Configuration → Redirect URLs om de inte finns. Behåll andra fungerande adresser under övergången.
6. Funktionen för serverstatistik kräver att test/SUPABASE_RADERA_STATISTIK.sql från GitHub-repot är installerad i Supabase. Installation av funktionen raderar ingen data; riktig radering kräver Super Admin och skriven bekräftelse i appen.

Appen använder fortfarande samma Supabase-databas. Netlify-versionen får egna lokala inställningar och egen cache med prefix badminton-netlify. Lokala inställningar från andra domäner överförs inte automatiskt.

Källversion: 2026-10-17. Paketet förbereder filer för manuell uppladdning. Ingen ändring på ditt Netlify-konto eller i Supabase utförs genom att skapa ZIP-filen.
