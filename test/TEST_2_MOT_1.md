# Tillåt 2 mot 1 och automatiskt rundval
Uppdaterad 30 oktober 2026. Endast testappen.

## Rotation
PÅ försöker placera alla valda spelare utan vila på upp till tre banor, med 2, 3 eller 4 spelare per match. Algoritmen väljer så många använda banor som möjligt, därefter så få vanliga singlar som möjligt. Exempel:
- 5 spelare / 2 banor: 2 mot 1 + singel.
- 6 / 2: två matcher 2 mot 1.
- 7 / 2: dubbel + 2 mot 1.
- 8 / 3: två matcher 2 mot 1 + singel.
- 9 / 3: tre matcher 2 mot 1.
- 10 / 3: dubbel + två matcher 2 mot 1.
- 11 / 3: två dubblar + 2 mot 1.
- 12 / 3: tre dubblar.

Reglaget är gemensamt godkännande för 2 mot 1, även för Endast singel. Endast singel tilldelas ensamrollen eller vanlig singel, aldrig en plats i ett tvåmannalag. Mer singel prioriteras för dessa roller.
Om alla ryms men preferenserna inte kan uppfyllas stoppas skapandet innan ett tidigare spel avslutas. Om antalet spelare överstiger banornas kapacitet visas att vanlig rotation med vila används.
Med alla Normal fördelas rollerna jämnt över en full cykel. För 9/3 är en cykel 3 rundor: en ensamroll och två matcher i tvåmannalaget per spelare.
AV använder vanlig rotation; tidigare balanserad vila för 7/2 och 11/3 behålls.
## Prioritering av variation
Algoritmen söker först nya partnerpar och därefter nya motståndarpar. När upprepningar behövs föredras de minst använda paren och upprepningar från föregående runda undviks vid lika övrig poäng. Preferenser och jämna rollcykler respekteras.
Rundförslaget jämför tre provrotationer och visar deras täckning. Det avser inte längre bara en rollcykel. Med 9 spelare på 3 banor och alla Normal ger den verifierade provrotationen 12 rundor: alla 36 partnerpar exakt en gång och alla 36 motståndarpar täcks. Motståndarmöten kan upprepas.
Skapandet använder samma provrotation genom en sparad slumpseed. Ett kortare manuellt val använder dess början och får en synlig förklaring om lägre täckning. Ett längre val fortsätter samma rotation.
Förslaget är en heuristisk sökning, inte ett bevis på minsta möjliga rundantal för varje parameterkombination. Om alla efterfrågade par inte täcks visas detta under Info.
Äldre lokala rundval utan versionsmarkering ersätts en gång av det nya förslaget. Nya manuella val sparas med en markering som skiljer dem från automatiska val.

## Rundval
Förslaget väljs automatiskt när deltagare, banor, preferenser eller Tillåt 2 mot 1 ändras.
Efteråt kan rundantalet ändras manuellt. Samma parameterhändelse utan verklig ändring återställer inte ett manuellt val.
Manuellt val sparas lokalt med parametersignaturen och återställs vid omladdning om parametrarna är samma.
Knappen Välj N rundor kan återställa förslaget efter ett manuellt val.
Valet gäller nästa schema. Pågående eller tidigare sparade scheman ändras inte.

## Server och resultat
Ingen ny SQL behövs med befintliga grupp-/Live-/statistikfunktioner. 2 mot 1 sparas som tre spelarplaceringar med lagnummer 1 och 2, med aktiviteten double. Lagstorleken identifierar spelformen.
Live och rapporter använder redan dessa lagstorlekar. Resultat för 2 mot 1 redovisas separat och ingår inte i den ordinarie singel-/dubbelpallen.
Använd testgrupp; databasen delas med produktionen.

## Tester
node validation/rotation-two-one.cjs
node validation/rotation-no-rest.cjs
node validation/partner-variety.cjs

Browserkontroll, efter att en lokal server startats från repo-roten:
python3 -m http.server 8080
node validation/round-defaults.cjs

Playwright och Chromium behöver vara installerade. TEST_BASE_URL kan ange annan lokal testadress, PLAYWRIGHT_MODULE annan installerad modul och CHROMIUM_PATH annan webbläsarfil.
Testerna kontrollerar alla 3–12 spelarantal / 1–3 banor med olika antal Endast singel, fulla rollcykler, OFF-regression, automatval, manuella val, ändrade parametrar, omladdning, pågående schemas oföränderlighet samt 9/3-molnsparning och Live med simulerad server.
Inga riktiga spel, konton eller resultat ändras av testerna.

