# Administratörsinbjudan – installation i Supabase

Status: förberedd serverkod, inte publicerad i Supabase. Tester använder låtsassvar och skickar inga mejl.

## Installera via Supabase Dashboard
1. Öppna projektet frkhzwutziysnjibaxfa → Edge Functions → skapa en funktion med exakt namnet invite-badminton-admin.
2. Klistra in innehållet i functions/invite-badminton-admin/index.ts.
3. Under Edge Functions → Secrets, ange:
   - BADMINTON_INVITE_REDIRECT_URL = https://badminkton.netlify.app/?type=recovery
   - BADMINTON_ALLOWED_ORIGINS = https://badminkton.netlify.app,https://scaniagotaxi.github.io
   Lägg till https://zdeb.se endast om den webbplatsen ska få använda funktionen.
4. SUPABASE_URL och SUPABASE_SERVICE_ROLE_KEY ska finnas som Supabases servervariabler. Lägg aldrig service-role-nyckeln i HTML, GitHub eller en ZIP för Netlify.
5. Stäng av gatewayens äldre JWT-kontroll (Verify JWT) för funktionen. Funktionen validerar själv användarens token med auth.getUser och kräver en serverkontrollerad super_admin-roll.
6. Publicera funktionen.
7. I Authentication → URL Configuration → Redirect URLs: tillåt https://badminkton.netlify.app/?type=recovery. Funktionen använder detta fasta mål; klienten får inte bestämma omdirigeringen.
8. Kontrollera att befintlig tabell public.badminton_admins har user_id (unik nyckel) och role, att role tillåter admin och att eventuella ytterligare obligatoriska kolumner har standardvärden. Appens kod bekräftar user_id och role; serverns fullständiga tabellschema har inte kunnat verifieras här.
9. Kontrollera Authentication-konfigurationen för e-postutskick/SMTP. Behåll Supabases verifieringslänk i mejlmallen.
10. Logga in som Super Admin och gör en avsiktlig prov-inbjudan. Kontrollera mejlet, välj lösenord och logga sedan in. Tilldela därefter en grupp i appen.

## Via CLI
Kör från denna mapp med Supabase CLI installerad och inloggad:
supabase functions deploy invite-badminton-admin --project-ref frkhzwutziysnjibaxfa --no-verify-jwt

## Beteende
- OPTIONS hanteras för webbläsarens CORS-kontroll.
- POST kräver en giltig användartoken och rollen super_admin i badminton_admins.
- E-postadressen valideras och normaliseras.
- Supabase skickar inbjudningsmejlet. Det nya kontot får rollen admin, aldrig super_admin.
- En befintlig roll skrivs inte över. Befintliga registrerade konton hanteras inte genom att deras lösenord ändras; använd ordinarie återställning och separat behörighetshantering.
- Ingen grupptilldelning görs automatiskt.
- Inbjudningsmejl och rollregistrering är två separata operationer. Om rollen inte kan sparas visas ett särskilt fel; mejlet kan redan vara skickat. Kontrollera då tabellen innan du försöker igen.
- Inbjudningslänken använder appens befintliga lösenordsåterställningsvy genom type=recovery. Verifiera detta flöde i publicerad app före verklig användning.
- Ett lyckat CORS-test är inte ett bevis på att SMTP, tabellschema eller hela inbjudningsflödet fungerar. Dessa behöver kontrolleras efter installation.
