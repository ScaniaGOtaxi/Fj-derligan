/* One planner for singles, doubles and optional 2-v-1. No server credentials. */
(function(root){
 'use strict';
 const valid=(n,c)=>Number.isInteger(n)&&n>=3&&n<=12&&Number.isInteger(c)&&c>=1&&c<=3;
 const teams=c=>{const n=c.players||[],split=c.type==='Singel'?1:c.type==='2 mot 1'?(c.teamSplit||1):2;return [n.slice(0,split),n.slice(split)];};
 const teamNumber=(c,i)=>i<teams(c)[0].length?1:2;
 function selectLayout(n,c,only=0,on=true){
  if(!valid(n,c))return null;const choices=[];
  for(let d=0;d<=c;d++)for(let t=0;t<=(on?c-d:0);t++)for(let s=0;s<=c-d-t;s++){
   const rest=n-4*d-3*t-2*s;if(rest<0||d+t+s===0||t+2*s+rest<only||only>0&&t+2*s===0)continue;
   choices.push({d,t,s,used:d+t+s,rest});
  }
  return choices.sort((a,b)=>a.rest-b.rest||b.used-a.used||a.s-b.s||b.d-a.d)[0]||null;
 }
 function shape(n,c,only=0,on=true){const p=selectLayout(n,c,only,on);if(!p||p.rest)return null;const {rest,...withoutRest}=p;return withoutRest;}
 const supports=valid;
 const describe=p=>p?[p.d?p.d+' dubbel':null,p.t?p.t+' st 2 mot 1':null,p.s?p.s+' singel':null].filter(Boolean).join(' + '):'';
 const cycle=p=>{const pattern=[...Array(p.t).fill(['solo','duo','duo']).flat(),...Array(p.s*2).fill('single'),...Array(p.d*4).fill('double'),...Array(p.rest||0).fill('rest')];for(let k=1;k<=pattern.length;k++)if(pattern.length%k===0&&pattern.every((x,i)=>x===pattern[i%k]))return k;return pattern.length;};
 function validate(players,c,on){if(on&&shape(players.length,c)&&!shape(players.length,c,players.filter(p=>p.mode==='onlySingles').length))throw Error('Valen krockar: det finns inte tillräckligt med ensam- och singelroller för alla med Endast singel utan vila. Ändra preferenserna, välj fler banor eller slå av Tillåt 2 mot 1.');}
 const signature=(players,c,on=true)=>JSON.stringify([players.map(p=>({name:p.name,mode:p.mode||'normal'})),c,!!on]);
 const seeded=initial=>{let seed=initial>>>0;return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};};
 function plan(players,R,c,on,random=Math.random){
  if(!valid(players.length,c))return null;validate(players,c,on);
  const layout=selectLayout(players.length,c,players.filter(p=>p.mode==='onlySingles').length,on),normal=players.every(p=>!p.mode||p.mode==='normal'),period=cycle(layout);
  const mix=a=>{const b=a.slice();for(let i=b.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;};
  const ids=new Map(players.map((p,i)=>[p.name,i])),key=(a,b)=>Math.min(ids.get(a),ids.get(b))*players.length+Math.max(ids.get(a),ids.get(b)),partner={},opponent={},counts=new Map(players.map(p=>[p.name,{solo:0,duo:0,single:0,double:0,rest:0}]));
  const template=[...Array.from({length:layout.t},()=>({type:'2 mot 1',teamSplit:1,players:Array(3)})),...Array.from({length:layout.s},()=>({type:'Singel',players:Array(2)})),...Array.from({length:layout.d},()=>({type:'Dubbel',players:Array(4)}))];
  const slots=[...template.flatMap(m=>m.type==='Dubbel'?Array(4).fill('double'):m.type==='Singel'?['single','single']:['solo','duo','duo']),...Array(layout.rest).fill('rest')];
  const strict=players.filter(p=>p.mode==='onlySingles').length,strictCanAllPlay=strict===1&&layout.t+2*layout.s>0;
  const better=(a,b)=>!b||a.some((v,i)=>v!==b[i]&&a.slice(0,i).every((x,j)=>x===b[j])&&v<b[i]);
  let budgets,lastPartners=new Set(),lastOpponents=new Set(),lastRest=new Set();const planned=[];
  function cost(matches,names){let pr=0,pc=0,lr=0,or=0,oc=0,lo=0,fair=0,restFair=0,repeatRest=0,preference=0;
   for(const m of matches){const [a,b]=teams(m);for(const team of [a,b])if(team.length===2){const k=key(...team),past=partner[k]||0;pr+=past>0?1:0;pc+=past;lr+=lastPartners.has(k)?1:0;}for(const x of a)for(const y of b){const k=key(x,y),past=opponent[k]||0;or+=past>0?1:0;oc+=past;lo+=lastOpponents.has(k)?1:0;}}
   names.forEach((name,i)=>{const role=slots[i],p=players[ids.get(name)],count=counts.get(name);fair+=2*count[role]+1;if(role==='rest'){restFair+=2*count.rest+1;repeatRest+=lastRest.has(name)?1:0;}if(p.mode==='moreSingles'&&!['solo','single'].includes(role))preference++;});
   return [restFair,repeatRest,preference,pr,pc,lr,or,oc,lo,fair];
  }
  for(let r=0;r<R;r++){
   if(normal&&r%period===0)budgets=new Map(players.map(p=>[p.name,{solo:layout.t*period/players.length,duo:2*layout.t*period/players.length,single:2*layout.s*period/players.length,double:4*layout.d*period/players.length,rest:layout.rest*period/players.length}]));
   let best=null,bestNames=null,bestCost=null;
   for(let attempt=0;attempt<96;attempt++){
    const assigned=Array(players.length).fill(-1),edges=slots.map(role=>mix(players.map((p,i)=>i).filter(i=>{
     const p=players[i];if(normal&&budgets.get(p.name)[role]<=0)return false;
     if(normal&&layout.rest){const low=Math.floor((r+1)*layout.rest/players.length),high=Math.ceil((r+1)*layout.rest/players.length),past=counts.get(p.name).rest;if(role==='rest'?past>=high:past<low)return false;}
     return p.mode!=='onlySingles'||role==='solo'||role==='single'||role==='rest'&&!strictCanAllPlay;
    })));
    const assign=(slot,seen)=>{for(const person of edges[slot]){if(seen.has(person))continue;seen.add(person);if(assigned[person]<0||assign(assigned[person],seen)){assigned[person]=slot;return true;}}return false;};
    if(!mix(slots.map((_,i)=>i)).every(slot=>assign(slot,new Set())))continue;
    const names=Array(slots.length);assigned.forEach((slot,i)=>{if(slot>=0)names[slot]=players[i].name;});let at=0;const candidate=template.map(m=>({...m,players:names.slice(at,at+=m.players.length)})),value=cost(candidate,names);
    if(better(value,bestCost)){best=candidate;bestNames=names;bestCost=value;}
   }
   if(!best)throw Error('Rollerna kunde inte fördelas. Försök skapa schemat igen.');
   bestNames.forEach((name,i)=>{if(normal)budgets.get(name)[slots[i]]--;counts.get(name)[slots[i]]++;});
   lastPartners=new Set();lastOpponents=new Set();
   for(const m of best){const [a,b]=teams(m);for(const team of [a,b])if(team.length===2){const k=key(...team);partner[k]=(partner[k]||0)+1;lastPartners.add(k);}for(const x of a)for(const y of b){const k=key(x,y);opponent[k]=(opponent[k]||0)+1;lastOpponents.add(k);}}
   const rest=bestNames.slice(players.length-layout.rest);lastRest=new Set(layout.rest?rest:[]);const offset=r%best.length;planned.push({courts:best.slice(offset).concat(best.slice(0,offset)),rest:layout.rest?rest:[]});
  }
  return planned;
 }
 function coverage(rounds,wantedPartners,wantedOpponents){
  const partners=new Set(),opponents=new Set(),key=(a,b)=>JSON.stringify([a,b].sort());let partnerGames=0,opponentGames=0;
  for(const round of rounds)for(const match of round.courts){const [a,b]=teams(match);for(const team of [a,b])if(team.length===2){partners.add(key(...team));partnerGames++;}for(const x of a)for(const y of b){opponents.add(key(x,y));opponentGames++;}}
  return {partners:[...partners].filter(k=>!wantedPartners||wantedPartners.has(k)).length,opponents:[...opponents].filter(k=>!wantedOpponents||wantedOpponents.has(k)).length,partnerRepeats:partnerGames-partners.size,opponentRepeats:opponentGames-opponents.size};
 }
 function recommend(players,c,on=true){
  validate(players,c,on);const layout=selectLayout(players.length,c,players.filter(p=>p.mode==='onlySingles').length,on);if(!layout)return null;
  const normal=players.every(p=>!p.mode||p.mode==='normal'),period=normal?cycle(layout):1,horizon=Math.ceil(Math.max(24,players.length*(players.length-1))/period)*period,key=(a,b)=>JSON.stringify([a,b].sort());let best=null;
  for(let trial=1;trial<=3;trial++){
   const seed=trial*7919+players.length*101+c*17,proposal=plan(players,horizon,c,on,seeded(seed)),eligible=new Set();
   for(const round of proposal)for(const match of round.courts)for(const team of teams(match))if(team.length===2)team.forEach(name=>eligible.add(name));
   const wantedPartners=new Set(),wantedOpponents=new Set(),strict=players.filter(p=>p.mode==='onlySingles').length;
   for(let i=0;i<players.length;i++)for(let j=i+1;j<players.length;j++){const a=players[i],b=players[j],k=key(a.name,b.name);if(eligible.has(a.name)&&eligible.has(b.name))wantedPartners.add(k);if(!(strict<=layout.t&&a.mode==='onlySingles'&&b.mode==='onlySingles'))wantedOpponents.add(k);}
   const seenP=new Set(),seenO=new Set();let last=1;
   for(let r=0;r<proposal.length;r++){
    let progress=false;for(const match of proposal[r].courts){const [a,b]=teams(match);for(const team of [a,b])if(team.length===2){const k=key(...team);if(wantedPartners.has(k)&&!seenP.has(k)){seenP.add(k);progress=true;}}for(const x of a)for(const y of b){const k=key(x,y);if(wantedOpponents.has(k)&&!seenO.has(k)){seenO.add(k);progress=true;}}}
    if(progress)last=r+1;if(seenP.size===wantedPartners.size&&seenO.size===wantedOpponents.size)break;
   }
   const rounds=last,sample=proposal.slice(0,rounds),stats=coverage(sample,wantedPartners,wantedOpponents),complete=stats.partners===wantedPartners.size&&stats.opponents===wantedOpponents.size;
   const candidate={rounds,seed,plan:sample,complete,...stats,partnerTotal:wantedPartners.size,opponentTotal:wantedOpponents.size,layout};
   if(!best||Number(complete)>Number(best.complete)||(complete===best.complete&&(candidate.partners>best.partners||candidate.partners===best.partners&&(candidate.opponents>best.opponents||candidate.opponents===best.opponents&&candidate.rounds<best.rounds))))best=candidate;
  }
  return best;
 }


 const api={supports,teams,teamNumber,plan,validate,shape,selectLayout,describe,cycle,signature,seeded,coverage,recommend};
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
   let problem='';try{validate(ps,c,toggle.checked);}catch(e){problem=e.message;}
   const layout=selectLayout(n,c,ps.filter(p=>p.mode==='onlySingles').length,toggle.checked);
   text.textContent=problem||(!layout?'Markera 3–12 spelare och välj 1–3 banor.':describe(layout)+(layout.rest?' · '+layout.rest+' vilar per runda. Alla ryms inte samtidigt med dessa val.':' · ingen vila.')+(toggle.checked?' Alla godkänner eventuell 2 mot 1, även Endast singel.':' 2 mot 1 används inte.'));
   text.textContent+=' Gäller nästa schema; pågående spel ändras inte.';
  }
  toggle.addEventListener('change',()=>{bmStorage.setItem('badmintonAllowTwoOne',String(toggle.checked));update();window.dispatchEvent(new Event('badminton:two-one-changed'));});
  window.badmintonTwoOneEnabled=()=>toggle.checked;
  document.getElementById('courts').addEventListener('change',update);window.addEventListener('badminton:player-selection-updated',update);document.getElementById('playerPool')?.addEventListener('change',update);update();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})(typeof window!=='undefined'?window:null);



