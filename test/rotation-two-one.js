/* Test-only rotation variant. Existing cloud activity 'double' stores the two teams;
   a three-player court is identified by its saved team sizes, never as singles. */
(function(root){
 'use strict';
 const supports=(n,c)=>(n===7&&c===2)||(n===11&&c===3);
 const teams=c=>{const n=c.players||[],split=c.type==='Singel'?1:c.type==='2 mot 1'?(c.teamSplit||1):2;return [n.slice(0,split),n.slice(split)];};
 const teamNumber=(c,i)=>i<teams(c)[0].length?1:2;
 function plan(players,R,courts,enabled,random=Math.random){
  if(!supports(players.length,courts))return null;
  const only=players.filter(p=>p.mode==='onlySingles');
  if(only.length>1){if(enabled)throw Error('2 mot 1 utan vila har bara en ensamroll per runda. Välj högst en spelare med Endast singel, ändra preferenserna eller slå av Tillåt 2 mot 1.');return null;}
  const mix=a=>{const b=a.slice();for(let i=b.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;};
  const ring=mix(players),normal=players.every(p=>!p.mode||p.mode==='normal');
  const count=Object.fromEntries(players.map(p=>[p.name,{solo:0,duo:0,single:0,rest:0}]));
  const partner={},opponent={},key=(a,b)=>[a,b].sort().join('|'),inc=(map,a,b)=>{const k=key(a,b);map[k]=(map[k]||0)+1;};
  const output=[];let lastRest=null;
  const least=(pool,field)=>mix(pool).sort((a,b)=>count[a.name][field]-count[b.name][field])[0];
  for(let r=0;r<R;r++){
   let solo,duo=[],rest=[],single=[];
   if(normal){
    const offset=1+Math.floor(r/ring.length)%(ring.length-1),nextOffset=offset%(ring.length-1)+1;
    if(enabled){solo=ring[r%ring.length];duo=[ring[(r+offset)%ring.length],ring[(r+nextOffset)%ring.length]];}
    else{rest=[ring[r%ring.length]];single=[ring[(r+offset)%ring.length],ring[(r+nextOffset)%ring.length]];}
   }else{
    const preferred=players.filter(p=>p.mode==='moreSingles');
    solo=least(only.length?only:preferred.length?preferred:players,enabled?'solo':'single');
    const others=players.filter(p=>p!==solo);
    if(enabled){
     const first=least(others,'duo');const second=mix(others.filter(p=>p!==first)).sort((a,b)=>count[a.name].duo-count[b.name].duo||(partner[key(first.name,a.name)]||0)-(partner[key(first.name,b.name)]||0))[0];duo=[first,second];
    }else{
     const eligible=others.filter(p=>p.name!==lastRest);const resting=least(eligible.length?eligible:others,'rest');rest=[resting];
     const rival=mix(others.filter(p=>p!==resting)).sort((a,b)=>count[a.name].single-count[b.name].single||(opponent[key(solo.name,a.name)]||0)-(opponent[key(solo.name,b.name)]||0))[0];single=[solo,rival];
    }
   }
   const excluded=new Set((enabled?[solo,...duo]:[...single,...rest]).map(p=>p.name));
   let remaining=players.filter(p=>!excluded.has(p.name));const round=[];
   while(remaining.length){
    let best,bestScore=Infinity;const pool=mix(remaining);
    for(let a=0;a<pool.length;a++)for(let b=a+1;b<pool.length;b++)for(let c=b+1;c<pool.length;c++)for(let d=c+1;d<pool.length;d++){
     const four=[pool[a],pool[b],pool[c],pool[d]];
     for(const order of [[0,1,2,3],[0,2,1,3],[0,3,1,2]]){
      const n=order.map(i=>four[i].name);let score=10*((partner[key(n[0],n[1])]||0)+(partner[key(n[2],n[3])]||0));
      for(const x of n.slice(0,2))for(const y of n.slice(2))score+=3*(opponent[key(x,y)]||0);
      if(score<bestScore){bestScore=score;best=n;}
     }
    }
    round.push({type:'Dubbel',players:best});remaining=remaining.filter(p=>!best.includes(p.name));
   }
   if(enabled){count[solo.name].solo++;duo.forEach(p=>count[p.name].duo++);round.splice(r%courts,0,{type:'2 mot 1',teamSplit:1,players:[solo.name,...duo.map(p=>p.name)]});}
   else{single.forEach(p=>count[p.name].single++);rest.forEach(p=>count[p.name].rest++);lastRest=rest[0].name;round.splice(r%courts,0,{type:'Singel',players:single.map(p=>p.name)});}
   for(const court of round){const [red,blue]=teams(court);if(red.length===2)inc(partner,...red);if(blue.length===2)inc(partner,...blue);for(const a of red)for(const b of blue)inc(opponent,a,b);}
   output.push({courts:round,rest:rest.map(p=>p.name)});
  }
  return output;
 }
 const validate=(players,c,on)=>{if(on&&supports(players.length,c)&&players.filter(p=>p.mode==='onlySingles').length>1)throw Error('2 mot 1 utan vila har bara en ensamroll per runda. Ändra preferenserna eller slå av Tillåt 2 mot 1.');};
 const api={supports,teams,teamNumber,plan,validate};
 if(typeof module!=='undefined')module.exports=api;
 if(root)root.badmintonTwoOne=api;
 if(typeof document==='undefined')return;
 function init(){
  if(document.documentElement.classList.contains('viewer-mode'))return;
  const area=document.getElementById('playerListArea');if(!area)return;
  const style=document.createElement('style');style.textContent=`
#bmTwoOneSettings{border:2px solid #ff5b65!important;box-shadow:0 0 0 1px #ff5b6526}
#bmTwoOneSettings .bmTwoOneSwitch{position:relative;display:inline-block;flex:0 0 120px;width:120px;height:64px;vertical-align:middle}
#bmTwoOneSettings #bmAllowTwoOne{appearance:none!important;position:absolute!important;inset:0!important;display:block!important;width:100%!important;height:100%!important;min-height:0!important;max-width:none!important;margin:0!important;padding:0!important;border:0!important;opacity:0!important;z-index:2;cursor:pointer}
#bmTwoOneSettings .bmTwoOneTrack{position:absolute;inset:0;box-sizing:border-box;border:3px solid #ff8290;border-radius:999px;background:#a32539;box-shadow:inset 0 0 0 2px #ffffff18;pointer-events:none;transition:background .15s,border-color .15s}
#bmTwoOneSettings .bmTwoOneTrack::after{content:"";position:absolute;top:4px;left:4px;width:50px;height:50px;border-radius:50%;background:#fff;box-shadow:0 2px 5px #0003;transition:transform .15s}
#bmTwoOneSettings #bmTwoOneValue{position:absolute;top:0;bottom:0;right:10px;display:flex;align-items:center;justify-content:center;width:38px;font:800 18px/1 system-ui;color:#fff}
#bmTwoOneSettings #bmAllowTwoOne:checked+.bmTwoOneTrack{background:#008649;border-color:#67f1ac}
#bmTwoOneSettings #bmAllowTwoOne:checked+.bmTwoOneTrack::after{transform:translateX(56px)}
#bmTwoOneSettings #bmAllowTwoOne:checked+.bmTwoOneTrack #bmTwoOneValue{right:auto;left:10px}
#bmTwoOneSettings #bmAllowTwoOne:focus-visible+.bmTwoOneTrack{outline:3px solid #80caff;outline-offset:4px}
@media(prefers-reduced-motion:reduce){#bmTwoOneSettings .bmTwoOneTrack,#bmTwoOneSettings .bmTwoOneTrack::after{transition:none}}
`;document.head.append(style);
  const box=document.createElement('div');box.id='bmTwoOneSettings';box.style.cssText='margin:10px 0;padding:14px;border-radius:14px;background:#152535';
  box.innerHTML='<label style="display:flex;align-items:center;justify-content:space-between;gap:12px;font-weight:700;cursor:pointer"><span>Tillåt 2 mot 1</span><span class="bmTwoOneSwitch"><input id="bmAllowTwoOne" type="checkbox" role="switch"><span class="bmTwoOneTrack" aria-hidden="true"><span id="bmTwoOneValue">AV</span></span></span></label><p id="bmTwoOneSummary" role="status" style="font-size:14px;margin:10px 0 0"></p>';
  area.after(box);
  const toggle=box.querySelector('input'),text=box.querySelector('p'),value=box.querySelector('#bmTwoOneValue');toggle.checked=bmStorage.getItem('badmintonAllowTwoOne')==='true';
  function update(){const ps=selectedPlayers(),n=ps.length,c=Number(document.getElementById('courts').value),supported=supports(n,c);value.textContent=toggle.checked?'PÅ':'AV';toggle.setAttribute('aria-checked',String(toggle.checked));
   text.textContent=supported?(toggle.checked?(ps.filter(p=>p.mode==='onlySingles').length>1?'Valen krockar: bara en ensamroll finns. Ändra preferenserna eller slå av reglaget.':(c-1)+' dubbel + 2 mot 1 · ingen vila. Alla valda spelare godkänner 2 mot 1, även Endast singel.'):(c-1)+' dubbel + 1 singel · 1 vilar (vid högst en Endast singel).'):'Gäller 7 spelare på 2 banor eller 11 spelare på 3 banor. Övriga val använder vanlig rotation.';
   text.textContent+=' Gäller nästa schema; pågående spel ändras inte.';
  }
  toggle.addEventListener('change',()=>{bmStorage.setItem('badmintonAllowTwoOne',String(toggle.checked));update();window.dispatchEvent(new Event('badminton:two-one-changed'));});
  window.badmintonTwoOneEnabled=()=>toggle.checked;
  document.getElementById('courts').addEventListener('change',update);window.addEventListener('badminton:player-selection-updated',update);document.getElementById('playerPool')?.addEventListener('change',update);update();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})(typeof window!=='undefined'?window:null);
