(() => {
 'use strict';
 const courts=document.getElementById('courts'),rounds=document.getElementById('rounds');
 const summary=document.getElementById('playerSummary');
 if(!courts||!rounds||!summary||document.documentElement.classList.contains('viewer-mode'))return;
 const box=document.createElement('div');box.id='bmRoundTip';box.style.cssText='padding:12px;margin:12px 0;border:1px solid #54718b;border-radius:12px;background:#152535;line-height:1.5';
 const text=document.createElement('p');text.id='bmRoundTipText';text.setAttribute('role','status');text.style.margin='0 0 8px';
 const detail=document.createElement('p');detail.style.cssText='margin:0 0 8px;font-size:14px;color:#c6d7e7';
 const apply=document.createElement('button');apply.id='bmApplyRoundTip';apply.type='button';apply.className='secondary';apply.style.minHeight='44px';
 box.append(text,detail,apply);summary.closest('.topTools').after(box);
 let recommended=null;
 function update(){
  const players=selectedPlayers(),n=players.length,c=Number(courts.value);recommended=null;apply.hidden=true;
  if(n<3||n>12){text.textContent='Rundtips: markera 3–12 deltagare för dagens spel.';detail.textContent='Tipset uppdateras när du ändrar deltagare eller antal banor.';return;}
  if(players.some(p=>p.mode!=='normal')){text.textContent='Rundtips: Mer singel eller Endast singel är valt.';detail.textContent='Ett tips om alla dubbelpartners kräver att alla har Normal. Spelarpreferenser kan begränsa vilka som kan spela tillsammans.';return;}
  let singles=c===3?Math.max(0,Math.min(c,Math.ceil((4*c-n)/2))):0;
  singles=Math.min(singles,Math.floor(n/2));
  const doubles=Math.min(c-singles,Math.floor((n-2*singles)/4));
  singles+=Math.min(c-doubles-singles,Math.floor((n-4*doubles-2*singles)/2));
  const resting=n-4*doubles-2*singles;
  const pairs=n*(n-1)/2;
  if(doubles){
   recommended=Math.max(n-1,Math.ceil(pairs/(2*doubles)));
   text.textContent='Tips: '+recommended+' rundor för '+n+' spelare på '+c+' '+(c===1?'bana':'banor')+'. Målet är att alla ska vara lagkamrat med alla minst en gång.';
   detail.textContent=pairs+' möjliga dubbelpar. Normalupplägg per runda: '+doubles+' dubbelmatch'+(doubles===1?'':'er')+(singles?' + '+singles+' singelmatch'+(singles===1?'':'er'):'')+'; '+resting+' vilar. Antalet är ett beräknat minimum. Appen försöker variera lagkamrater, motståndare och vila; alla par garanteras inte bara genom att välja detta antal rundor.';
  }else{
   recommended=Math.max(n%2?n:n-1,Math.ceil(pairs/singles));
   text.textContent='Tips: '+recommended+' rundor för '+n+' spelare på '+c+' '+(c===1?'bana':'banor')+'. Upplägget blir singel – målet är att alla möter alla minst en gång.';
   detail.textContent=pairs+' möjliga singelmöten; '+singles+' singelmatch'+(singles===1?'':'er')+' och '+resting+' vilande per runda. Beräknat minimum; rotationsschemat garanterar inte alla möten.';
  }
  apply.hidden=false;apply.textContent='Välj '+recommended+' rundor';
 }
 apply.addEventListener('click',()=>{
  update();if(!recommended)return;
  if(![...rounds.options].some(o=>Number(o.value)===recommended))rounds.add(new Option(String(recommended),String(recommended)));
  rounds.value=String(recommended);rounds.dispatchEvent(new Event('change',{bubbles:true}));
 });
 courts.addEventListener('change',update);
 window.addEventListener('badminton:player-selection-updated',update);
 document.getElementById('playerPool')?.addEventListener('change',update);
 update();
})();
