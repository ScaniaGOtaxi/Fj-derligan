# 🏸 Badminton App v2.0

Webbapp för badmintonrotation, spelgrupper och livevisning. Publiceras med GitHub Pages och använder Supabase för vissa databasfunktioner.

**Webbapp:** https://scaniagotaxi.github.io/Fj-derligan/  
**Repository:** https://github.com/scaniagotaxi/Fj-derligan

## Funktioner

- Hantera spelare och spelgrupper.
- Rotationsschema för 1–3 banor, med navigering mellan rundor.
- Grafisk badmintonbana med spelare, lagfärger och namn.
- Välj en eller två nationalitetsflaggor per spelare; två hela flaggor visas sida vid sida.
- Spelarfigurer för män och kvinnor.
- Matchtimer, ljudsignal och inställningar för rundbyte.
- Justerbar storlek på spelarnamn med A+ och A−.
- Valfri poängräkning för rött och blått lag.
- Livevisning med QR-kod och delbar visningslänk.
- Mobilanpassad vy, helskärmsläge och PWA-filer.

## Nytt i denna testversion

**Supabase-sparning av spelarinställningar**: Kod för att spara spelardata och flaggval per spelgrupp har lagts till. Detta är en **testfunktion** som kräver databasändringar och praktisk verifiering på flera enheter.

### Installation på GitHub Pages

1. Packa upp ZIP-filen.
2. Ladda upp appfilerna till repositoryts publicerade mapp (vanligen roten på `main`).
3. Kontrollera att `index.html`, `service-worker.js`, `manifest.webmanifest` och bildfilerna finns med.
4. Kör innehållet i `SUPABASE_SPELARINSTALLNINGAR.sql` i Supabase SQL Editor **efter att du granskat SQL-koden och tagit backup vid behov**.
5. Läs `LAS_MIG_SUPABASE.txt` och testa sparning samt återläsning från en annan enhet.

## Status

- Två hela flaggor i spelvyn och vid rotation: bekräftat fungerande i tidigare stabil version.
- Live & QR: tidigare fungerande; ska regressionstestas efter uppladdning.
- Synkronisering av spelarinställningar via Supabase: **ännu inte verifierad mot produktionsdatabasen**.

## Medföljande dokumentation

- `SUPABASE_SPELARINSTALLNINGAR.sql` – databasändring för testfunktionen.
- `LAS_MIG_SUPABASE.txt` – instruktioner för Supabase.
- `DUBBLA_FLAGGOR_LAS_MIG.txt` och `TVA_HELA_FLAGGOR_LAS_MIG.txt` – information om flaggvisning.
