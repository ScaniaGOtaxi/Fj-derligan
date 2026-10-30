(() => {
 'use strict';
 const courts=document.getElementById('courts'),rounds=document.getElementById('rounds');
 const summary=document.getElementById('playerSummary');
 if(!courts||!rounds||!summary||document.documentElement.classList.contains('viewer-mode'))return;
 const box=document.createElement('div');box.id='bmRoundTip';box.style.cssText='padding:12px;margin:12px 0;border:1px solid #54718b;border-radius:12px;background:#152535;line-height:1.5';
 const text=document.createElement('p');text.id='bmRoundTipText';text.setAttribute('role','status');text.style.cssText='margin:0 0 10px;white-space:pre-line;line-height:1.6';
 const detail=document.createElement('p');detail.id='bmRoundTipInfo';detail.hidden=true;detail.style.cssText='margin:0 0 8px;font-size:14px;color:#c6d7e7';
 const chosen=document.createElement('span');chosen.id='bmRoundTipChosen';chosen.style.cssText='font-size:13px;color:#c6d7e7;align-self:center';
 const showChosen=()=>{chosen.textContent='Valt för nästa schema: '+rounds.value+' rundor'+(recommended&&Number(rounds.value)<recommended?' · Kortare än förslaget; täckningen kan bli lägre.':'');};
 const apply=document.createElement('button');apply.id='bmApplyRoundTip';apply.type='button';apply.className='secondary';apply.style.minHeight='44px';
 const info=document.createElement('button');info.id='bmRoundTipInfoButton';info.type='button';info.className='secondary';info.textContent='ⓘ Info';info.style.minHeight='44px';info.setAttribute('aria-expanded','false');info.setAttribute('aria-controls',detail.id);
 const actions=document.createElement('div');actions.style.cssText='display:flex;flex-wrap:wrap;gap:8px;margin-bottom:4px';actions.append(apply,info,chosen);
 info.addEventListener('click',()=>{detail.hidden=!detail.hidden;info.setAttribute('aria-expanded',String(!detail.hidden));});
 box.append(text,actions,detail);
 const place=()=>{(document.getElementById('bmTwoOneSettings')||document.getElementById('playerListArea')).after(box);const next=document.getElementById('bmPlayersNext');if(next)box.after(next);};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>queueMicrotask(()=>{place();update();}));else place();
 let recommended=null,lastSignature=null,initial=true,savedChoice=null,automaticChoice=false;
 try{savedChoice=JSON.parse(bmStorage.getItem('badmintonRoundTipChoice')||'null');}catch{}
 function choose(value,automatic=false){
  if(!Number.isInteger(value)||value<1)return;
  if(![...rounds.options].some(o=>Number(o.value)===value))rounds.add(new Option(String(value),String(value)));
  rounds.value=String(value);automaticChoice=automatic;rounds.dispatchEvent(new Event('change',{bubbles:true}));automaticChoice=false;
 }
 function chooseDefault(){const value=initial&&savedChoice?.version===2&&savedChoice.manual&&savedChoice.signature===lastSignature&&Number.isInteger(savedChoice.rounds)&&savedChoice.rounds>0?savedChoice.rounds:recommended;const restoringManual=initial&&value===savedChoice?.rounds&&savedChoice?.version===2&&savedChoice.manual&&savedChoice.signature===lastSignature;initial=false;choose(value,!restoringManual);}

 function update(){
  const players=selectedPlayers(),n=players.length,c=Number(courts.value);
  const signature=JSON.stringify([players,c,window.badmintonTwoOneEnabled?.()||false]);if(signature===lastSignature)return;lastSignature=signature;recommended=null;window.badmintonRoundPreview=null;apply.hidden=false;apply.disabled=true;apply.textContent='Välj rundor';detail.hidden=true;info.setAttribute('aria-expanded','false');
  if(n<3||n>12){text.textContent='Banor: '+c+' · Spelare: '+n+'\nFörslag: markera 3–12 deltagare för dagens spel.';detail.textContent='Tipset uppdateras när du ändrar deltagare eller antal banor.';return;}
  if(window.badmintonTwoOneEnabled?.()){
   try{window.badmintonTwoOne.validate(players,c,true);}catch(e){text.textContent=e.message;detail.textContent='Ändra preferenserna eller slå av Tillåt 2 mot 1.';return;}
  }
  if(window.badmintonTwoOneEnabled?.()&&window.badmintonTwoOne.shape(n,c,players.filter(p=>p.mode==='onlySingles').length)){
   const result=window.badmintonTwoOne.recommend(players,c);
   recommended=result.rounds;
   window.badmintonRoundPreview={signature:window.badmintonTwoOne.signature(players,c),seed:result.seed};
   text.textContent='Banor: '+c+' · Spelare: '+n+'\nNormal: '+players.filter(p=>p.mode==='normal').length+' · Mer singel: '+players.filter(p=>p.mode==='moreSingles').length+' · Endast singel: '+players.filter(p=>p.mode==='onlySingles').length+'\n'+window.badmintonTwoOne.describe(result.layout)+' · ingen vila\nFörslag: '+recommended+' rundor\nFörslagets partnerpar: '+result.partners+'/'+result.partnerTotal+' · Motståndarpar: '+result.opponents+'/'+result.opponentTotal;
   detail.textContent='Prioritet: undvik samma partner, därefter samma motståndare. Vanliga singelpreferenser och jämna rollcykler respekteras. '+(result.complete?'Provrotationen täcker alla efterfrågade partner- och motståndarpar.':'Alla efterfrågade par täcktes inte i provrotationen; preferenser och roller kan begränsa variationen.')+' Förslaget jämför tre provrotationer och garanterar inte minsta möjliga rundantal. När du använder förslaget skapas samma provrotation. Ett kortare manuellt rundval täcker inte nödvändigtvis alla par.';
   apply.disabled=false;apply.textContent='Välj '+recommended+' rundor';chooseDefault();return;
  }
  const wanted=new Set(),onlySingles=players.filter(p=>p.mode==='onlySingles').length,moreSingles=players.filter(p=>p.mode==='moreSingles').length;
  const horizon=Math.max(24,n*(n-1));
  const key=(kind,a,b)=>kind+':'+pairKey(a,b);
  let best=null;
  for(let trial=1;trial<=3;trial++){
   let seed=trial*7919+n*101+c*17;
   const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
   const plan=badmintonPlanSchedule(players,horizon,c,random);
   const hasDouble=plan.some(r=>r.courts.some(c=>c.type==='Dubbel'));
   wanted.clear();
   for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){
    const a=players[i],b=players[j];
    if(hasDouble&&a.mode!=='onlySingles'&&b.mode!=='onlySingles')wanted.add(key('dubbel',a.name,b.name));
    if(!hasDouble||a.mode!=='normal'||b.mode!=='normal')wanted.add(key('singel',a.name,b.name));
   }
   const seen=new Set(),played=new Set();let covered=0,lastImprovement=0;
   for(let i=0;i<plan.length;i++){
    const before=covered,playedBefore=played.size;
    for(const court of plan[i].courts){
     court.players.forEach(name=>played.add(name));
     const names=court.players;
     if(court.type==='Dubbel'){seen.add(key('dubbel',names[0],names[1]));seen.add(key('dubbel',names[2],names[3]));}
     else if(names.length===2)seen.add(key('singel',names[0],names[1]));
    }
    covered=[...wanted].filter(k=>seen.has(k)).length;
    if(covered>before||played.size>playedBefore)lastImprovement=i+1;
    if(covered===wanted.size&&played.size===n)break;
   }
   const candidate={rounds:Math.max(1,lastImprovement),covered,total:wanted.size,plan,hasDouble};
   if(!best||candidate.covered>best.covered||(candidate.covered===best.covered&&candidate.rounds<best.rounds))best=candidate;
  }
  recommended=best.rounds;
  const sample=best.plan.slice(0,recommended);
  const doubles=sample.reduce((sum,r)=>sum+r.courts.filter(c=>c.type==='Dubbel').length,0);
  const singles=sample.reduce((sum,r)=>sum+r.courts.filter(c=>c.type==='Singel').length,0);
  const rests=sample.reduce((sum,r)=>sum+r.rest.length,0);
  text.textContent='Banor: '+c+' · Spelare: '+n+'\nNormal: '+(n-onlySingles-moreSingles)+' · Mer singel: '+moreSingles+' · Endast singel: '+onlySingles+'\nFörslag: '+recommended+' rundor';
  detail.textContent='Valda preferenser: '+(n-onlySingles-moreSingles)+' Normal, '+moreSingles+' Mer singel, '+onlySingles+' Endast singel. Provrotationen innehåller '+doubles+' dubbelmatcher, '+singles+' singelmatcher och '+rests+' vilotillfällen. '+
   (best.covered===best.total?'Provrotationen täcker alla '+best.total+' efterfrågade par/möten.':'Provrotationen täcker '+best.covered+' av '+best.total+' efterfrågade par/möten; fler rundor gav ingen ytterligare täckning i provet.')+
   ' Målet är alla dubbelpartners bland spelare som får spela dubbel, samt olika singelmotståndare för spelare med singelpreferens. Vid rent singelspel är målet alla motståndare. Endast singel placeras aldrig i dubbel; Mer singel prioriteras för singel. Tipset bygger på tre provrotationer med samma logik som schemat. Det är en uppskattning, inte ett garanterat minimiantal; det skapade schemat kan skilja sig.';
  apply.hidden=false;apply.disabled=false;apply.textContent='Välj '+recommended+' rundor';chooseDefault();
 }
 apply.addEventListener('click',()=>{update();if(recommended)choose(recommended,true);});
 rounds.addEventListener('change',()=>{showChosen();if(lastSignature)bmStorage.setItem('badmintonRoundTipChoice',JSON.stringify({version:2,manual:!automaticChoice,signature:lastSignature,rounds:Number(rounds.value)}));});showChosen();
 courts.addEventListener('change',update);
 window.addEventListener('badminton:player-selection-updated',update);
 window.addEventListener('badminton:two-one-changed',update);
 document.getElementById('playerPool')?.addEventListener('change',update);
 if(document.readyState!=='loading')update();
})();



