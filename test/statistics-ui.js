(() => {
 'use strict';
 const el=(tag,text,cls)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node;};
 let state=null,active='results',sortKey='wins',descending=true;
 const tabs=[['results','Resultat'],['participation','Deltagande'],['history','Matchhistorik'],['daily','Dagens rapport']];
 const headers={results:['Spelare','Resultatmatcher','Vinster','Förluster','Oavgjorda','Gjorda poäng','Insläppta poäng','Poängskillnad','Vinst %'],participation:['Spelare','Spelat','Singel','Dubbel','Vila'],history:['Datum','Spel','Runda','Bana','Rött lag','Blått lag','Poäng','Resultat']};
 const resultValues=p=>[p.name,p.played,p.wins,p.losses,p.draws,p.for,p.against,p.difference,p.winPercent+' %'];
 const historyValues=m=>{const session=state.sessions.find(s=>s.id===m.session_id);return [session?.created_at?new Date(session.created_at).toLocaleDateString('sv-SE'):'–',m.session_name||session?.name||'Spel',m.round_number,m.court_number,m.players.filter(p=>p.team===1).map(p=>p.name).join(' & '),m.players.filter(p=>p.team===2).map(p=>p.name).join(' & '),m.red+' – '+m.blue,m.red===m.blue?'Oavgjort':m.red>m.blue?'Rött vann':'Blått vann'];};
 function rows(){if(active==='results')return (state.result?.players||[]).slice().sort((a,b)=>{const diff=sortKey==='name'?a.name.localeCompare(b.name,'sv'):a[sortKey]-b[sortKey];return (descending?-diff:diff)||a.name.localeCompare(b.name,'sv');}).map(p=>({id:p.id,values:resultValues(p)}));if(active==='participation')return state.participation.map(p=>({id:p.id,values:[p.name,p.single+p.double,p.single,p.double,p.rest]}));return (state.result?.matches||[]).map(m=>({values:historyValues(m)}));}
 function details(id){const player=state.result?.players.find(p=>p.id===id)||state.members.find(p=>p.id===id);if(!player)return;const overlay=el('div',undefined,'bmConfirmOverlay'),dialog=el('div',undefined,'bmConfirmDialog');dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-label','Statistik för '+player.name);dialog.append(el('h3',player.name));const stat=state.result?.players.find(p=>p.id===id);if(stat)dialog.append(el('p',stat.wins+' vinster · '+stat.losses+' förluster · '+stat.draws+' oavgjorda · '+stat.for+'–'+stat.against+' poäng'));const matches=(state.result?.matches||[]).filter(m=>m.players.some(p=>p.id===id));if(!matches.length)dialog.append(el('p','Inga registrerade resultat under vald period.'));matches.forEach(m=>dialog.append(el('p',historyValues(m).join(' · '))));const close=el('button','Stäng');close.type='button';const previous=document.activeElement;const finish=()=>{document.removeEventListener('keydown',key);overlay.remove();previous?.focus();};const key=e=>{if(e.key==='Escape')finish();if(e.key==='Tab'){e.preventDefault();close.focus();}};close.onclick=finish;overlay.onclick=e=>{if(e.target===overlay)finish();};document.addEventListener('keydown',key);dialog.append(close);overlay.append(dialog);document.body.append(overlay);close.focus();}
 async function dailyReport(root){
 const now=new Date(),date=now.toLocaleDateString('sv-SE');
 const sessions=window.badmintonStatsUI.filterSessions(state.sessions,'today',now);
 const matches=(state.result?.matches||[]).filter(m=>sessions.some(s=>s.id===m.session_id));
 const section=el('section');section.id='bmDailyReport';
 section.append(el('h3','Dagens spel · '+date),el('p',state.groupName),el('p','Omfattar spel som startats idag enligt enhetens datum. Endast färdigmarkerade rundor ingår.'));
 const participants=state.dailyParticipation||[];
 section.append(el('h4','Deltagare'),el('p',participants.length?participants.map(p=>p.name+' ('+p.single+' singel, '+p.double+' dubbel)').join(' · '):'Inga spelade matcher idag.'));
 if(state.error){section.append(el('p','Resultaten kunde inte hämtas. Ingen pallplacering kan fastställas.'));root.append(section);return;}
 section.append(el('p','Medaljer beräknas per spelare: flest vinster, därefter poängskillnad och gjorda poäng. Lika resultat ger delad placering (nästa placering hoppas över). Samtliga dagens singel- och dubbelmatcher summeras till en gemensam placering. I dubbel får båda partners samma matchresultat. Olika antal matcher kan påverka placeringen. Medaljerna visas i rapporten och sparas inte som separata utmärkelser.'));
 const summary=el('p',sessions.length+' spel · '+matches.length+' matcher med resultat. Matcher utan poäng eller med 0–0 ger ingen placering.');section.append(summary);
 const ranking=window.badmintonResults.podium(matches);
 const singles=window.badmintonResults.podium(matches,1),doubles=window.badmintonResults.podium(matches,2);
 section.append(el('h4','Sammanlagd pall · singel och dubbel'));
 ranking.filter(p=>p.rank<=3).forEach(p=>section.append(el('p',p.medal+' · '+p.rank+'. '+p.name+' · '+p.wins+' vinster · poängskillnad '+p.difference)));
 section.append(el('h4','Alla placeringar'));
 ranking.forEach(p=>{const single=singles.find(x=>x.id===p.id),double=doubles.find(x=>x.id===p.id);section.append(el('p',p.rank+'. '+p.name+' · '+p.played+' matcher · '+p.wins+' vinster, '+p.losses+' förluster, '+p.draws+' oavgjorda · '+p.for+'–'+p.against+' poäng · Singel: '+(single?.played||0)+' matcher / '+(single?.wins||0)+' vinster · Dubbel: '+(double?.played||0)+' matcher / '+(double?.wins||0)+' vinster'));});
 const unscored=participants.filter(p=>!ranking.some(r=>r.id===p.id));
 unscored.forEach(p=>section.append(el('p',p.name+' · Ej placerad: saknar registrerat matchresultat.')));
 section.append(el('h4','Matchresultat och vinnare'));
 matches.forEach(m=>{const team=n=>m.players.filter(p=>p.team===n).map(p=>p.name).join(' & ');const session=sessions.find(s=>s.id===m.session_id);section.append(el('p',(m.players.length===2?'Singel':'Dubbel')+' · '+(session?.name||'Spel')+' · runda '+m.round_number+', bana '+m.court_number+': '+team(1)+' – '+team(2)+' · '+m.red+'–'+m.blue+' · '+(m.red===m.blue?'Oavgjort':'Vinnare: '+team(m.red>m.blue?1:2))));});
 if(!matches.length)section.append(el('p','Inga färdigmarkerade matcher med registrerade resultat idag.'));
 const reportState=state,loading=el('p','Skapar diplom …');loading.setAttribute('role','status');root.append(loading);
 const diplomaPages=await window.badmintonDailyDiploma.create({groupName:state.groupName,date,ranking,participants,matches,sessions,rounds:state.completed});
 if(state!==reportState||active!=='daily'||!root.contains(loading))return;loading.remove();
 const details=el('details');details.append(el('summary','Deltagare, detaljer och matchresultat'));
 details.append(...section.childNodes);section.append(details);
 diplomaPages.forEach((canvas,index)=>{canvas.style.cssText='display:block;width:100%;height:auto;margin:12px 0;border-radius:10px';canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Dagens diplom för '+state.groupName+'. Fullständiga resultat finns under detaljer.');canvas.dataset.diplomaPage=String(index+1);section.insertBefore(canvas,details);});
 root.append(section);
 let pdfFile=null;
 const download=el('button','Ladda ner PDF'),share=el('button','Dela PDF · WhatsApp');download.type=share.type='button';
 const status=el('p');status.setAttribute('role','status');
 // Prepare the file before the click to preserve native sharing's user activation.
 window.badmintonDailyPDF.create(section).then(file=>{pdfFile=file;download.disabled=share.disabled=false;}).catch(()=>{status.textContent='PDF kunde inte skapas. Använd Skriv ut / PDF.';});
 download.disabled=share.disabled=true;
 download.onclick=()=>window.badmintonDailyPDF.download(pdfFile);
 share.onclick=async()=>{try{if(navigator.canShare?.({files:[pdfFile]})){await navigator.share({files:[pdfFile],title:'Dagens badmintonrapport'});status.textContent='';}else{window.badmintonDailyPDF.download(pdfFile);status.textContent='PDF har laddats ner. Öppna WhatsApp och bifoga filen som dokument.';}}catch(e){if(e.name!=='AbortError')status.textContent='Kunde inte dela filen. Ladda ner PDF och bifoga den i WhatsApp.';}};
 root.append(download,share,status);
 const print=el('button','Skriv ut dagsrapport / PDF');print.type='button';print.onclick=()=>{const page=window.open('','_blank');if(!page){window.bmCenteredAlert('Tillåt popupfönster för att öppna rapporten.');return;}page.document.title='Dagens badmintonrapport';const copy=page.document.importNode(section,true);copy.querySelectorAll('canvas').forEach((node,i)=>{const image=page.document.createElement('img');image.src=section.querySelectorAll('canvas')[i].toDataURL('image/png');image.style.cssText='display:block;width:100%;break-after:page';node.replaceWith(image);});copy.querySelectorAll('details').forEach(d=>d.open=true);page.document.body.append(copy);const style=page.document.createElement('style');style.textContent='body{font:14px system-ui;padding:24px;line-height:1.5}h4{margin-top:24px}p{break-inside:avoid}';page.document.head.append(style);page.document.close();page.print();};root.append(print);
 }
 function render(){const root=document.getElementById('cloudStats');root.replaceChildren();root.append(el('h3',state.groupName+' · '+state.periodLabel),el('p','Sparat på servern · Hämtat '+new Date(state.fetchedAt||Date.now()).toLocaleTimeString('sv-SE')+'. Perioden avser spelens startdatum.')); 
 const cards=el('div',undefined,'bmStatsCards');const participants=state.participation.filter(p=>p.single+p.double+p.rest>0).length;[['Spelade matcher',state.playedMatches],['Deltagande spelare',participants],['Färdiga rundor',state.completed],['Matcher med resultat',state.result?state.result.matches.length:'–']].forEach(([title,value])=>{const card=el('div',undefined,'bmStatsCard');card.append(el('span',title),el('strong',String(value)));cards.append(card);});root.append(cards);
 const nav=el('div',undefined,'bmStatsTabs');nav.setAttribute('role','tablist');tabs.forEach(([key,label])=>{const button=el('button',label);button.type='button';button.setAttribute('role','tab');button.setAttribute('aria-selected',String(active===key));button.onclick=()=>{active=key;if(key==='daily'){const period=document.getElementById('bmStatsPeriod');if(period&&period.value!=='today'){period.value='today';period.dispatchEvent(new Event('change'));return;}}render();};nav.append(button);});root.append(nav);
 if(active==='daily'){const reportState=state;dailyReport(root).catch(e=>{if(state===reportState&&active==='daily')root.append(el('p',e.message));});return;}
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



