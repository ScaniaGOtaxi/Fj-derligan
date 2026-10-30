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
  const enabled=window.badmintonTwoOneEnabled?.()||false;
  try{window.badmintonTwoOne.validate(players,c,enabled);}catch(e){text.textContent=e.message;detail.textContent='Ändra preferenserna eller slå av Tillåt 2 mot 1.';return;}
  const result=window.badmintonTwoOne.recommend(players,c,enabled);if(!result)return;
  recommended=result.rounds;
  window.badmintonRoundPreview={signature:window.badmintonTwoOne.signature(players,c,enabled),seed:result.seed};
  text.textContent='Banor: '+c+' · Spelare: '+n+'\nNormal: '+players.filter(p=>p.mode==='normal').length+' · Mer singel: '+players.filter(p=>p.mode==='moreSingles').length+' · Endast singel: '+players.filter(p=>p.mode==='onlySingles').length+'\n'+window.badmintonTwoOne.describe(result.layout)+(result.layout.rest?' · '+result.layout.rest+' vilar per runda':' · ingen vila')+'\nFörslag: '+recommended+' rundor\nFörslagets partnerpar: '+result.partners+'/'+result.partnerTotal+' · Motståndarpar: '+result.opponents+'/'+result.opponentTotal;
  detail.textContent='Samma grundlogik används med Tillåt 2 mot 1 PÅ och AV: nya partners först, därefter nya motståndare. Preferenser och jämn spel-/vilofördelning respekteras. Reglaget avgör bara om matcher med 2 mot 1 får användas. '+(result.complete?'Provrotationen täcker alla efterfrågade partner- och motståndarpar.':'Alla efterfrågade par täcktes inte i provrotationen; preferenser och roller kan begränsa variationen.')+' Tre provrotationer jämförs. Förslaget är inte ett bevis på minsta möjliga rundantal. Skapandet använder samma provrotation. Ett kortare manuellt val kan ge mindre täckning.';
  apply.disabled=false;apply.textContent='Välj '+recommended+' rundor';chooseDefault();
 }
 apply.addEventListener('click',()=>{update();if(recommended)choose(recommended,true);});
 rounds.addEventListener('change',()=>{showChosen();if(lastSignature)bmStorage.setItem('badmintonRoundTipChoice',JSON.stringify({version:2,manual:!automaticChoice,signature:lastSignature,rounds:Number(rounds.value)}));});showChosen();
 courts.addEventListener('change',update);
 window.addEventListener('badminton:player-selection-updated',update);
 window.addEventListener('badminton:two-one-changed',update);
 document.getElementById('playerPool')?.addEventListener('change',update);
 if(document.readyState!=='loading')update();
})();




