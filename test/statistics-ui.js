(() => {
 'use strict';
 const el=(tag,text,cls)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node;};
 let state=null,active='results',sortKey='wins',descending=true;
 const tabs=[['results','Resultat'],['participation','Deltagande'],['history','Matchhistorik']];
 const headers={results:['Spelare','Resultatmatcher','Vinster','Förluster','Oavgjorda','Gjorda poäng','Insläppta poäng','Poängskillnad','Vinst %'],participation:['Spelare','Spelat','Singel','Dubbel','Vila'],history:['Datum','Spel','Runda','Bana','Rött lag','Blått lag','Poäng','Resultat']};
 const resultValues=p=>[p.name,p.played,p.wins,p.losses,p.draws,p.for,p.against,p.difference,p.winPercent+' %'];
 const historyValues=m=>{const session=state.sessions.find(s=>s.id===m.session_id);return [session?.created_at?new Date(session.created_at).toLocaleDateString('sv-SE'):'–',m.session_name||session?.name||'Spel',m.round_number,m.court_number,m.players.filter(p=>p.team===1).map(p=>p.name).join(' & '),m.players.filter(p=>p.team===2).map(p=>p.name).join(' & '),m.red+' – '+m.blue,m.red===m.blue?'Oavgjort':m.red>m.blue?'Rött vann':'Blått vann'];};
 function rows(){if(active==='results')return (state.result?.players||[]).slice().sort((a,b)=>{const diff=sortKey==='name'?a.name.localeCompare(b.name,'sv'):a[sortKey]-b[sortKey];return (descending?-diff:diff)||a.name.localeCompare(b.name,'sv');}).map(p=>({id:p.id,values:resultValues(p)}));if(active==='participation')return state.participation.map(p=>({id:p.id,values:[p.name,p.single+p.double,p.single,p.double,p.rest]}));return (state.result?.matches||[]).map(m=>({values:historyValues(m)}));}
 function details(id){const player=state.result?.players.find(p=>p.id===id)||state.members.find(p=>p.id===id);if(!player)return;const overlay=el('div',undefined,'bmConfirmOverlay'),dialog=el('div',undefined,'bmConfirmDialog');dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-label','Statistik för '+player.name);dialog.append(el('h3',player.name));const stat=state.result?.players.find(p=>p.id===id);if(stat)dialog.append(el('p',stat.wins+' vinster · '+stat.losses+' förluster · '+stat.draws+' oavgjorda · '+stat.for+'–'+stat.against+' poäng'));const matches=(state.result?.matches||[]).filter(m=>m.players.some(p=>p.id===id));if(!matches.length)dialog.append(el('p','Inga registrerade resultat under vald period.'));matches.forEach(m=>dialog.append(el('p',historyValues(m).join(' · '))));const close=el('button','Stäng');close.type='button';const previous=document.activeElement;const finish=()=>{document.removeEventListener('keydown',key);overlay.remove();previous?.focus();};const key=e=>{if(e.key==='Escape')finish();if(e.key==='Tab'){e.preventDefault();close.focus();}};close.onclick=finish;overlay.onclick=e=>{if(e.target===overlay)finish();};document.addEventListener('keydown',key);dialog.append(close);overlay.append(dialog);document.body.append(overlay);close.focus();}
 function render(){const root=document.getElementById('cloudStats');root.replaceChildren();root.append(el('h3',state.groupName+' · '+state.periodLabel),el('p','Sparat på servern · Hämtat '+new Date(state.fetchedAt||Date.now()).toLocaleTimeString('sv-SE')+'. Perioden avser spelens startdatum.')); 
 const cards=el('div',undefined,'bmStatsCards');const participants=state.participation.filter(p=>p.single+p.double+p.rest>0).length;[['Spelade matcher',state.playedMatches],['Deltagande spelare',participants],['Färdiga rundor',state.completed],['Matcher med resultat',state.result?state.result.matches.length:'–']].forEach(([title,value])=>{const card=el('div',undefined,'bmStatsCard');card.append(el('span',title),el('strong',String(value)));cards.append(card);});root.append(cards);
 const nav=el('div',undefined,'bmStatsTabs');nav.setAttribute('role','tablist');tabs.forEach(([key,label])=>{const button=el('button',label);button.type='button';button.setAttribute('role','tab');button.setAttribute('aria-selected',String(active===key));button.onclick=()=>{active=key;render();};nav.append(button);});root.append(nav);
 if(state.error&&active!=='participation')root.append(el('p','Resultatstatistiken kunde inte hämtas: '+state.error+'. Deltagarstatistiken är fortfarande tillgänglig.'));
 if(active==='results'&&state.result)root.append(el('p',state.result.unscored+' matcher utan registrerade poäng/resultat. 0–0 räknas inte. Dubbelpartners får samma lagresultat och lagpoäng.'));
 const data=rows();const panel=el('div');panel.setAttribute('role','tabpanel');panel.setAttribute('aria-label',tabs.find(t=>t[0]===active)[1]);
 const table=el('table',undefined,'statsTable bmStatsDesktop');table.setAttribute('aria-label',active==='results'?'Resultatstatistik':active==='participation'?'Deltagarstatistik':'Matchhistorik');const head=el('thead'),hr=el('tr');headers[active].forEach((title,index)=>{const cell=el('th');if(active==='results'){const keys=['name','played','wins','losses','draws','for','against','difference','winPercent'];const button=el('button',title+(sortKey===keys[index]?(descending?' ↓':' ↑'):''));button.type='button';button.onclick=()=>{descending=sortKey===keys[index]?!descending:keys[index]!=='name';sortKey=keys[index];render();};cell.append(button);}else cell.textContent=title;hr.append(cell);});head.append(hr);table.append(head);const body=el('tbody');const mobile=el('div',undefined,'bmStatsMobile');
 data.forEach(row=>{const tr=el('tr');row.values.forEach((value,i)=>{const cell=el('td');if(i===0&&row.id){const button=el('button',String(value));button.type='button';button.onclick=()=>details(row.id);cell.append(button);}else cell.textContent=String(value);tr.append(cell);});body.append(tr);const card=el('article',undefined,'bmStatsCard');const title=el(row.id?'button':'strong',String(row.values[0]));if(row.id){title.type='button';title.onclick=()=>details(row.id);}card.append(title);row.values.slice(1).forEach((value,i)=>card.append(el('div',headers[active][i+1]+': '+value)));mobile.append(card);});table.append(body);panel.style.overflowX='auto';panel.append(table,mobile);if(!data.length)panel.append(el('p','Inga uppgifter under vald period.'));root.append(panel);
 const actions=el('div',undefined,'topTools');const csv=el('button',active==='results'?'Exportera resultat CSV':'Exportera CSV');csv.type='button';csv.disabled=!!state.error&&active!=='participation';csv.onclick=()=>{const escape=value=>'"'+String(typeof value==='string'&&/^[=+@-]/.test(value)?"'"+value:value).replace(/"/g,'""')+'"';const text='\uFEFF'+[headers[active],...data.map(r=>r.values)].map(row=>row.map(escape).join(';')).join('\r\n');const url=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'}));const link=el('a');link.href=url;link.download='badminton-'+active+'.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};const pdf=el('button','Skriv ut / PDF');pdf.type='button';pdf.disabled=csv.disabled;pdf.onclick=()=>{const page=window.open('','_blank');if(!page){window.bmCenteredAlert('Tillåt popupfönster för att öppna rapporten.');return;}const heading=page.document.createElement('h1');heading.textContent=state.groupName+' · '+state.periodLabel+' · '+tabs.find(t=>t[0]===active)[1];page.document.body.append(heading);const printable=table.cloneNode(true);printable.className='';printable.querySelectorAll('button').forEach(b=>b.replaceWith(page.document.createTextNode(b.textContent)));page.document.body.append(printable);const style=page.document.createElement('style');style.textContent='body{font:14px system-ui}table{border-collapse:collapse;width:100%}th,td{padding:8px;border:1px solid #aaa}@page{size:landscape}';page.document.head.append(style);page.document.close();page.print();};actions.append(csv,pdf);root.append(actions);
 }
 window.badmintonStatsUI={render:data=>{state=data;render();},filterSessions:(sessions,period,now=new Date())=>{if(period==='all')return sessions;const start=new Date(now);start.setHours(0,0,0,0);if(period==='week')start.setDate(start.getDate()-6);if(period==='month')start.setDate(1);return sessions.filter(s=>s.created_at&&new Date(s.created_at)>=start&&new Date(s.created_at)<=now);}};
 function init(){
 const section=document.getElementById('v14-stats');if(!section)return;
 const original=document.getElementById('cloudGroupSelect'),controls=el('div',undefined,'bmStatsControls');
 const group=el('select');group.id='bmStatsGroup';group.setAttribute('aria-label','Statistikgrupp');
 const period=el('select');period.id='bmStatsPeriod';period.setAttribute('aria-label','Statistikperiod');
 [['all','Allt'],['today','Idag'],['week','Senaste 7 dagarna'],['month','Denna månad']].forEach(([value,label])=>period.add(new Option(label,value)));
 const refresh=document.getElementById('cloudGroupStats');refresh.textContent='Uppdatera serverstatistik';
 const load=el('button','Hämta grupper');load.type='button';load.id='bmStatsLoadGroups';
 const status=el('p');status.id='bmServerStatsStatus';status.setAttribute('role','status');status.style.cssText='line-height:1.5;overflow-wrap:anywhere';
 const cloud=document.getElementById('cloudStats');
 const intro=el('p','Statistik hämtas från servern och kan visas på andra enheter efter inloggning. Admin ser tilldelade grupper; Super Admin ser alla grupper.');
 let generation=0,busy=false;
 const allowed=()=>['admin','super_admin'].includes(window.badmintonCloudRole?.());
 const prompt=message=>{cloud.replaceChildren(el('p',message));};
 function sync(){const selected=group.value||original.value;group.replaceChildren(...[...original.options].map(o=>new Option(o.text,o.value)));if([...group.options].some(o=>o.value===selected))group.value=selected;}
 sync();new MutationObserver(()=>{if(!group.value)sync();}).observe(original,{childList:true});
 original.addEventListener('change',()=>{if([...group.options].some(o=>o.value===original.value))group.value=original.value;});
 async function loadGroups(auto=true){
  const version=++generation;
  if(!allowed()){group.replaceChildren(new Option('Logga in för att välja grupp',''));status.textContent='Logga in som Admin eller Super Admin för att läsa serverstatistik.';prompt('Serverstatistik kräver inloggning.');return;}
  busy=true;load.disabled=true;refresh.disabled=true;status.textContent='Hämtar grupper från servern …';
  try{
   const rows=await window.badmintonCloudRequest('/rest/v1/badminton_groups?select=id,name&order=name.asc');
   if(version!==generation)return;
   if(!Array.isArray(rows)||rows.some(g=>!g.id||typeof g.name!=='string'))throw Error('Oväntat svar från gruppregistret');
   const selected=group.value||original.value;
   group.replaceChildren(new Option('Välj grupp',''));rows.forEach(g=>group.add(new Option(g.name,g.id)));
   group.value=rows.some(g=>g.id===selected)?selected:(rows[0]?.id||'');
   status.textContent=rows.length?'Serverdata · '+rows.length+' tillgängliga grupper.':'Inga grupper är tillgängliga för kontot. Be Super Admin kontrollera grupptilldelningen.';
   refresh.disabled=!group.value;
   if(!rows.length)prompt('Ingen grupp att hämta statistik för.');
   else if(auto)refresh.click();
  }catch(e){if(version===generation){status.textContent='Kunde inte hämta servergrupper: '+e.message;refresh.disabled=true;}}
  finally{if(version===generation){busy=false;load.disabled=false;}}
 }
 let queued=false;
 function refreshSelection(){prompt('Hämtar sparad statistik från servern …');if(allowed()&&group.value){if(refresh.disabled)queued=true;else refresh.click();}}
 new MutationObserver(()=>{if(queued&&!refresh.disabled&&allowed()&&group.value){queued=false;refresh.click();}}).observe(refresh,{attributes:true,attributeFilter:['disabled']});
 group.addEventListener('change',refreshSelection);period.addEventListener('change',refreshSelection);
 load.onclick=()=>loadGroups(true);
 controls.append(el('span','Grupp'),group,el('span','Period'),period,load,refresh);
 cloud.before(intro,controls,status);
 const heading=[...section.querySelectorAll('h3')].find(h=>h.textContent.includes('Gruppstatistik'));if(heading)heading.textContent='☁️ Statistik sparad på servern';
 const local=document.getElementById('statsPanel');const details=el('details',undefined,'bmLocalStats');details.append(el('summary','Statistik endast på denna enhet'),local);section.append(details);
 new MutationObserver(()=>{if(section.classList.contains('active')&&!busy)loadGroups(true);}).observe(section,{attributes:true,attributeFilter:['class']});
 window.addEventListener('badminton:auth-changed',()=>{
  generation++;busy=false;queued=false;state=null;
  group.replaceChildren(new Option('Välj grupp',''));
  prompt(allowed()?'Hämta statistik för ditt konto.':'Serverstatistik kräver inloggning.');
  if(!allowed()){status.textContent='Logga in som Admin eller Super Admin.';refresh.disabled=true;load.disabled=false;}
  else if(section.classList.contains('active'))loadGroups(true);
 });
 if(section.classList.contains('active'))loadGroups(true);else if(!allowed())status.textContent='Logga in för att läsa serverstatistik.';
 }

 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0));else init();
})();
