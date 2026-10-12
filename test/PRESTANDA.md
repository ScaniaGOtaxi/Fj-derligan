# Prestandaändringar på testsidan

- Live hämtar runda och poäng med cirka två sekunders mellanrum, efter att föregående hämtning är klar. Tidigare gjordes två anrop varje sekund. Den normala anropsfrekvensen halveras; nätverkslatens tillkommer.
- Dolda flikar och offline-läge stoppar polling. Synlig flik eller återkommet nätverk startar en omedelbar hämtning. Tillfälliga fel ger gradvis längre väntetid, upp till 30 sekunder.
- Ändrade poäng uppdaterar bara poängtavlan i Live. Banbilder, namn och spelarfigurer behålls tills deras data förändras.
- Snabba poängtryck samlas under 150 ms och sparar senaste värdet per session/runda. Sparningar är sekventiella och skiljer mellan rundor. Vänta på sparad-status innan sidan stängs.
- Admins poänghämtning skriver inte över en lokal poängändring som väntar på att sparas.
- Oförändrade spelarinställningar skickas inte igen. Spelarlistan dubbelrenderas inte vid import och vanlig sidstart.
- Bilder hämtas från service workerns cache när de redan finns där. HTML och JavaScript använder fortfarande nätverket först, med offline-fallback. Vid framtida bildbyten måste worker-versionens cache-namn ändras.
- Anonym Live-visning återställer inte en sparad Admin-inloggning i bakgrunden.

Verifierat med Chromium och simulerad Supabase: flaggor, spelarinställningar, QR, poäng, rundbyte/färdigmarkering, omladdning, offline och lösenordsåterställning. Ett separat prestandatest verifierar pollingfrekvens, paus vid dold flik, omedelbar återstart, backoff samt bibehållen ban-DOM vid poängändring.

Tester från projektroten med lokal server på port 8003:

    NODE_PATH=/workspace/onboarding-tools/node_modules node validation/sync-v2.cjs
    NODE_PATH=/workspace/onboarding-tools/node_modules node validation/live-performance.cjs
    NODE_PATH=/workspace/onboarding-tools/node_modules node validation/password-recovery.cjs

Detta är riktade optimeringar av testversionen, inte en omskrivning av hela appen. Ingen ny databasinstallation krävs.
