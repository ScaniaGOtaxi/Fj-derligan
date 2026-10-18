# Badminton App – Netlify, 18 oktober 2026

## Ladda upp
1. Packa upp ZIP-filen.
2. Öppna befintliga Netlify-projektet för https://badminkton.netlify.app/ → Deploys.
3. Dra in den uppackade mappen som innehåller index.html direkt. Ingen byggprocess behövs.
4. Ladda om appen när Netlify är klar.

## Ingår
Alla aktuella testappens funktioner, kompakt spelarhantering, rundtips, standardinställningar, serverstatistik för Admin/Super Admin samt dagsrapport med diplom, prispall, sammanlagda placeringar, PDF-nedladdning och fildelning till exempelvis WhatsApp.
Diplomet använder riktiga resultat, med egen ritad grafik i samma färg- och diplomstil som designförslaget.
Medaljer beräknas efter vinster, poängskillnad och gjorda poäng. Lika resultat ger delad placering. Singel/dubbel summeras per spelare och grupp. Dagens spel avser spelens startdatum enligt enhetens datum.
Under diplomet finns deltagare och matchresultat. PDF har diplom först och detaljer på efterföljande sidor.
WhatsApp väljs av användaren i enhetens delningsmeny. Om webbläsaren saknar fildelning laddas PDF ner för manuell bifogning.

## Databas och konton
Samma befintliga Supabase-databas används. Paketet ändrar eller raderar ingen serverdata vid installation. Befintligt prefix badminton-netlify behålls för lokala inställningar.
Ingen ny SQL krävs för diplomet eller PDF-exporten. Tidigare funktioner kräver sina redan installerade serverfunktioner.
Om resultatstatistik saknas: https://github.com/ScaniaGOtaxi/Fj-derligan/blob/main/test/SUPABASE_RESULTAT_STATISTIK.sql
Om Super Admin saknar statistik-radering: https://github.com/ScaniaGOtaxi/Fj-derligan/blob/main/test/SUPABASE_RADERA_STATISTIK.sql
Installation av raderingsfunktionen raderar ingen data; faktisk radering kräver skriven bekräftelse i appen.
Kontrollera att Supabase Authentication → URL Configuration → Redirect URLs tillåter https://badminkton.netlify.app/ och https://badminkton.netlify.app/index.html.

Paketet är förberett för manuell uppladdning. Det är inte automatiskt publicerat till ditt Netlify-konto.
