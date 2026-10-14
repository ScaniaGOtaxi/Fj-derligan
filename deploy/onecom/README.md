# One.com – Badminton App på https://zdeb.se/app/

Förberett från testversionen i GitHub, commit d62eb5306a20b1ddc9cb71ede09f054328c225a5.
Paketet är förberett och lokalt verifierat. Ingen uppladdning till One.com eller ändring i Supabase har utförts.

## Ladda upp
1. Säkerhetskopiera eventuella befintliga filer i One.com-mappen app.
2. Packa upp ZIP-filen. Öppna One.com → Filhanteraren för zdeb.se.
3. Lägg mappen app i webbplatsens webbrot, eller ladda innehållet i app/ till den befintliga app-mappen. Slutlig struktur ska vara app/index.html, app/service-worker.js och övriga filer direkt under app/.
4. Kontrollera att HTTPS fungerar och öppna https://zdeb.se/app/. Om adressen utan avslutande snedstreck inte omdirigeras korrekt, använd /app/.
5. Ladda om med Ctrl+F5. På mobil kan den installerade appen behöva stängas och öppnas igen.

Alternativ utan lokal ZIP: hämta GitHub-repot via Code → Download ZIP, packa upp och använd enbart deploy/onecom/app/.

## Supabase
Databasen är fortfarande samma som GitHub-versionens. Detta skapar ingen separat testdatabas och flyttar ingen data.

Supabase → Authentication → URL Configuration → Redirect URLs:
- https://zdeb.se/app/
- https://zdeb.se/app/index.html

Behåll fungerande GitHub-adresser under övergången. Ändra inte Site URL enbart för att prova paketet. Vid slutlig övergång kan Site URL ändras till https://zdeb.se/app/. Inbjudningar kan också kräva att den befintliga inbjudningsfunktionens redirect-adress uppdateras.

Gruppspelarens databasfunktioner behövs precis som i testappen. Om migrationen redan är installerad ska den inte installeras om bara för att byta webbhotell. Vid saknad funktion finns SUPABASE_GRUPPSPELARE.sql i GitHub-repots rot; kör hela filen i rätt Supabase-projekt.

## Kontrollera efter uppladdning
- Inloggning och lösenordsåterställning: mejlets länk ska gå tillbaka till zdeb.se/app/.
- Hämta grupper, välj grupp och kontrollera spelare.
- Skapa ett spel i en avsedd testgrupp, spara poäng och återuppta.
- Dela en Live-länk: den ska börja med https://zdeb.se/app/.
- Kontrollera Info, spelarinställningar, trepersonersschema och mobilvy.
- Startskärmen ska visas fyra sekunder första gången i en session, och hoppas över vid omladdning.
- Efter första cachningen: kontrollera att statiska appen kan öppnas offline. Molnfunktioner kräver internet.

## Anpassningar
Relativa resurssökvägar under /app/. Live-länkens lokala reservadress är zdeb.se/app/.
Lokala inställningar och kommunikationskanaler har prefix badminton-zdeb-app för att undvika sammanblandning.
Service worker och manifest har app-scope; cachen rensar bara One.com-kopians egna äldre cacheposter.
Spelarprofiler och spelhistorik ligger kvar i Supabase. Lokala webbläsarinställningar från github.io följer inte automatiskt med till zdeb.se.

Appfilerna innehåller Supabases publika nyckel, som är avsedd för webbläsaren. Inga service_role-nycklar eller One.com-lösenord ingår.
