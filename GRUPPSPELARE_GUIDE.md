# Gruppspelare i flera grupper

Admin kan söka befintliga spelare och lägga till dem i sina tilldelade grupper. Super Admin kan hantera alla grupper. Samma profil och spelar-ID återanvänds; dagens deltagare markeras separat.

Funktionen finns nu både i ordinarie app och testappen. Databasen är gemensam. Om databasmigrationen redan är installerad behöver den inte köras igen. Vid fel om en saknad gruppfunktion: kör hela `SUPABASE_GRUPPSPELARE.sql` i Supabase SQL Editor. Detaljer om migration och behörigheter finns i `test/GRUPPSPELARE_GUIDE.md`; dess tidigare begränsning till testappen gäller inte längre.

Använd Spelinställningar: välj grupp, lägg till befintliga spelare eller skapa en ny profil, hämta gruppens spelare och markera dagens deltagare. Profilinställningar gäller i alla spelarens grupper.
