(() => {
 'use strict';
 const select=document.getElementById('cloudGroupSelect');
 if(!select||document.getElementById('cloudRenameGroup')||document.documentElement.classList.contains('viewer-mode'))return;
 const button=document.createElement('button');button.type='button';button.id='cloudRenameGroup';button.className='secondary';button.textContent='✎ Byt gruppnamn';select.after(button);
 let busy=false;
 const allowed=()=>window.badmintonCloudRole?.()==='super_admin';
 function update(){button.hidden=!allowed();button.disabled=busy||!select.value;}
 new MutationObserver(update).observe(document.getElementById('cloudAdminPanel'),{attributes:true,attributeFilter:['style']});
 new MutationObserver(update).observe(select,{childList:true,subtree:true});select.addEventListener('change',update);update();
 button.addEventListener('click',()=>{
  if(!allowed()||!select.value||busy)return;
  const id=select.value,oldName=select.selectedOptions[0].text;
  const previous=document.activeElement;
  const overlay=document.createElement('div');overlay.className='bmConfirmOverlay';
  const dialog=document.createElement('form');dialog.className='bmConfirmDialog';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-label','Byt gruppnamn');
  const title=document.createElement('h3');title.textContent='Byt gruppnamn';
  const label=document.createElement('label');label.textContent='Nytt namn (högst 80 tecken)';label.htmlFor='cloudRenameInput';
  const input=document.createElement('input');input.id='cloudRenameInput';input.type='text';input.maxLength=80;input.required=true;input.value=oldName;input.style.cssText='width:100%;box-sizing:border-box;min-height:44px;margin:10px 0';
  const note=document.createElement('p');note.textContent='Spelare, behörigheter och spelhistorik behålls. Namnet ändras i den gemensamma databasen och även i ordinarie app.';
  const status=document.createElement('p');status.id='cloudRenameStatus';status.setAttribute('role','status');
  const save=document.createElement('button');save.type='submit';save.textContent='Spara namn';
  const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Avbryt';cancel.className='secondary';
  dialog.append(title,label,input,note,status,save,cancel);overlay.append(dialog);(document.fullscreenElement||document.body).append(overlay);
  function close(){if(busy)return;document.removeEventListener('keydown',onKey);overlay.remove();previous?.focus();}
  function onKey(e){if(e.key==='Escape'){e.preventDefault();close();}if(e.key==='Tab'){const elements=[input,save,cancel].filter(el=>!el.disabled);const first=elements[0],last=elements.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}
  document.addEventListener('keydown',onKey);cancel.onclick=close;overlay.onclick=e=>{if(e.target===overlay)close();};input.focus();input.select();
  dialog.addEventListener('submit',async e=>{
   e.preventDefault();if(busy)return;
   if(!allowed()){status.textContent='Logga in som Super Admin för att byta gruppnamn.';return;}
   const name=input.value.trim();if(!name||name.length>80){status.textContent='Ange ett gruppnamn med 1–80 tecken.';return;}
   if(name===oldName){close();return;}
   busy=true;input.disabled=true;save.disabled=true;cancel.disabled=true;update();status.textContent='Sparar …';
   try{
    const rows=await window.badmintonCloudRequest('/rest/v1/badminton_groups?id=eq.'+encodeURIComponent(id)+'&select=id,name',{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({name})});
    if(!Array.isArray(rows)||rows.length!==1||rows[0].id!==id||rows[0].name!==name)throw Error('Namnbytet kunde inte bekräftas. Kontrollera databasbehörigheten.');
    for(const menu of [select,document.getElementById('cloudOverviewGroup')])for(const option of menu?.options||[])if(option.value===id)option.text=name;
    document.getElementById('cloudGroups').textContent='Grupper i Supabase ('+(select.options.length-1)+'):\n'+[...select.options].filter(o=>o.value).map(o=>'• '+o.text).join('\n');
    select.dispatchEvent(new Event('badminton:group-renamed'));
    // Group overview is loaded separately; refresh it on the next visit.
    document.getElementById('cloudGroupOverview').textContent='Gruppnamnet är ändrat. Tryck Uppdatera gruppöversikt för att hämta aktuell information.';
    document.getElementById('cloudStatus').textContent='✅ Gruppen ”'+oldName+'” heter nu ”'+name+'”.';
    busy=false;close();
   }catch(error){status.textContent='❌ '+error.message;}
   finally{busy=false;input.disabled=false;save.disabled=false;cancel.disabled=false;update();}
  });
 });
})();
