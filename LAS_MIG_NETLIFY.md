# Badminton App – bollspel.netlify.app, 21 oktober 2026

1. Packa upp ZIP-filen.
2. Öppna det befintliga Netlify-projektet för https://bollspel.netlify.app/ → Deploys.
3. Dra in den uppackade mappen som innehåller index.html direkt. Ingen byggprocess behövs.
4. Ladda om appen efter publiceringen.

Alla senaste appändringar från föregående produktionspaket ingår: poäng framför nätet i Live, borttagen Rörelse-knapp i Live, Admin och Hjälp utan inloggning, Live-helskärmsval, spelavslut, statistik, rapporter och diplom samt uppdaterad Hjälp.
Synkning av spelarfigurernas inställning mellan flikar använder nu produktionens lagringsprefix.
Återställning och nya Live/QR-länkar använder webbplatsens aktuella adress.

Supabase-inställningar för denna adress:
- Site URL: https://bollspel.netlify.app/
- Redirect URLs: https://bollspel.netlify.app/**
- BADMINTON_INVITE_REDIRECT_URL: https://bollspel.netlify.app/?type=recovery
- BADMINTON_ALLOWED_ORIGINS: https://bollspel.netlify.app,https://scaniagotaxi.github.io

Serverfunktionen invite-badminton-admin installeras separat i Supabase. Den ingår inte som klientkod.
Inga nya SQL-kommandon krävs av denna ZIP. Befintliga serverfunktioner och behörigheter används.
Samma Supabase-databas och konton används; inga spelare eller resultat tas bort.
Lokala inställningar och inloggning från en annan webbadress överförs inte automatiskt.
Gamla QR-koder pekar på sin gamla adress. Skapa nya från bollspel.netlify.app.
Installera om eventuell hemskärmsgenväg från den nya adressen.

Paketet publicerar inget automatiskt till Netlify.
