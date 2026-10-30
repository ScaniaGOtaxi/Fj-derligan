# Poängpanel i liggande helskärm – regressionstest
30 oktober 2026

## Kör
Installera Node.js och Playwright om de inte finns:
npm install --no-save playwright
npx playwright install chromium

Från repots rot:
node validation/score-landscape.cjs

Testet startar en egen lokal filserver och stänger den efter körning.
Det använder systemets /usr/bin/chromium om den finns, annars Playwrights Chromium.
Valfritt: CHROMIUM_PATH väljer en annan Chromium-fil och PLAYWRIGHT_MODULE en annan installerad Playwright-modul.
TEST_BASE_URL kan peka på en redan startad lokal testserver.
SCORE_SCREENSHOTS kan ange en lokal mapp där skärmbilder sparas.

## Vad testet låser
- 14 kombinationer av skärmstorlek, banantal och spelform: liggande mobil ner till 740×320, stående mobil och dator.
- En, två och tre banor; dubbel, singel och 2 mot 1.
- Riktig Fullscreen API och byte mellan liggande och stående utan omladdning.
- Båda poängraderna, plus/minus och minimera-knappen ryms inne på panelen och banan.
- Spelarnamnen syns helt och överlappar inte panelen.
- Knapparna överlappar inte varandra och webbläsarens verkliga träfftest når varje knapp.
- Plus/minus fungerar för båda lagen, och minimera/återställ fungerar.
- Inga JavaScript-fel uppstår.

Kontrollen mäter även panelens innehåll: en panelram som ryms räcker inte om den nedre poängraden klipps.
Testet återskapade felet i den tidigare publicerade versionen, med 17 underkända paneler i den ursprungliga matrisen.

## Ändring i appen
Panelen anpassas efter banans faktiska höjd. Låga banor får kompakta poängrader; de dubblerade lagnamnen i panelen döljs men spelarnamnen på banan behålls. Minimera har en egen kolumn. Namnpassningen tar hänsyn till det kompakta läget, och stora poängskalor begränsas även av höjden.
En ResizeObserver följer ändringar vid skärmrotation och helskärm. Den befintliga listan med banor kan rullas på mycket låga skärmar.

Testet använder simulerad inloggning och blockerar externa nätverksanrop. Inga riktiga spel, poäng eller konton ändras.
Endast GitHubs testapp är uppdaterad; produktions-ZIP/Netlify ändras separat.

