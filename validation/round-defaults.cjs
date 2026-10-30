const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),assert=require('node:assert/strict');
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:8080/test/';
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});try{for(const [n,courts] of [[9,3]]){
 const c=await b.newContext({viewport:{width:390,height:844}}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 const group='11111111-1111-4111-8111-111111111111',session='22222222-2222-4222-8222-222222222222',members=Array.from({length:n},(_,i)=>({id:'p'+i,name:'P'+i,player_mode:'normal'}));let rounds=[],positions=[],sessionRow=null,sessionPosts=0;
 await c.route('https://**/*',r=>r.abort());await c.route('https://frkhzwutziysnjibaxfa.supabase.co/**',async r=>{const req=r.request(),u=new URL(req.url()),body=req.postDataJSON();let data=[];
 if(u.pathname.endsWith('/token'))data={access_token:'mock',refresh_token:'refresh',expires_in:3600,user:{id:'u',email:'test@example.invalid'}};
 else if(u.pathname.endsWith('badminton_admins'))data=[{role:'super_admin'}];
 else if(u.pathname.endsWith('badminton_groups'))data=[{id:group,name:'Testgrupp'}];
 else if(u.pathname.endsWith('get_badminton_group_players'))data=members;
 else if(u.pathname.endsWith('badminton_sessions')){if(req.method()==='POST'){sessionPosts++;sessionRow={...body,id:session};data=[sessionRow];}else if(req.method()==='PATCH')data=[{id:session}];else data=sessionRow?[sessionRow]:[];}
 else if(u.pathname.endsWith('badminton_rounds')){if(req.method()==='POST')rounds=body.map((x,i)=>({...x,id:'r'+i}));data=rounds;}
 else if(u.pathname.endsWith('save_badminton_group_round_players')){positions=body.p_positions;data=null;}
 else if(u.pathname.endsWith('badminton_round_players'))data=positions;
 else if(u.pathname.endsWith('get_badminton_admin_scores'))data=Array.from({length:courts},(_,i)=>({court_number:i+1,enabled:true,red:0,blue:0}));
 return r.fulfill({status:200,json:data});});
 await p.goto(base,{waitUntil:'networkidle'});await p.locator('#cloudEmail').fill('test@example.invalid');await p.locator('#cloudPassword').fill('test-password');await p.locator('#cloudLogin').click();await p.waitForFunction(()=>!!badmintonCloudRole());await p.evaluate(()=>document.getElementById('cloudLoadGroups').click());await p.waitForFunction(()=>document.getElementById('cloudGroupSelect').options.length===2);
 await p.evaluate(group=>{const e=document.getElementById('cloudGroupSelect');e.value=group;e.dispatchEvent(new Event('change'));document.getElementById('cloudImportRotation').click();},group);await p.waitForFunction(n=>getPlayerPool().length===n,n);
 await p.evaluate(({courts})=>{selectAllPlayers(true);badmintonV14ShowTab('settings');document.getElementById('courts').value=String(courts);document.getElementById('courts').dispatchEvent(new Event('change'));},{courts});

 const proposed=async()=>Number((await p.locator('#bmRoundTipText').textContent()).match(/Förslag: (\d+) rundor/)[1]);
 const manual=async n=>p.evaluate(n=>{const e=document.getElementById('rounds');if(![...e.options].some(o=>Number(o.value)===n))e.add(new Option(String(n),String(n)));e.value=String(n);e.dispatchEvent(new Event('change',{bubbles:true}));},n);
 assert.equal(Number(await p.locator('#rounds').inputValue()),await proposed());
 await p.locator('#bmAllowTwoOne').check();assert(await proposed()>=12);assert.equal(Number(await p.locator('#rounds').inputValue()),await proposed());assert((await p.locator('#bmTwoOneSummary').textContent()).includes('3 st 2 mot 1'));
 await manual(8);await p.evaluate(()=>window.dispatchEvent(new Event('badminton:player-selection-updated')));assert.equal(await p.locator('#rounds').inputValue(),'8');
 await p.evaluate(()=>{const ps=getPlayerPool();ps[0].mode='onlySingles';savePlayerPool(ps);renderPlayerPool();window.dispatchEvent(new Event('badminton:player-selection-updated'));});assert.equal(Number(await p.locator('#rounds').inputValue()),await proposed());
 await p.evaluate(()=>{const ps=getPlayerPool();ps[0].mode='normal';savePlayerPool(ps);renderPlayerPool();window.dispatchEvent(new Event('badminton:player-selection-updated'));});assert.equal(Number(await p.locator('#rounds').inputValue()),await proposed());
 await p.locator('#bmAllowTwoOne').uncheck();assert.equal(Number(await p.locator('#rounds').inputValue()),await proposed());assert(await proposed()>3);
 await p.locator('#bmAllowTwoOne').check();assert.equal(Number(await p.locator('#rounds').inputValue()),await proposed());
 await p.evaluate(()=>{document.getElementById('courts').value='2';document.getElementById('courts').dispatchEvent(new Event('change'));});assert.equal(Number(await p.locator('#rounds').inputValue()),await proposed());assert((await p.locator('#bmTwoOneSummary').textContent()).includes('Alla ryms inte'));
 await manual(5);await p.reload({waitUntil:'networkidle'});await p.waitForFunction(()=>!!badmintonCloudRole());assert.equal(await p.locator('#rounds').inputValue(),'5');assert(await p.locator('#bmAllowTwoOne').isChecked());
 await p.evaluate(()=>{const saved=JSON.parse(bmStorage.getItem('badmintonRoundTipChoice'));delete saved.version;delete saved.manual;saved.rounds=3;bmStorage.setItem('badmintonRoundTipChoice',JSON.stringify(saved));});await p.reload({waitUntil:'networkidle'});await p.waitForFunction(()=>!!badmintonCloudRole());assert.equal(Number(await p.locator('#rounds').inputValue()),await proposed());assert.notEqual(await p.locator('#rounds').inputValue(),'3');
 await p.evaluate(()=>new Promise(resolve=>{window.addEventListener('badminton:players-imported',resolve,{once:true});document.getElementById('cloudImportRotation').click();}));
 await p.evaluate(()=>{badmintonV14ShowTab('settings');document.getElementById('courts').value='3';document.getElementById('courts').dispatchEvent(new Event('change'));});assert.equal(Number(await p.locator('#rounds').inputValue()),await proposed());
 await p.locator('#playerPool input[type=checkbox]').first().uncheck();assert.equal(Number(await p.locator('#rounds').inputValue()),await proposed());await p.locator('#playerPool input[type=checkbox]').first().check();assert.equal(Number(await p.locator('#rounds').inputValue()),await proposed());
 if(process.env.ROUND_SCREENSHOT)await p.screenshot({path:process.env.ROUND_SCREENSHOT,fullPage:true});
 await manual(6);await p.evaluate(()=>buildSchedule());assert.equal(await p.evaluate(()=>schedule.length),6);
 await p.locator('#bmApplyRoundTip').click();const recommended=await proposed();const expected=await p.evaluate(()=>JSON.stringify(badmintonTwoOne.recommend(selectedPlayers(),3).plan));
 await p.evaluate(()=>generate());await p.waitForFunction(()=>!!window.badmintonCloudContext?.()?.sessionId);assert.equal(rounds.length,recommended);assert.equal(positions.length,9*recommended);assert.equal(await p.evaluate(()=>JSON.stringify(schedule)),expected);const coverage=await p.evaluate(()=>badmintonTwoOne.coverage(schedule));assert.equal(coverage.partners,36);assert.equal(coverage.opponents,36);assert.equal(coverage.partnerRepeats,0);assert.equal(sessionPosts,1);
 assert(await p.evaluate(()=>schedule.every(r=>r.rest.length===0&&r.courts.length===3&&r.courts.every(c=>c.type==='2 mot 1'))));
 assert.equal(await p.locator('#bigCourts .threeDLabel:not(.isEmpty)').count(),9);assert.equal(await p.locator('#bigCourts .bigCourtTitle').filter({hasText:'2 mot 1'}).count(),3);
 for(const member of members)assert.equal(positions.filter(p=>p.player_id===member.id&&p.team_number===1).length,recommended/3);
 const before=await p.evaluate(()=>JSON.stringify(schedule));await p.evaluate(()=>{const e=document.getElementById('bmAllowTwoOne');e.checked=false;e.dispatchEvent(new Event('change'));});assert.equal(await p.evaluate(()=>JSON.stringify(schedule)),before);assert.equal(sessionPosts,1);
 const live=await c.newPage();await c.route('**/rest/v1/rpc/get_badminton_live_view_v2',r=>r.fulfill({status:200,json:{session_name:'9 spelare',current_round:1,court_count:3,players:positions.filter(p=>p.round_id===rounds[0].id).map(p=>({name:members.find(m=>m.id===p.player_id).name,court:p.court_number,team:p.team_number,activity:p.activity}))}}));
 await live.goto(base+'#live=11111111-1111-4111-8111-111111111111&token='+'a'.repeat(64),{waitUntil:'networkidle'});await live.getByRole('button',{name:'Visa utan helskärm',exact:true}).click();assert.equal(await live.locator('.viewerCourt h3').filter({hasText:'2 mot 1'}).count(),3);assert.equal(await live.locator('.viewerName').count(),9);
 assert.deepEqual(errors,[]);console.log('PASS automatic round defaults, manual override, parameter changes, reload persistence, 9/3 no-rest cloud save and Live');await c.close();
 }}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});

