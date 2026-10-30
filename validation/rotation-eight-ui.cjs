const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),assert=require('node:assert/strict');
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:8080/test/';
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});try{let previous=null;for(const enabled of [false,true]){const n=8,courts=2;
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


 if(enabled)await p.locator('#bmAllowTwoOne').check();
 const tip=await p.locator('#bmRoundTipText').textContent();assert(tip.includes('Förslag: 7 rundor'));assert(tip.includes('28/28'));assert.equal(await p.locator('#rounds').inputValue(),'7');
 const expected=await p.evaluate(enabled=>JSON.stringify(badmintonTwoOne.recommend(selectedPlayers(),2,enabled).plan),enabled);
 await p.evaluate(()=>generate());await p.waitForFunction(()=>!!window.badmintonCloudContext?.()?.sessionId);assert.equal(rounds.length,7);assert.equal(positions.length,56);assert.equal(sessionPosts,1);
 const actual=await p.evaluate(()=>JSON.stringify(schedule));assert.equal(actual,expected);if(previous)assert.equal(actual,previous);previous=actual;
 assert(await p.evaluate(()=>schedule.every(r=>r.rest.length===0&&r.courts.length===2&&r.courts.every(c=>c.type==='Dubbel'))));
 const covered=await p.evaluate(()=>badmintonTwoOne.coverage(schedule));assert.equal(covered.partners,28);assert.equal(covered.opponents,28);assert.equal(covered.partnerRepeats,0);assert.equal(await p.locator('#bigCourts .threeDLabel:not(.isEmpty)').count(),8);
 for(const round of rounds){const rows=positions.filter(p=>p.round_id===round.id);assert.equal(rows.length,8);assert(rows.every(p=>p.activity==='double'));}
 assert.deepEqual(errors,[]);console.log('PASS 8/2 shared priorities, automatic 7 rounds, verified pair coverage and cloud save',enabled?'ON':'OFF');await c.close();
 }}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
