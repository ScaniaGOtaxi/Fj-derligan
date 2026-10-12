const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try{
const session='11111111-1111-4111-8111-111111111111',group='22222222-2222-4222-8222-222222222222';
const names=['Anna','Bo','Cecilia','David'];const members=names.map((name,i)=>({id:'p'+i,name,country_code:i?'SE':'PL',second_country_code:i?null:'SE',player_gender:i?'man':'kvinna',player_mode:'normal'}));
let currentRound=1,scoreEnabled=false,scoreValues={},failRoundOnce=false,failSettings=false,failCompletionOnce=true;const calls=[];
const rounds=[1,2].map(n=>({id:'r'+n,round_number:n,status:'pending'}));
const positions=rounds.flatMap(r=>members.map((p,i)=>({round_id:r.id,player_id:p.id,court_number:1,team_number:i<2?1:2,activity:'double'})));
async function routeHandler(route){const req=route.request();const u=new URL(req.url());let body=[];let status=200;let payload=req.postDataJSON();
if(u.pathname.endsWith('badminton_sessions')){
 const columns=(u.searchParams.get('select')||'').split(',').filter(Boolean);
 const allowed=['id','name','group_id','court_count','status','current_round_number','created_at'];
 if(columns.some(c=>!allowed.includes(c)))return route.fulfill({status:400,contentType:'application/json',body:JSON.stringify({message:'Invalid session column: '+columns.find(c=>!allowed.includes(c))})});
}
calls.push({path:u.pathname,method:req.method(),payload,query:u.search});
if(u.pathname==='/auth/v1/token')body={access_token:'mock-access',refresh_token:'mock-refresh',expires_in:3600,user:{id:'mock-user'}};
else if(u.pathname.endsWith('badminton_admins'))body=[{role:'admin'}];
else if(u.pathname.endsWith('badminton_groups'))body=[{id:group,name:'Testgrupp',created_at:'2026-10-12'}];
else if(u.pathname.endsWith('badminton_players')){if(req.method()==='PATCH'){if(failSettings){status=403;body={message:'Denied for test'};}else{const p=members.find(p=>'eq.'+p.id===u.searchParams.get('id'));Object.assign(p,payload);body=[p];}}else body=members;}
else if(u.pathname.endsWith('badminton_sessions')){if(req.method()==='PATCH'){if(failRoundOnce){status=503;body={message:'Transient test outage'};failRoundOnce=false;}else{currentRound=payload.current_round_number;body=[{id:session}];}}else body=[{id:session,group_id:group,name:'Testspel',court_count:1,status:'active'}];}
else if(u.pathname.endsWith('badminton_rounds')){if(req.method()==='PATCH'){if(failCompletionOnce){failCompletionOnce=false;status=503;body={message:'Transient completion outage'};}else{const r=rounds.find(r=>'eq.'+r.id===u.searchParams.get('id'));r.status=payload.status;body=null;}}else body=rounds;}
else if(u.pathname.endsWith('badminton_round_players'))body=positions;
else if(u.pathname.endsWith('create_badminton_viewer_token'))body='a'.repeat(64);
else if(u.pathname.endsWith('get_badminton_live_view_v2'))body={session_name:'Testspel',current_round:currentRound,court_count:1,players:members.map((p,i)=>({...p,court:1,team:i<2?1:2,activity:'play'}))};
else if(u.pathname.endsWith('set_badminton_live_scores')){scoreEnabled=payload.p_enabled;scoreValues[payload.p_round_number]=payload.p_scores;body=null;}
else if(u.pathname.endsWith('get_badminton_live_scores'))body={enabled:scoreEnabled,scores:scoreValues[currentRound]||{}};
else if(u.pathname.endsWith('badminton_live_scores'))body=Object.entries(scoreValues[Number(u.searchParams.get('round_number').slice(3))]||{}).map(([court,v])=>({court_number:Number(court),...v,enabled:scoreEnabled}));
else throw Error('Unexpected API route '+u.pathname);
await route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
}
const context=await browser.newContext({viewport:{width:1000,height:800},reducedMotion:'reduce'});await context.route('https://frkhzwutziysnjibaxfa.supabase.co/**',routeHandler);
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:8003/test/',{waitUntil:'networkidle'});
await page.locator('#cloudEmail').fill('test@example.invalid');await page.locator('#cloudPassword').fill('mock-password');await page.locator('#cloudLogin').click();await page.waitForFunction(()=>document.getElementById('cloudStatus').textContent.includes('Inloggad'));
await page.evaluate(()=>document.getElementById('cloudLoadGroups').click());await page.waitForFunction(()=>document.getElementById('cloudGroupSelect').options.length===2);
await page.evaluate(g=>{const s=document.getElementById('cloudGroupSelect');s.value=g;s.dispatchEvent(new Event('change'));document.getElementById('cloudImportRotation').click();},group);await page.waitForFunction(()=>document.getElementById('cloudStatus').textContent.includes('inlästa'));
assert.deepEqual(await page.evaluate(()=>({country:badmintonCountryOf('Anna'),second:badmintonSecondCountryOf('Anna'),gender:badmintonGenderOf('Anna')})),{country:'PL',second:'SE',gender:'kvinna'});
assert.equal(await page.locator('.playerSecondNationality').count(),4);
await page.evaluate(()=>{badmintonSetCountry('Anna','NO');badmintonSetSecondCountry('Anna','PL');badmintonSetGender('Anna','man');setPlayerMode(0,'onlySingles');});await page.waitForFunction(()=>document.getElementById('bmSyncStatus').textContent.includes('✅'));
await page.waitForTimeout(100);assert.equal(members[0].country_code,'NO');assert.equal(members[0].second_country_code,'PL');assert.equal(members[0].player_gender,'man');assert.equal(members[0].player_mode,'onlySingles');
console.log('PASS import and serialized profile PATCH (country, second flag, gender, mode)');
await page.evaluate(()=>{window.bmPreflightResult=null;window.badmintonV13PrepareNewGame().then(value=>window.bmPreflightResult=value);});
await page.getByRole('button',{name:'Behåll befintligt spel',exact:true}).click();
await page.waitForFunction(()=>window.bmPreflightResult===false);
assert((await page.locator('#cloudSessionStatus').textContent()).includes('Befintligt spel behålls'));
console.log('PASS new-game preflight queries only valid session columns and cancellation preserves the active game');

failSettings=true;await page.evaluate(()=>badmintonSetCountry('Anna','SE'));await page.waitForFunction(()=>document.getElementById('bmSyncStatus').textContent.includes('Denied for test'));assert.equal(members[0].country_code,'NO');failSettings=false;
console.log('PASS denied profile save shows failure and does not claim success');
await page.evaluate(()=>document.getElementById('cloudResumeSession').click());await page.getByRole('button',{name:'Återuppta spel',exact:true}).click();await page.waitForFunction(()=>window.badmintonScoreSession?.());
assert.equal(await page.locator('#bigCourts .threeDLabel:not(.isEmpty)').first().locator('img').count(),2);
await page.evaluate(()=>document.getElementById('createViewerLink').click());await page.waitForFunction(()=>document.querySelector('#viewerQr canvas'));assert((await page.locator('#viewerLinkResult a').getAttribute('href')).includes('#live='));
console.log('PASS session resume, two in-game flags, actual local QR generation');
await page.evaluate(()=>{badmintonScoreSettings();const c=document.getElementById('bmMenuScore');c.checked=true;c.dispatchEvent(new Event('change'));document.querySelector('.bmScoreActions [data-team="0"][data-delta="1"]').click();});await page.waitForFunction(()=>document.getElementById('bmSyncStatus').textContent.includes('Poäng sparade'));
await page.waitForTimeout(100);assert.equal(scoreValues[1]['1'].red,1);assert(scoreEnabled);
console.log('PASS score RPC writes correct session/round/court');
const vcontext=await browser.newContext();await vcontext.route('https://frkhzwutziysnjibaxfa.supabase.co/**',routeHandler);const viewer=await vcontext.newPage();await viewer.goto('http://127.0.0.1:8003/test/#live='+session+'&token='+'a'.repeat(64),{waitUntil:'networkidle'});
assert.equal(await viewer.locator('.viewerName').first().locator('img').count(),2);assert((await viewer.locator('.viewerLiveScore').textContent()).includes('1 – 0'));
assert((await viewer.locator('.genderAthlete').first().getAttribute('src')).includes('spelare_man_'));
members[0].player_gender='kvinna';members[0].second_country_code='SE';scoreValues[1]['1'].red=3;await viewer.waitForFunction(()=>document.querySelector('.viewerLiveScore')?.textContent.includes('3 – 0'));assert((await viewer.locator('.genderAthlete').first().getAttribute('src')).includes('spelare_kvinna_'));
console.log('PASS independent Live browser shows two flags, server gender and updated scores');
failRoundOnce=true;await page.evaluate(()=>nextRound());await page.waitForFunction(()=>document.getElementById('cloudSessionStatus').textContent.includes('Liverunda 2 synkroniserad'));assert.equal(currentRound,2);
console.log('PASS round synchronization retries after a simulated 503');
await page.evaluate(()=>markRoundDone());await page.waitForFunction(()=>document.getElementById('cloudSessionStatus').textContent.includes('Runda 2 markerad'));assert.equal(rounds[1].status,'completed');console.log('PASS completion synchronization retries after a simulated 503');
await page.reload({waitUntil:'networkidle'});await page.waitForFunction(()=>document.getElementById('cloudSessionStatus').textContent.includes('Molnkopplingen återställd'));assert.equal(await page.evaluate(()=>badmintonScoreSession()),session);
assert.equal(await page.evaluate(()=>localStorage.getItem('badmintonV14AuthSession')),null);
assert.deepEqual(errors,[]);console.log('PASS reload restores checked cloud binding; production browser storage untouched; no uncaught errors');
await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await context.setOffline(true);await page.reload({waitUntil:'load'});assert.equal(await page.title(),'TEST – Badmintonrotation');assert.equal(await page.evaluate(()=>typeof QRCode),'function');assert.equal(await page.evaluate(()=>typeof badmintonProfiles),'object');console.log('PASS offline shell, local QR and profile helper');
}catch(e){console.error(e);process.exitCode=1;}finally{await browser.close();}
})();
