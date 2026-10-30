/* Test-only rotation variant. Existing cloud activity 'double' stores the two teams;
   a three-player court is identified by its saved team sizes, never as singles. */
(function(root){
 'use strict';
 const legacySupports=(n,c)=>(n===7&&c===2)||(n===11&&c===3);
 const supports=(n,c)=>!!shape(n,c);
 const teams=c=>{const n=c.players||[],split=c.type==='Singel'?1:c.type==='2 mot 1'?(c.teamSplit||1):2;return [n.slice(0,split),n.slice(split)];};
 const teamNumber=(c,i)=>i<teams(c)[0].length?1:2;
 function legacyPlan(players,R,courts,enabled,random=Math.random){
  if(!legacySupports(players.length,courts))return null;
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
 // Fill available courts without rests using 2, 3 or 4 players per match.
 function shape(n,c,only=0){
  if(n<3||n>12||c<1||c>3)return null;
  const choices=[];
  for(let d=0;d<=c;d++)for(let t=0;t<=c-d;t++)for(let s=0;s<=c-d-t;s++)if(4*d+3*t+2*s===n&&t+2*s>=only)choices.push({d,t,s,used:d+t+s});
  return choices.sort((a,b)=>b.used-a.used||a.s-b.s||b.d-a.d)[0]||null;
 }
 const describe=p=>p?[p.d?p.d+' dubbel':null,p.t?p.t+' st 2 mot 1':null,p.s?p.s+' singel':null].filter(Boolean).join(' + '):'';
 const cycle=p=>{const pattern=[...Array(p.t).fill(['solo','duo','duo']).flat(),...Array(p.s*2).fill('single'),...Array(p.d*4).fill('double')];for(let k=1;k<=pattern.length;k++)if(pattern.length%k===0&&pattern.every((x,i)=>x===pattern[i%k]))return k;return pattern.length;};
 function validate(players,c,on){
  if(on&&shape(players.length,c)&&!shape(players.length,c,players.filter(p=>p.mode==='onlySingles').length))throw Error('Valen krockar: det finns inte tillräckligt med ensam- och singelroller för alla med Endast singel utan vila. Ändra preferenserna, välj fler banor eller slå av Tillåt 2 mot 1.');
 }
 function noRestPlan(players,R,c,random){
  const layout=shape(players.length,c,players.filter(p=>p.mode==='onlySingles').length);if(!layout)return null;
  const mix=a=>{const b=a.slice();for(let i=b.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;};
  const normal=players.every(p=>!p.mode||p.mode==='normal'),period=cycle(layout),counts=new Map(players.map(p=>[p.name,{solo:0,duo:0,single:0,double:0}])),partner={},opponent={},ids=new Map(players.map((p,i)=>[p.name,i])),key=(a,b)=>Math.min(ids.get(a),ids.get(b))*players.length+Math.max(ids.get(a),ids.get(b)),add=(map,a,b)=>{const k=key(a,b);map[k]=(map[k]||0)+1;};
  let ring=mix(players);const planned=[];
  let budgets=null,lastPartners=new Set(),lastOpponents=new Set();
  const roleSlots=matches=>matches.flatMap(m=>m.type==='Dubbel'?Array(4).fill('double'):m.type==='Singel'?['single','single']:m.teamSplit===2?['duo','duo','solo']:['solo','duo','duo']);
  const better=(a,b)=>!b||a.some((v,i)=>v!==b[i]&&a.slice(0,i).every((x,j)=>x===b[j])&&v<b[i]);
  function optimize(matches){
   const slots=roleSlots(matches),buckets={solo:[],duo:[],single:[],double:[]};matches.flatMap(m=>m.players).forEach((n,i)=>buckets[slots[i]].push(n));
   const evaluate=ms=>{let pr=0,pc=0,or=0,oc=0,lr=0,lo=0,fair=0;
    for(const m of ms){const [a,b]=teams(m);for(const team of [a,b])if(team.length===2){const k=key(...team),past=partner[k]||0;pr+=past>0?1:0;pc+=past;lr+=lastPartners.has(k)?1:0;}for(const x of a)for(const y of b){const k=key(x,y),past=opponent[k]||0;or+=past>0?1:0;oc+=past;lo+=lastOpponents.has(k)?1:0;}}
    ms.flatMap(m=>m.players).forEach((n,i)=>{fair+=2*counts.get(n)[slots[i]]+1;});return [pr,pc,lr,or,oc,lo,fair];
   };
   let best=null,bestCost=null;
   for(let attempt=0;attempt<96;attempt++){
    let names;
    if(normal){
     const assigned=Array(players.length).fill(-1),edges=slots.map(role=>mix(players.map((p,i)=>i).filter(i=>budgets.get(players[i].name)[role]>0)));
     const assign=(slot,seen)=>{for(const person of edges[slot]){if(seen.has(person))continue;seen.add(person);if(assigned[person]<0||assign(assigned[person],seen)){assigned[person]=slot;return true;}}return false;};
     if(!mix(slots.map((_,i)=>i)).every(slot=>assign(slot,new Set())))continue;
     names=Array(slots.length);assigned.forEach((slot,i)=>{if(slot>=0)names[slot]=players[i].name;});
    }else{const shuffled=Object.fromEntries(Object.entries(buckets).map(([r,n])=>[r,mix(n)]));names=slots.map(role=>shuffled[role].pop());}
    let at=0;const candidate=matches.map(m=>({...m,players:names.slice(at,at+=m.players.length)})),cost=evaluate(candidate);
    if(better(cost,bestCost)){best=candidate;bestCost=cost;}
   }
   if(!best)throw Error('Rollerna kunde inte fördelas. Försök skapa schemat igen.');
   if(normal)best.flatMap(m=>m.players).forEach((name,i)=>budgets.get(name)[slots[i]]--);
   best.flatMap(m=>m.players).forEach((name,i)=>counts.get(name)[slots[i]]++);
   return best;
  }

  const least=(pool,role)=>mix(pool).sort((a,b)=>counts.get(a.name)[role]-counts.get(b.name)[role])[0];
  for(let r=0;r<R;r++){
   if(normal&&r&&r%period===0)ring=mix(players);
   if(normal&&r%period===0)budgets=new Map(players.map(p=>[p.name,{solo:layout.t*period/players.length,duo:2*layout.t*period/players.length,single:2*layout.s*period/players.length,double:4*layout.d*period/players.length}]));
   const triples=[],singles=[];let remaining;
   if(normal){let pos=0;const take=()=>ring[(r%period+pos++)%players.length];
    for(let i=0;i<layout.t;i++)triples.push([take(),take(),take()]);
    for(let i=0;i<layout.s;i++)singles.push([take(),take()]);
    remaining=players.filter(p=>![...triples.flat(),...singles.flat()].includes(p));
   }else{
    let available=mix(players);const remove=p=>{available=available.filter(q=>q!==p);};const solos=[];
    for(let i=0;i<layout.t;i++){const strict=available.filter(p=>p.mode==='onlySingles'),preferred=available.filter(p=>p.mode==='moreSingles');const p=least(strict.length?strict:preferred.length?preferred:available,'solo');solos.push(p);remove(p);}
    const singlePool=[];for(let i=0;i<layout.s*2;i++){const strict=available.filter(p=>p.mode==='onlySingles'),preferred=available.filter(p=>p.mode==='moreSingles');const p=least(strict.length?strict:preferred.length?preferred:available,'single');singlePool.push(p);remove(p);}
    while(singlePool.length){const a=singlePool.shift(),b=mix(singlePool).sort((x,y)=>(opponent[key(a.name,x.name)]||0)-(opponent[key(a.name,y.name)]||0))[0];singlePool.splice(singlePool.indexOf(b),1);singles.push([a,b]);}
    for(const solo of solos){const a=least(available,'duo');remove(a);const b=mix(available).sort((x,y)=>counts.get(x.name).duo-counts.get(y.name).duo||(partner[key(a.name,x.name)]||0)-(partner[key(a.name,y.name)]||0))[0];remove(b);triples.push([solo,a,b]);}
    remaining=available;
   }
   let matches=triples.map(([a,b,c])=>({type:'2 mot 1',teamSplit:1,players:[a.name,b.name,c.name]}));
   for(const pair of singles){matches.push({type:'Singel',players:pair.map(p=>p.name)});}
   while(remaining.length){let best,score=Infinity;const pool=mix(remaining);
    for(let a=0;a<pool.length;a++)for(let b=a+1;b<pool.length;b++)for(let c=b+1;c<pool.length;c++)for(let d=c+1;d<pool.length;d++)for(const order of [[a,b,c,d],[a,c,b,d],[a,d,b,c]]){
     const n=order.map(i=>pool[i].name);let cost=10*((partner[key(n[0],n[1])]||0)+(partner[key(n[2],n[3])]||0));for(const x of n.slice(0,2))for(const y of n.slice(2))cost+=3*(opponent[key(x,y)]||0);if(cost<score){score=cost;best=n;}}
    if(!best)throw Error('Spelarna kunde inte fördelas på banorna.');matches.push({type:'Dubbel',players:best});remaining=remaining.filter(p=>!best.includes(p.name));
   }
   matches=optimize(matches);lastPartners=new Set();lastOpponents=new Set();
   for(const match of matches){const [red,blue]=teams(match);for(const team of [red,blue])if(team.length===2){add(partner,...team);lastPartners.add(key(...team));}for(const a of red)for(const b of blue){add(opponent,a,b);lastOpponents.add(key(a,b));}}
   const offset=r%matches.length;planned.push({courts:matches.slice(offset).concat(matches.slice(0,offset)),rest:[]});
  }
  return planned;
 }
 function plan(players,R,c,on,random=Math.random){if(!on)return legacyPlan(players,R,c,false,random);validate(players,c,on);return noRestPlan(players,R,c,random);}
 const signature=(players,c)=>JSON.stringify([players.map(p=>({name:p.name,mode:p.mode||'normal'})),c]);
 const seeded=initial=>{let seed=initial>>>0;return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};};
 function coverage(rounds,wantedPartners,wantedOpponents){
  const partners=new Set(),opponents=new Set(),key=(a,b)=>JSON.stringify([a,b].sort());let partnerGames=0,opponentGames=0;
  for(const round of rounds)for(const match of round.courts){const [a,b]=teams(match);for(const team of [a,b])if(team.length===2){partners.add(key(...team));partnerGames++;}for(const x of a)for(const y of b){opponents.add(key(x,y));opponentGames++;}}
  return {partners:[...partners].filter(k=>!wantedPartners||wantedPartners.has(k)).length,opponents:[...opponents].filter(k=>!wantedOpponents||wantedOpponents.has(k)).length,partnerRepeats:partnerGames-partners.size,opponentRepeats:opponentGames-opponents.size};
 }
 function recommend(players,c){
  validate(players,c,true);const layout=shape(players.length,c,players.filter(p=>p.mode==='onlySingles').length);if(!layout)return null;
  const normal=players.every(p=>!p.mode||p.mode==='normal'),period=normal?cycle(layout):1,horizon=Math.ceil(Math.max(24,players.length*(players.length-1))/period)*period,key=(a,b)=>JSON.stringify([a,b].sort());let best=null;
  for(let trial=1;trial<=3;trial++){
   const seed=trial*7919+players.length*101+c*17,plan=noRestPlan(players,horizon,c,seeded(seed)),eligible=new Set();
   for(const round of plan)for(const match of round.courts)for(const team of teams(match))if(team.length===2)team.forEach(name=>eligible.add(name));
   const wantedPartners=new Set(),wantedOpponents=new Set(),strict=players.filter(p=>p.mode==='onlySingles').length;
   for(let i=0;i<players.length;i++)for(let j=i+1;j<players.length;j++){const a=players[i],b=players[j],k=key(a.name,b.name);if(eligible.has(a.name)&&eligible.has(b.name))wantedPartners.add(k);if(!(strict<=layout.t&&a.mode==='onlySingles'&&b.mode==='onlySingles'))wantedOpponents.add(k);}
   const seenP=new Set(),seenO=new Set();let last=1;
   for(let r=0;r<plan.length;r++){
    let progress=false;for(const match of plan[r].courts){const [a,b]=teams(match);for(const team of [a,b])if(team.length===2){const k=key(...team);if(wantedPartners.has(k)&&!seenP.has(k)){seenP.add(k);progress=true;}}for(const x of a)for(const y of b){const k=key(x,y);if(wantedOpponents.has(k)&&!seenO.has(k)){seenO.add(k);progress=true;}}}
    if(progress)last=r+1;if(seenP.size===wantedPartners.size&&seenO.size===wantedOpponents.size)break;
   }
   const rounds=last,sample=plan.slice(0,rounds),stats=coverage(sample,wantedPartners,wantedOpponents),complete=stats.partners===wantedPartners.size&&stats.opponents===wantedOpponents.size;
   const candidate={rounds,seed,plan:sample,complete,...stats,partnerTotal:wantedPartners.size,opponentTotal:wantedOpponents.size,layout};
   if(!best||Number(complete)>Number(best.complete)||(complete===best.complete&&(candidate.partners>best.partners||candidate.partners===best.partners&&(candidate.opponents>best.opponents||candidate.opponents===best.opponents&&candidate.rounds<best.rounds))))best=candidate;
  }
  return best;
 }

 const api={supports,teams,teamNumber,plan,validate,shape,describe,cycle,signature,seeded,coverage,recommend};
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
   const layout=shape(n,c,ps.filter(p=>p.mode==='onlySingles').length);
   text.textContent=toggle.checked?(layout?describe(layout)+' · ingen vila. Alla godkänner eventuell 2 mot 1, även Endast singel.':shape(n,c)?'Valen krockar: för många Endast singel för att alla ska spela samtidigt. Ändra preferenserna eller slå av reglaget.':'Alla ryms inte samtidigt på valda banor. Vanlig rotation med vila används.'):'Vanlig singel och dubbel, med vila när det behövs.';
   text.textContent+=' Gäller nästa schema; pågående spel ändras inte.';
  }
  toggle.addEventListener('change',()=>{bmStorage.setItem('badmintonAllowTwoOne',String(toggle.checked));update();window.dispatchEvent(new Event('badminton:two-one-changed'));});
  window.badmintonTwoOneEnabled=()=>toggle.checked;
  document.getElementById('courts').addEventListener('change',update);window.addEventListener('badminton:player-selection-updated',update);document.getElementById('playerPool')?.addEventListener('change',update);update();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})(typeof window!=='undefined'?window:null);


