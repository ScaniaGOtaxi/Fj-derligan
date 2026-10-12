/* Test app profile synchronization. Database IDs isolate groups and names. */
(() => {
  'use strict';
  let groupId=null, members=new Map();
  const localCountry=window.badmintonCountryOf,localGender=window.badmintonGenderOf;
  const setLocalCountry=window.badmintonSetCountry,setLocalGender=window.badmintonSetGender;
  const pending=new Map();
  window.badmintonSyncStatus=(kind,message)=>{
    let el=document.getElementById('bmSyncStatus');
    if(!el){el=document.createElement('div');el.id='bmSyncStatus';el.setAttribute('role','status');el.style.cssText='padding:12px;background:#152535;color:white;white-space:pre-line';(document.getElementById('playerManager')||document.body).append(el);}
    el.dataset[kind]=message;el.textContent=[el.dataset.profiles,el.dataset.scores].filter(Boolean).join('\n');
  };
  const repaint=()=>{if(typeof schedule!=='undefined'&&schedule.length)renderBigRound();};
  const normalize=p=>({country_code:p.country_code||'SE',second_country_code:p.second_country_code||null,player_gender:p.player_gender==='kvinna'?'kvinna':'man',player_mode:['normal','moreSingles','onlySingles'].includes(p.player_mode)?p.player_mode:'normal'});
  window.badmintonProfiles={
    load(group,rows){groupId=group;members=new Map(rows.map(p=>[p.name,{id:p.id,...normalize(p)}]));repaint();},
    reset(){groupId=null;members.clear();},
    update(name,patch){const p=members.get(name);if(!p){if(patch.country_code)setLocalCountry(name,patch.country_code);if(patch.player_gender)setLocalGender(name,patch.player_gender);if('second_country_code' in patch){const local=JSON.parse(bmStorage.getItem('badmintonSecondCountry')||'{}');local[name]=patch.second_country_code;bmStorage.setItem('badmintonSecondCountry',JSON.stringify(local));}repaint();return;}
      Object.assign(p,patch);const values=normalize(p);const key=groupId+':'+p.id;const version=(pending.get(key)||0)+1;pending.set(key,version);window.badmintonSyncStatus('profiles','⏳ Sparar spelarinställningar …');
      window.badmintonSaveProfile(groupId,p.id,values).then(()=>{if(pending.get(key)===version)window.badmintonSyncStatus('profiles','✅ Spelarinställningar sparade i Supabase.');}).catch(e=>{if(pending.get(key)===version)window.badmintonSyncStatus('profiles','❌ Inställningar finns endast lokalt: '+e.message);});repaint();
    }
  };
  window.badmintonCountryOf=name=>members.get(name)?.country_code||localCountry(name);
  window.badmintonGenderOf=name=>members.get(name)?.player_gender||localGender(name);
  window.badmintonSecondCountryOf=name=>members.has(name)?members.get(name).second_country_code:JSON.parse(bmStorage.getItem('badmintonSecondCountry')||'{}')[name]||null;
  window.badmintonSetCountry=(name,country)=>window.badmintonProfiles.update(name,{country_code:country});
  window.badmintonSetGender=(name,gender)=>window.badmintonProfiles.update(name,{player_gender:gender});
  window.badmintonSetSecondCountry=(name,country)=>window.badmintonProfiles.update(name,{second_country_code:country||null});
  window.badmintonFlagsHTML=name=>[window.badmintonCountryOf(name),window.badmintonSecondCountryOf(name)].filter(code=>/^[A-Z]{2}$/.test(code||'')).map(code=>'<img alt="Flagga '+code+'" data-country="'+code+'" onerror="window.badmintonFlagFallback(this)" src="'+window.badmintonFlagUrl(code)+'">').join('');
  window.badmintonCreateFlagPicker=(name,number)=>{
    const optional=number===2;
    const wrap=document.createElement('div');wrap.className='nationPicker';
    const heading=document.createElement('span');heading.textContent=optional?'Flagga 2 (valfri)':'Flagga 1';
    const search=document.createElement('input');search.type='search';search.className='nationSearch';search.placeholder='Sök land eller landskod…';search.autocomplete='off';search.setAttribute('aria-label','Sök flagga '+number+' för '+name);
    const select=document.createElement('select');select.className=optional?'playerSecondNationality':'playerNationality';select.setAttribute('aria-label','Flagga '+number+' för '+name);
    const hint=document.createElement('span');hint.setAttribute('role','status');hint.style.cssText='font-size:12px;color:#c6d7e7';
    const preview=document.createElement('div');preview.className='nationFlagPreview';
    const results=document.createElement('div');results.setAttribute('role','group');results.setAttribute('aria-label','Sökresultat flagga '+number+' för '+name);results.style.cssText='max-height:240px;overflow-y:auto;display:none;border:1px solid #607489;border-radius:9px;background:#102131';
    const countries=window.BADMINTON_COUNTRIES||[];
    const get=()=>optional?window.badmintonSecondCountryOf(name):window.badmintonCountryOf(name);
    const normalize=value=>String(value||'').trim().toLocaleLowerCase('sv').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    function filtered(){const q=normalize(search.value);const exact=countries.filter(c=>normalize(c[0])===q||normalize(c[3])===q);return q&&exact.length?exact:countries.filter(c=>!q||c.some(value=>normalize(value).includes(q)));}
    function showPreview(){preview.replaceChildren();const code=get();if(!code){preview.textContent='Ingen andra flagga';return;}const entry=countries.find(c=>c[0]===code);const img=document.createElement('img');img.alt='Flagga '+number+' för '+(entry?.[1]||code);img.dataset.country=code;img.src=window.badmintonFlagUrl(code);img.onerror=()=>window.badmintonFlagFallback(img);const caption=document.createElement('span');caption.textContent=entry?.[1]||code;preview.append(img,caption);}
    function render(){const matches=filtered(),saved=get(),query=search.value.trim();select.replaceChildren();
      const prompt=new Option(matches.length?'Välj ett land…':'Inga länder hittades','__choose__');prompt.disabled=true;select.add(prompt);
      if(optional)select.add(new Option('Ingen andra flagga',''));
      matches.forEach(c=>select.add(new Option(c[1]+' ('+c[3]+')',c[0])));
      select.value=matches.some(c=>c[0]===saved)?saved:optional&&!saved&&!query?'':'__choose__';
      hint.textContent=query?(matches.length?matches.length+' träff'+(matches.length===1?'':'ar')+' – tryck på landet för att spara.':'Inga träffar. Prova landets namn eller landskod.'):'Välj ett land i listan för att spara.';
      results.replaceChildren();results.style.display=query&&matches.length?'block':'none';select.style.display=query?'none':'';
      if(query)matches.forEach(country=>{const button=document.createElement('button');button.type='button';button.style.cssText='display:flex;align-items:center;gap:10px;width:100%;min-height:44px;text-align:left;padding:9px 12px;border:0;border-bottom:1px solid #405365;border-radius:0;background:#102131;color:white;cursor:pointer';
        const flag=document.createElement('img');flag.width=28;flag.height=19;flag.alt='';flag.dataset.country=country[0];flag.src=window.badmintonFlagUrl(country[0]);flag.onerror=()=>window.badmintonFlagFallback(flag);
        const text=document.createElement('span');text.textContent=country[1]+' ('+country[3]+')';button.append(flag,text);button.addEventListener('click',()=>commit(country[0]));results.append(button);
      });
    }
    function commit(value){if(value==='__choose__')return;if(optional)window.badmintonSetSecondCountry(name,value);else if(value)window.badmintonSetCountry(name,value);search.value='';render();showPreview();}
    search.addEventListener('input',render);
    search.addEventListener('keydown',event=>{if(event.key==='Escape'){search.value='';render();return;}if(event.key==='ArrowDown'&&search.value.trim()){event.preventDefault();results.querySelector('button')?.focus();return;}if(event.key==='Enter'){event.preventDefault();const matches=filtered();if(search.value.trim()&&matches.length===1)commit(matches[0][0]);else (results.querySelector('button')||select).focus();}});
    select.addEventListener('change',()=>commit(select.value));
    render();showPreview();wrap.append(heading,search,hint,results,select,preview);return wrap;
  };
  const original=window.badmintonPlayerImage;
  window.badmintonPlayerImage=function(name,team,side,position,serverGender){
    if(serverGender===undefined)return original(name,team,side,position);
    const gender=serverGender==='kvinna'?'kvinna':'man',color=team===1?'rod':'bla',view=side==='far'?'fram':'bak';
    if(gender==='kvinna'&&color==='rod'&&view==='fram'&&position==='right')return 'spelare_kvinna_rod_fram_blond.png';
    if(gender==='kvinna'&&color==='bla'&&view==='bak'&&position==='right')return 'spelare_kvinna_bla_bak_blond.png';
    return 'spelare_'+gender+'_'+color+'_'+view+(gender==='man'&&position==='right'?'_variant2':'')+'.png';
  };
})();
