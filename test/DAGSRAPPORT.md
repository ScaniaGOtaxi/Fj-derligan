# Dagens rapport (testappen)

Admin och Super Admin öppnar Statistik, väljer grupp och klickar Dagens rapport.
Rapporten väljer perioden Idag och hämtar serverdata med kontots befintliga gruppbehörigheter.
Dagen bestäms av enhetens lokala datum och spelens startdatum, inte varje matchs speltid.
Samtliga spel som startats idag i gruppen summeras. Endast färdigmarkerade rundor ingår.

Alla deltagare som spelat visas. Placering kräver ett giltigt registrerat resultat; 0–0 räknas inte.
Singel och dubbel räknas samman per spelare. Flest vinster vinner, därefter poängskillnad och gjorda poäng.
Helt lika resultat ger delad placering; efter två delade förstaplatser följer tredje plats.
Dubbelpartners får samma matchresultat och lagpoäng. Olika antal spelade matcher kan påverka placering.
Guld, silver och brons beräknas i rapporten och lagras inte separat på servern.
Resultatlistan visar alla placeringar och respektive spelares matcher/vinster i singel och dubbel.
Matchlistan visar lagen, poängen och vinnarna. Inga matcher eller resultat ändras av rapporten.

Ladda ner PDF skapar en A4-fil med rapportens innehåll (bildbaserad PDF).
Dela PDF öppnar enhetens fildelning där WhatsApp kan väljas om installerat och tillgängligt.
Om webbläsaren saknar fildelning laddas PDF ner för manuell bifogning som dokument.
Inget skickas automatiskt. Skriv ut dagsrapport / PDF finns också kvar.

Verifierat med simulerade serversvar i Chromium för båda rollerna: serverhämtning,
deltagare, historiska spelare, sammanlagda resultat, delade placeringar, mobilbredd,
utloggning, PDF-nedladdning och anrop till native fildelning. PDF verifierad med pdfinfo.
WhatsApps egen mottagning behöver provas på en mobil med WhatsApp.
