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
  const original=window.badmintonPlayerImage;
  window.badmintonPlayerImage=function(name,team,side,position,serverGender){
    if(serverGender===undefined)return original(name,team,side,position);
    const gender=serverGender==='kvinna'?'kvinna':'man',color=team===1?'rod':'bla',view=side==='far'?'fram':'bak';
    if(gender==='kvinna'&&color==='rod'&&view==='fram'&&position==='right')return 'spelare_kvinna_rod_fram_blond.png';
    if(gender==='kvinna'&&color==='bla'&&view==='bak'&&position==='right')return 'spelare_kvinna_bla_bak_blond.png';
    return 'spelare_'+gender+'_'+color+'_'+view+(gender==='man'&&position==='right'?'_variant2':'')+'.png';
  };
})();
