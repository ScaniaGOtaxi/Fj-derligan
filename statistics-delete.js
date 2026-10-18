(() => {
 'use strict';
 function mount(){
  const tab=document.getElementById('v14-stats');if(!tab||!window.badmintonCloudRequest)return;
  const panel=document.createElement('details');panel.id='bmDeleteStatistics';panel.className='v14Box';panel.hidden=true;
  const heading=document.createElement('summary');heading.textContent='🗑 Radera serverstatistik – Super Admin';heading.style.cssText='cursor:pointer;font-weight:700;min-height:44px';
  const help=document.createElement('p');help.textContent='Raderar avslutade spel, rundor, spelarplaceringar och sparade poäng. Pågående spel med tillhörande statistik, spelare, grupper och konton behålls. Lokal statistik i webbläsaren påverkas inte.';
  const actions=document.createElement('div');actions.style.cssText='display:flex;flex-wrap:wrap;gap:10px';
  const one=document.createElement('button');one.type='button';one.textContent='Radera vald grupps statistik';one.id='bmDeleteGroupStats';
  const all=document.createElement('button');all.type='button';all.textContent='Radera alla gruppers statistik';all.id='bmDeleteAllStats';
  for(const b of [one,all]){b.className='secondary';b.style.cssText='min-height:44px;border:1px solid #d46b6b;white-space:normal';}
  const feedback=document.createElement('p');feedback.id='bmDeleteStatisticsStatus';feedback.setAttribute('role','status');
  actions.append(one,all);panel.append(heading,help,actions,feedback);tab.append(panel);
  const select=document.getElementById('cloudGroupSelect');
  const allowed=()=>window.badmintonCloudRole?.()==='super_admin';
  const selectedGroup=()=>document.getElementById('bmStatsGroup')?.value??select?.value;
  function update(){panel.hidden=!allowed();one.disabled=!selectedGroup();}
  new MutationObserver(update).observe(document.getElementById('cloudAdminPanel'),{attributes:true,attributeFilter:['style']});select?.addEventListener('change',update);document.addEventListener('change',e=>{if(e.target.id==='bmStatsGroup')update();});new MutationObserver(update).observe(tab,{childList:true,subtree:true});new MutationObserver(update).observe(select,{childList:true});update();
  async function rpc(args){try{return await window.badmintonCloudRequest('/rest/v1/rpc/manage_badminton_statistics',{method:'POST',body:JSON.stringify(args)});}catch(e){if(e.code==='PGRST202')throw Error('Serverfunktionen saknas. Installera test/SUPABASE_RADERA_STATISTIK.sql i Supabase först.');throw e;}}
  async function open(groupId){
   if(!allowed())return;
   if(document.getElementById('bmDeleteStatsDialog'))return;
   const previous=document.activeElement,dialog=document.createElement('dialog');dialog.id='bmDeleteStatsDialog';dialog.setAttribute('aria-labelledby','bmDeleteStatsTitle');dialog.style.cssText='box-sizing:border-box;width:min(560px,calc(100vw - 24px));max-height:calc(100dvh - 24px);overflow:auto;background:#152535;color:white;border:1px solid #d46b6b;border-radius:14px;padding:20px';
   const title=document.createElement('h2');title.id='bmDeleteStatsTitle';title.textContent=groupId?'Radera gruppens serverstatistik':'Radera alla gruppers serverstatistik';
   const info=document.createElement('p');info.id='bmDeleteStatsPreview';info.textContent='Hämtar förhandsvisning …';info.style.whiteSpace='pre-line';
   const warning=document.createElement('p');warning.textContent='Raderingen kan inte ångras i appen. Pågående spel och deras statistik skyddas. Spelare, grupper och konton behålls.';
   const label=document.createElement('label');label.htmlFor='bmDeleteStatsConfirm';label.textContent='Vänta på förhandsvisningen.';
   const input=document.createElement('input');input.id='bmDeleteStatsConfirm';input.type='text';input.autocomplete='off';input.disabled=true;input.style.cssText='width:100%;box-sizing:border-box;font-size:16px;min-height:44px;margin:10px 0';
   const status=document.createElement('p');status.id='bmDeleteStatsMessage';status.setAttribute('role','status');
   const controls=document.createElement('div');controls.style.cssText='display:flex;flex-wrap:wrap;gap:10px';
   const remove=document.createElement('button');remove.type='button';remove.textContent='Radera permanent';remove.disabled=true;remove.style.cssText='min-height:44px;background:#992c36;color:white';
   const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Avbryt';cancel.className='secondary';cancel.style.minHeight='44px';
   controls.append(cancel,remove);dialog.append(title,info,warning,label,input,status,controls);(document.fullscreenElement||document.body).append(dialog);
   let preview=null,busy=false;
   dialog.addEventListener('cancel',e=>{if(busy)e.preventDefault();});dialog.addEventListener('close',()=>{dialog.remove();if(previous?.isConnected)previous.focus();});cancel.onclick=()=>{if(!busy)dialog.close();};
   const valid=()=>preview&&preview.sessions>0&&input.value===preview.confirmation&&allowed();
   input.addEventListener('input',()=>{remove.disabled=busy||!valid();});
   remove.onclick=async()=>{
    if(busy||!valid())return;
    busy=true;remove.disabled=true;cancel.disabled=true;input.disabled=true;status.textContent='Raderar … stäng inte sidan.';
    try{
     const result=await rpc({p_group_id:groupId,p_confirmation:input.value,p_expected_signature:preview.signature});
     if(result?.deleted!==true||result.group_id!==groupId)throw Error('Raderingen kunde inte bekräftas. Hämta statistiken igen innan du försöker på nytt.');
     feedback.textContent='✅ '+result.sessions+' avslutade spel, '+result.rounds+' rundor och '+result.scores+' poängposter raderades. Pågående spel behölls.';
     const stats=document.getElementById('cloudStats');if(stats)stats.replaceChildren(document.createTextNode('Serverstatistiken har ändrats. Tryck Uppdatera statistik för att hämta aktuell historik.'));
     dialog.close();
    }catch(e){status.textContent='❌ '+e.message;}
    finally{busy=false;if(dialog.isConnected){cancel.disabled=false;input.disabled=false;remove.disabled=!valid();}}
   };
   dialog.showModal();cancel.focus();
   try{
    const data=await rpc({p_group_id:groupId});if(!dialog.isConnected)return;
    if(data?.group_id!==groupId||data.deleted!==false||typeof data.confirmation!=='string'||!/^[a-f0-9]{32}$/.test(data.signature||'')||!['sessions','rounds','positions','scores','active_sessions'].every(k=>Number.isInteger(data[k])&&data[k]>=0))throw Error('Oväntat svar från förhandsvisningen. Ingen radering kan göras.');
    preview=data;info.textContent=(groupId?'Grupp: '+data.group_name:'Omfattning: alla grupper')+'\nAvslutade spel: '+data.sessions+' · Rundor: '+data.rounds+'\nSpelarplaceringar: '+data.positions+' · Poängposter: '+data.scores+'\nPågående spel som behålls: '+data.active_sessions;
    label.textContent='Skriv exakt: '+data.confirmation;input.disabled=data.sessions===0;status.textContent=data.sessions===0?'Det finns ingen avslutad spelhistorik att radera.':'';if(data.sessions)input.focus();
   }catch(e){if(dialog.isConnected)status.textContent='❌ '+e.message;}
  }
  one.onclick=()=>{const id=selectedGroup();if(id)open(id);};all.onclick=()=>open(null);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>queueMicrotask(mount));else queueMicrotask(mount);
})();
