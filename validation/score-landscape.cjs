/* Run: node validation/score-landscape.cjs. Only mocked auth; no real data changes. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const inspectScorePanel=el=>{const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};},a=rect(el),stage=rect(el.parentElement),inside=(r,b)=>r.x>=b.x-1&&r.y>=b.y-1&&r.right<=b.right+1&&r.bottom<=b.bottom+1,overlap=(r,b)=>Math.min(r.right,b.right)-Math.max(r.x,b.x)>1&&Math.min(r.bottom,b.bottom)-Math.max(r.y,b.y)>1;const targets=[...el.querySelectorAll('.bmScoreValue,.bmScoreActions button,.bmScoreCollapse')],names=[...el.parentElement.querySelectorAll('.threeDLabel:not(.isEmpty)')].map(rect);const buttons=[...el.querySelectorAll('button')];return {stage,panel:a,insideStage:inside(a,stage),clipped:targets.filter(e=>!inside(rect(e),a)||!inside(rect(e),stage)).map(e=>e.className||e.textContent),names,namesVisible:names.length>0&&names.every(n=>n.width>0&&n.height>0&&inside(n,stage)),namesOverlap:names.some(n=>overlap(n,a)),buttonsOverlap:buttons.some((b,i)=>buttons.slice(i+1).some(c=>overlap(rect(b),rect(c)))),blocked:buttons.filter(e=>{const r=rect(e),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return !hit||!(hit===e||e.contains(hit));}).map(e=>e.className||e.textContent)};};
(async()=>{
 const repo=path.resolve(__dirname,'..');
 let server;
 if(!process.env.TEST_BASE_URL){
  server=http.createServer((req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let file=path.resolve(repo,'.'+pathname);if(file!==repo&&!file.startsWith(repo+path.sep)){res.writeHead(403);res.end();return;}if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');const type={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.webmanifest':'application/manifest+json'}[path.extname(file)]||'application/octet-stream';res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'});fs.createReadStream(file).on('error',()=>res.destroy()).pipe(res);}catch{res.writeHead(404);res.end();}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));server.unref();
 }
 const base=process.env.TEST_BASE_URL||'http://127.0.0.1:'+server.address().port+'/test/';
 const shots=process.env.SCORE_SCREENSHOTS;if(shots)fs.mkdirSync(shots,{recursive:true});
 const browser=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:fs.existsSync('/usr/bin/chromium')?{executablePath:'/usr/bin/chromium'}:{}),args:['--no-sandbox']});
 let failures=[];
 try{for(const [width,height,count,kind] of [[844,390,2],[844,390,3],[740,360,2],[740,360,3],[740,320,3],[915,412,3],[667,375,2],[844,390,1],[390,844,2],[390,844,3],[1366,768,2],[1366,900,1],[844,390,2,'2 mot 1'],[740,360,3,'Singel']]){
  const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>sessionStorage.setItem('badminton-test-v2:splashSeen','1'));
  await context.route('https://**/*',r=>r.abort());await context.route('https://frkhzwutziysnjibaxfa.supabase.co/**',r=>r.fulfill({status:200,json:r.request().url().includes('/token')?{access_token:'mock',refresh_token:'refresh',expires_in:3600,user:{id:'u'}}:r.request().url().includes('badminton_admins')?[{role:'super_admin'}]:[]}));
  await page.goto(base,{waitUntil:'networkidle'});await page.locator('#cloudEmail').fill('test@example.invalid');await page.locator('#cloudPassword').fill('test-password');await page.locator('#cloudLogin').click();await page.waitForFunction(()=>!!badmintonCloudRole());
  await page.evaluate(({count,kind})=>{const names=['Henrik','Peter','Desikan','Piotr','Dannel','Rikard','Elias','Ilia','Anna','Bo','Cia','Dan'];let cursor=0;const round={courts:Array.from({length:count},(_,i)=>{const type=i===0&&kind?kind:'Dubbel',length=type==='2 mot 1'?3:type==='Singel'?2:4;const court={type,players:names.slice(cursor,cursor+length),...(type==='2 mot 1'?{teamSplit:1}:{})};cursor+=length;return court;}),rest:[]};window.dispatchEvent(new CustomEvent('badminton:restore-rotation',{detail:{rounds:[round,round],done:[],resumeIndex:0,courtCount:count}}));},{count,kind});
  await page.locator('#gameFullscreenBtn').click();await page.waitForFunction(()=>!!document.fullscreenElement);await page.waitForTimeout(120);
  const panels=page.locator('#gameView .threeDStage>.bmScoreLayer');assert.equal(await panels.count(),count);
  for(let i=0;i<count;i++){
   const panel=panels.nth(i);await panel.scrollIntoViewIfNeeded();
   const report=await panel.evaluate(inspectScorePanel);
   const ok=report.insideStage&&report.namesVisible&&!report.clipped.length&&!report.namesOverlap&&!report.buttonsOverlap&&!report.blocked.length;
   if(!ok){failures.push({width,height,count,court:i+1,...report});continue;}
   // Both rows must be independently clickable, and minimize must not intercept them.
   for(const team of [0,1]){const plus=panel.locator(`[data-team="${team}"][data-delta="1"]`),minus=panel.locator(`[data-team="${team}"][data-delta="-1"]`),value=panel.locator('.bmScoreValue').nth(team);await plus.click();assert.equal(await value.textContent(),'1');await minus.click();assert.equal(await value.textContent(),'0');}
   await panel.locator('.bmScoreCollapse').click();assert(await panel.evaluate(el=>el.classList.contains('isCollapsed')));await panel.locator('.bmScoreCollapse').click();assert(!(await panel.evaluate(el=>el.classList.contains('isCollapsed'))));
  }
  if(width===844&&height===390&&count===2&&!kind){
   await page.setViewportSize({width:390,height:844});await page.waitForTimeout(150);
   for(let i=0;i<count;i++){const panel=panels.nth(i);await panel.scrollIntoViewIfNeeded();const report=await panel.evaluate(inspectScorePanel);assert(report.insideStage&&report.namesVisible&&!report.clipped.length&&!report.namesOverlap&&!report.buttonsOverlap&&!report.blocked.length,'Layout after orientation change: '+JSON.stringify(report));}
   await page.setViewportSize({width,height});await page.waitForTimeout(150);
  }
  assert.deepEqual(errors,[]);if(shots)await page.screenshot({path:path.join(shots,[width,height,count,kind||'double'].join('-')+'.png')});console.log('CHECK',width,height,count,kind||'Dubbel');await context.close();
 }
 if(failures.length){console.log(JSON.stringify(failures,null,2));throw Error(failures.length+' panels fail geometry / hit tests');}
 console.log('PASS: fullscreen score rows, player names, independent buttons, minimize and portrait/desktop regression');
 }finally{await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
