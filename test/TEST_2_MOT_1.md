# Test: Tillåt 2 mot 1
21 oktober 2026

Endast testappen har ändrats. Ingen publicering till Netlify/produktion.

## Användning
1. Logga in, välj en testgrupp och hämta dagens spelare.
2. Välj 7 spelare på 2 banor, eller 11 spelare på 3 banor.
3. Under spelarlistan finns reglaget Tillåt 2 mot 1, AV vid första användningen.
4. PÅ är gemensamt godkännande för alla valda spelare. Det blir en 2 mot 1 och resterande banor dubbel. Ingen vilar.
5. AV ger en singel och resterande banor dubbel samt en vilande spelare när högst en spelare har Endast singel.
6. Välj rundor (rundtipset uppdateras), skapa ett nytt schema. Befintliga scheman ändras inte av reglaget.

## Preferenser
Alla Normal: på en hel cykel om 7/11 rundor får varje spelare en ensamroll, två matcher i tvåmannalaget och 4/8 dubbelmatcher. AV ger en vila och två singelmatcher per spelare under en hel cykel.
En Endast singel: spelar ensam varje runda när PÅ; vanlig singel när AV.
Mer singel: prioriteras för ensamrollen när ingen Endast singel finns.
Flera Endast singel när PÅ: schemat stoppas med förklaring före kontroll/avslut av befintligt spel. AV använder då den tidigare vanliga logiken, som kan kräva mer vila.
Övriga antal spelare/banor använder vanlig rotationslogik även om reglaget är PÅ.
Rollfördelningen garanteras för Normal under hela cykler; alla partners och motståndare garanteras inte.

## Lagring, Live och statistik
2 mot 1 lagras i befintliga spelarplaceringar med aktivitet double och lagstorlekar 1+2. Lagnummer bevaras. Ingen ny SQL behövs med de befintliga grupp-/Live-/statistikfunktionerna från detta repo.
Återupptagning identifierar tre spelare på banan och bevarar lagen. Live visar matchtypen och tre namn/figurer.
Poäng sparas per lag som tidigare. 2 mot 1 redovisas separat i resultat och deltagande och ingår inte i ordinarie singel-/dubbelpall. Dagens rapport har separat resultatlista samt alla matchresultat. Detaljsidor i PDF innehåller listan; diplompallen gäller vanlig singel/dubbel.
Serverdatabasen delas med produktionen. Använd en testgrupp. Äldre appversioner kan tolka dessa nya matcher fel, så öppna 2 mot 1-spel i testappen under utvärderingen.
Inga verkliga sessioner skapades, resultat ändrades eller mejl skickades vid de automatiska testerna.

## Validering
Kör node validation/rotation-two-one.cjs från repo.
Testar flera slumputfall, olika antal rundor, båda lägena, normala rollcykler, singelpreferenser, konflikter, unika spelare per runda, lagnummer, övriga antal samt separata resultat/pall.
Webbläsarkontroller med simulerad Supabase: 7/2 och 11/3, AV/PÅ, molnsparning/återupptagning, omladdning, konfliktstopp före spelavslut, Live i mobil/dator, deltagarstatistik, dagsrapport och diplom.
Den verkliga Supabase-serverns installation har inte ändrats eller verifierats genom skrivning.

