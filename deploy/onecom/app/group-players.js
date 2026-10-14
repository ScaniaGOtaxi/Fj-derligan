/* One profile can be linked to several groups. Membership is separate from today's selection. */
(() => {
 'use strict';
 let api;
 const normalize=value=>String(value||'').trim().toLocaleLowerCase('sv').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
 async function rpc(name,args){
  try{return await api.request('/rest/v1/rpc/'+name,{method:'POST',body:JSON.stringify(args)});}
  catch(error){if(error.code==='PGRST202')throw Error('Gruppfunktionen är inte installerad ännu. Kör SUPABASE_GRUPPSPELARE.sql från GitHub-repot i Supabase SQL Editor och ladda om appen.');throw error;}
 }
 function status(message){const el=document.getElementById('bmGroupPlayerStatus');if(el)el.textContent=message;}
 window.badmintonGroupPlayers={
  configure(value){api=value;},
  create(groupId,name){return rpc('create_badminton_group_player',{p_group_id:groupId,p_name:name});}
 };
 function mount(){
  const manager=document.getElementById('playerManager');if(!manager||!api)return;
  const tools=document.createElement('div');tools.className='bmGroupPlayerTools';
  const open=document.createElement('button');open.type='button';open.id='bmAddExistingPlayers';open.textContent='＋ Lägg till befintliga spelare';
  const help=document.createElement('p');help.textContent='Sök bland alla grupper och återanvänd samma spelarprofil. Markera dagens deltagare i spelarlistan efteråt.';
  const feedback=document.createElement('p');feedback.id='bmGroupPlayerStatus';feedback.setAttribute('role','status');
  tools.append(open,help,feedback);manager.prepend(tools);
  // Keep one server-backed add form visible; the legacy local-only input is confusing here.
  const localAdd=manager.querySelector('.addPlayer');if(localAdd){localAdd.hidden=true;localAdd.style.display='none';}
  const style=document.createElement('style');style.textContent=`
   .bmGroupPlayerTools{padding:12px 0}.bmGroupPlayerTools p{line-height:1.5;margin:8px 0;overflow-wrap:anywhere}
   .bmGroupPlayerDialog{box-sizing:border-box;width:min(680px,calc(100vw - 24px));max-height:calc(100dvh - 24px);padding:20px;border:1px solid #668398;border-radius:14px;background:#14222e;color:#fff;overflow:auto}
   .bmGroupPlayerDialog::backdrop{background:rgba(0,0,0,.72)}
   .bmGroupPlayerDialog h2{margin:0 0 10px;font-size:1.35rem;overflow-wrap:anywhere}
   .bmGroupPlayerDialog p{line-height:1.5}.bmGroupPlayerDialog input[type=search]{box-sizing:border-box;width:100%;font-size:16px;margin:10px 0}
   .bmGroupPlayerDialog input[type=checkbox]{width:22px;height:22px;flex-shrink:0}
   .bmGroupPlayerActions{display:flex;gap:10px;flex-wrap:wrap;margin:12px 0}.bmGroupPlayerActions button{min-height:44px;font-size:16px}
   .bmGroupPlayerResults{max-height:45dvh;overflow:auto;border:1px solid #486274;border-radius:8px}
   .bmGroupPlayerRow{display:flex;gap:12px;align-items:center;min-height:58px;padding:10px;box-sizing:border-box;border-bottom:1px solid #405568;cursor:pointer}
   .bmGroupPlayerRow:last-child{border-bottom:0}.bmGroupPlayerRow>span{min-width:0;overflow-wrap:anywhere}
   .bmGroupPlayerRow strong{font-size:18px}.bmGroupPlayerRow small{display:block;color:#c4d6e4;font-size:14px;line-height:1.5}.bmGroupPlayerRow img{width:27px;height:18px;object-fit:contain;margin-right:4px;vertical-align:middle}
   .bmGroupPlayerRow:has(input:disabled){opacity:.7;cursor:default}.bmGroupPlayerDialog [role=status]{white-space:pre-wrap;overflow-wrap:anywhere}
   @media(max-width:420px){.bmGroupPlayerDialog{padding:14px}.bmGroupPlayerActions button{flex:1 1 130px}}
  `;document.head.append(style);
  open.addEventListener('click',async()=>{
   const context=api.context();
   if(!context.loggedIn){status('Logga in som Admin eller Super Admin först.');return;}
   if(!context.groupId){status('Välj gruppen som spelarna ska läggas till i först.');return;}
   if(document.getElementById('bmGroupPlayerDialog'))return;
   const previous=document.activeElement;
   const dialog=document.createElement('dialog');dialog.id='bmGroupPlayerDialog';dialog.className='bmGroupPlayerDialog';dialog.setAttribute('aria-labelledby','bmGroupPlayerHeading');
   const heading=document.createElement('h2');heading.id='bmGroupPlayerHeading';heading.textContent='Lägg till spelare i '+context.groupName;
   const intro=document.createElement('p');intro.textContent='Här visas befintliga spelare från alla grupper. De behåller sina tidigare grupper, flaggor och historik.';
   const search=document.createElement('input');search.type='search';search.placeholder='Sök spelarnamn eller grupp';search.setAttribute('aria-label','Sök befintliga spelare');search.autocomplete='off';
   const counter=document.createElement('p');counter.setAttribute('aria-live','polite');
   const actions=document.createElement('div');actions.className='bmGroupPlayerActions';
   const selectAll=document.createElement('button');selectAll.type='button';selectAll.textContent='Markera sökträffar';selectAll.disabled=true;
   const clear=document.createElement('button');clear.type='button';clear.textContent='Avmarkera alla';clear.disabled=true;
   actions.append(selectAll,clear);
   const results=document.createElement('div');results.className='bmGroupPlayerResults';results.setAttribute('role','group');results.setAttribute('aria-label','Befintliga spelare');
   const message=document.createElement('p');message.setAttribute('role','status');message.textContent='Hämtar spelarregistret …';
   const footer=document.createElement('div');footer.className='bmGroupPlayerActions';
   const add=document.createElement('button');add.type='button';add.textContent='Lägg till i gruppen';add.disabled=true;
   const close=document.createElement('button');close.type='button';close.textContent='Avbryt';close.className='secondary';footer.append(add,close);
   dialog.append(heading,intro,search,actions,counter,results,message,footer);document.body.append(dialog);
   let catalog=[],selected=new Set(),saving=false;
   const groupSelect=document.getElementById('cloudGroupSelect');
   const finish=()=>{dialog.close();};
   const groupChanged=()=>{if(api.context().groupId!==context.groupId)finish();};
   groupSelect.addEventListener('change',groupChanged);
   dialog.addEventListener('close',()=>{groupSelect.removeEventListener('change',groupChanged);dialog.remove();if(previous?.isConnected)previous.focus();});
   dialog.addEventListener('cancel',event=>{if(saving)event.preventDefault();});close.addEventListener('click',finish);
   const visible=()=>{const q=normalize(search.value);return catalog.filter(p=>!q||normalize(p.name+' '+p.groups.join(' ')).includes(q));};
   function update(){counter.textContent=visible().length+' av '+catalog.length+' spelare · '+selected.size+' valda';add.disabled=saving||selected.size===0;clear.disabled=saving||!selected.size;selectAll.disabled=saving||!visible().some(p=>!p.already_member);}
   function render(){
    results.replaceChildren();
    visible().forEach(player=>{
     const row=document.createElement('label');row.className='bmGroupPlayerRow';
     const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=player.already_member||selected.has(player.id);checkbox.disabled=saving||player.already_member;checkbox.setAttribute('aria-label','Välj '+player.name+' från '+player.groups.join(', '));
     const text=document.createElement('span'),name=document.createElement('strong');
     [player.country_code,player.second_country_code].filter(code=>/^[A-Z]{2}$/.test(code||'')).forEach(code=>{const img=document.createElement('img');img.alt='';img.dataset.country=code;img.src=window.badmintonFlagUrl(code);img.onerror=()=>window.badmintonFlagFallback(img);name.append(img);});
     name.append(document.createTextNode(player.name));
     const groups=document.createElement('small');groups.textContent=player.groups.join(', ')||'Ingen grupp';text.append(name,groups);
     if(player.already_member){const already=document.createElement('small');already.textContent='✓ Finns redan i gruppen';text.append(already);}
     checkbox.addEventListener('change',()=>{if(checkbox.checked)selected.add(player.id);else selected.delete(player.id);update();});
     row.append(checkbox,text);results.append(row);
    });
    if(!visible().length){const empty=document.createElement('p');empty.style.padding='12px';empty.textContent=catalog.length?'Inga spelare matchar sökningen.':'Det finns inga spelare ännu. Stäng och använd Skapa ny spelare i gruppen.';results.append(empty);}
    update();
   }
   search.addEventListener('input',render);
   selectAll.addEventListener('click',()=>{visible().filter(p=>!p.already_member).forEach(p=>selected.add(p.id));render();});
   clear.addEventListener('click',()=>{selected.clear();render();});
   add.addEventListener('click',async()=>{
    if(saving||!selected.size)return;
    if(api.context().groupId!==context.groupId){finish();status('Gruppen har ändrats. Välj spelare för den nya gruppen.');return;}
    if(selected.size>1000){message.textContent='Välj högst 1000 spelare åt gången.';return;}
    saving=true;close.disabled=true;search.disabled=true;render();message.textContent='Lägger till spelarna …';
    let added;
    try{
     added=await rpc('add_badminton_group_players',{p_group_id:context.groupId,p_player_ids:[...selected]});
     if(!Number.isInteger(added)||added<0)throw Error('Oväntat svar vid tilldelning. Hämta spelarregistret igen för att kontrollera gruppen.');
     const notice='✅ '+added+' spelare har lagts till i '+context.groupName+'. Tidigare grupper behålls. Markera dagens deltagare i spelarlistan.';
     try{await api.refresh(context.groupId);status(notice);}
     catch(error){status(notice+' Spelarlistan kunde inte uppdateras: '+error.message+'. Tryck Hämta gruppens spelare.');}
     finish();
    }catch(error){message.textContent='❌ '+error.message;}
    finally{saving=false;if(dialog.isConnected){close.disabled=false;search.disabled=false;render();}}
   });
   dialog.showModal();search.focus();
   try{
    const byId=new Map();let offset=0;
    while(dialog.isConnected){
     const page=await rpc('get_badminton_player_catalog',{p_group_id:context.groupId,p_offset:offset});
     if(!Array.isArray(page)||page.some(p=>!p.id||typeof p.name!=='string'||!Array.isArray(p.groups)))throw Error('Oväntat svar från spelarregistret');
     page.forEach(p=>byId.set(p.id,p));offset+=page.length;
     if(page.length<200)break;
    }
    if(!dialog.isConnected)return;
    catalog=[...byId.values()];message.textContent='Tilldelning ändrar gruppmedlemskap. Den väljer inte spelare för dagens spel.';render();
   }catch(error){if(dialog.isConnected)message.textContent='❌ '+error.message;}
  });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>queueMicrotask(mount));else mount();
})();
