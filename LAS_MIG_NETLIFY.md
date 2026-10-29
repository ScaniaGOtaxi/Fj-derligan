# Badminton App – produktionspaket 29 oktober 2026
För https://bollspel.netlify.app/

1. Packa upp ZIP-filen.
2. Öppna ditt befintliga Netlify-projekt → Deploys.
3. Dra in den uppackade mappen som innehåller index.html. Ingen byggprocess behövs.
4. Ladda om appen efter publiceringen.

Ny godkänd spelvy:
- Poängpanelen ligger på banan vid nätet, med rött lag överst och blått under.
- Röda spelarnamn visas högre upp och blå längre ned.
- På stora banvyer fyller poängpanelen ungefär den markerade mittdelen, med stora siffror, lagnamn och plus/minus-knappar.
- Mindre banor och mobil använder en anpassad poängpanel.
- Tidigare funktioner ingår: 2 mot 1, uppdaterad Hjälp, statistik, rapporter/diplom, Live, spelavslut och kontohantering.

Samma befintliga Supabase-databas, konton och installerade serverfunktioner används. Denna uppdatering kräver ingen ny SQL.
SMTP och mejlmallar hanteras separat i Supabase; befintlig konfiguration behålls. Inga lösenord eller servernycklar finns i paketet.
Produktionsinställningar använder prefix badminton-netlify. Webbplatsen är bollspel.netlify.app.

Källversion: 89758e2fda8f0f62b48400c06f36ad266773afdc.
Paketet publicerar inget automatiskt till Netlify.
