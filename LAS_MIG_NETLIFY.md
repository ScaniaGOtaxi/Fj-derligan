# Badminton App – produktionspaket 21 oktober 2026

För https://bollspel.netlify.app/

## Publicera
1. Packa upp ZIP-filen.
2. Öppna ditt befintliga Netlify-projekt → Deploys.
3. Dra in den uppackade mappen som innehåller index.html direkt. Ingen byggprocess behövs.
4. Ladda om sidan efter publiceringen.

## Nytt
Tillåt 2 mot 1 finns under spelarlistan, med röd ram och ett avlångt PÅ/AV-reglage.
- 7 spelare / 2 banor: 1 dubbel + 2 mot 1 när PÅ.
- 11 spelare / 3 banor: 2 dubbel + 2 mot 1 när PÅ.
- PÅ: alla spelar varje runda. Markeringen godkänner varianten för alla valda spelare.
- AV: vanlig singel/dubbel med vila. Med högst en Endast singel vilar en person per runda i dessa kombinationer.
- Alla Normal: ensamrollen roterar jämnt under en hel cykel. Mer singel prioriteras; en Endast singel behåller ensamrollen. Flera Endast singel när PÅ ger ett tydligt stopp.
- Reglerna förklaras kort med röd text högst upp i Hjälp.
- 2 mot 1 visas i spel och Live; deltagande och resultat särredovisas. Matchtypen ingår inte i vanliga pallen.
- Befintliga scheman ändras inte av reglaget. Skapa nytt schema för att använda valet.

Tidigare appfunktioner ingår, bland annat serverstatistik, rapporter/diplom, delning, spelavslut, poäng framför nätet i Live samt Admin och Hjälp utan inloggning.

## Databas
Samma Supabase-databas och konton används. Inga nya SQL-installationer behövs för denna ZIP om befintliga grupp-, Live- och statistikfunktioner redan är installerade.
Serverfunktionen invite-badminton-admin installeras separat i Supabase, med de inställningar som redan konfigurerats för bollspel.netlify.app. Servernycklar ingår inte i paketet.
Lokala inställningar behåller prefix badminton-netlify. Byte av webbadress överför inte automatiskt lokala uppgifter från en annan adress.
Äldre appversioner känner inte till 2 mot 1: uppdatera enheter som ska visa dessa nya spel. Skapa nya Live-/QR-länkar från den nya adressen.

Källversion: e4e9f74b22fffbedb993854cd66307c258b8fd4d
Paketet publicerar inget automatiskt till Netlify.
