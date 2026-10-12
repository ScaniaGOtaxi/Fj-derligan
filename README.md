# Badminton App v2.0

Webbapp för badmintonrotation, spelargrupper, Live & QR, poäng och statistik.

- Ordinarie app: https://scaniagotaxi.github.io/Fj-derligan/
- Testmiljö: https://scaniagotaxi.github.io/Fj-derligan/test/

Den ordinarie appen och testsidan har separata lokala inställningar men använder samma Supabase-projekt. Använd en testgrupp vid testning.

## Funktioner

- Rotation för 3–12 spelare och 1–3 banor, singel/dubbel och vila.
- Två flaggor, landsökning, kön och spelpreferenser som sparas för importerade gruppspelare.
- Timer, ljud, färdigmarkering, helskärm och lätt spelarrörelse med animerad fjäderboll.
- På/Av för rörelse, stöd för minskad rörelse och paus i dolda flikar.
- Sparade poäng per spel, runda och bana, med skrivskyddad Live-visning.
- Gruppstatistik med periodval, resultat, deltagande, matchhistorik, spelardetaljer och CSV/PDF.
- Admin för tilldelade grupper och Super Admin för grupp- och administratörshantering.
- Lösenordsåterställning och centrerade inställningsdialoger som fungerar i helskärm.

## Lokal start

Kör i projektroten:

```sh
python3 -m http.server 8003 --bind 127.0.0.1
```

Öppna rotadressen för ordinarie kopia eller `/test/` för testkopian. Ingen byggprocess krävs. Molnfunktioner använder den riktiga databasen även vid lokal start.

## Supabase

Befintliga grundtabeller, Admin-/grupprättigheter och Live-tokenfunktioner krävs.
Följande kompletteringar finns i repot och har installerats av användaren under testningen:

1. `SUPABASE_TEST_SYNC_V2.sql` – spelarinställningar och berikad Live-visning.
2. `SUPABASE_LIVE_POANG.sql` – poäng, med Super Admin eller tilldelad grupp-Admin som behörighetsmodell.
3. `SUPABASE_RESULTAT_STATISTIK.sql` – läsning av gruppens färdigspelade resultat.

Flytt från testsidan till rotadressen kräver inte att dessa skript körs igen.
Återställningsmejl kräver att den ordinarie HTTPS-adressen är tillåten i Supabase Authentication → URL Configuration. Mejl/inbjudningsleverans och äldre raderingsfunktioner har inte verifierats genom dessa kodtester.

## Utveckling och verifiering

Automatiserade Chromium-tester i `validation/` använder testsidan och simulerade Supabase-svar. Playwright behövs för testerna, men inte för appen. Dokumentation för testning finns i `test/LAS_MIG_TEST_SYNC_V2.md` och `test/PRESTANDA.md`.

Mobil- och surfplatteformat är verifierade i Chromium, inte på fysisk iPhone/iPad med Safari. Statisk offline-visning fungerar efter cachning; molnfunktioner kräver internet.

Resultatstatistik räknar endast Klar-rundor med sparade poäng, utesluter saknade poäng/0–0 och räknar positiva lika poäng som oavgjort. Dubbelpartners delar lagresultat och lagpoäng. Lokal deltagarstatistik hålls separat.

Skapad av Piotr Zdeb +=RYB@=+
