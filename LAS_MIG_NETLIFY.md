# Badminton App – Netlify, 18 oktober 2026

1. Packa upp ZIP-filen.
2. Öppna befintligt Netlify-projekt för https://badminkton.netlify.app/ → Deploys.
3. Dra in den uppackade mappen som innehåller index.html direkt. Ingen byggprocess behövs.
4. Ladda om appen när publiceringen är klar.

Paketet innehåller samtliga aktuella testfunktioner och uppdaterad Hjälp:
- Utloggade ser Admin och Hjälp. Övriga flikar visas efter inloggning enligt behörighet.
- Live-länkar fungerar utan administratörsinloggning och erbjuder helskärm där webbläsaren stöder det.
- Live-poäng visas inne på respektive bana vid nätet.
- Kompakt spelarhantering, rundtips, serverstatistik, rapporter och diplom.
- Dela första diplomsidan som bild eller PDF och hela rapporten som PDF.
- Utloggning efter lösenordsbyte.
- Manuellt och automatiskt spelavslut med bekräftad sparning och popup.

Det borttagna hjälpstycket om startbilden ingår inte.
Samma befintliga Supabase-databas och konton används. Inga nya SQL-installationer behövs för de senaste ändringarna. Befintliga serverfunktioner måste redan vara installerade.
Lokala inställningar behåller prefix badminton-netlify.
Supabase Authentication Redirect URLs behöver tillåta https://badminkton.netlify.app/ och https://badminkton.netlify.app/index.html.
Att dölja flikar ersätter inte databasens behörighetskontroller.
Delning beror på webbläsarens stöd; annars hämtas filen för manuell bifogning. Ingenting skickas automatiskt.

Källversion: 0d53cf16bb9922aee1bd3caf47b6357d68f5b374.
Paketet publicerar inget automatiskt till Netlify.
