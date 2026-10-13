(() => {
 'use strict';
 const key='badminton-player-motion',reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let requested=bmStorage.getItem(key)!=='false';
 function apply(){const enabled=requested&&!reduced.matches;document.documentElement.classList.toggle('bmMotionOff',!enabled);document.documentElement.classList.toggle('bmMotionPaused',document.hidden);const control=document.getElementById('bmMenuMotion');if(control){control.checked=enabled;control.disabled=reduced.matches;control.title=reduced.matches?'Minskad rörelse är aktiverad på enheten.':'';}const button=document.getElementById('viewerMotionToggle');if(button){button.textContent=enabled?'Rörelse: På':'Rörelse: Av';button.setAttribute('aria-pressed',String(enabled));button.disabled=reduced.matches;}}
 window.badmintonMotion={enabled:()=>requested&&!reduced.matches,set:enabled=>{requested=!!enabled;bmStorage.setItem(key,String(requested));apply();},refresh:apply};
 document.addEventListener('visibilitychange',apply);reduced.addEventListener('change',apply);window.addEventListener('storage',event=>{if(event.key===''+key){requested=event.newValue!=='false';apply();}});
 function init(){if(new URLSearchParams(location.hash.slice(1)).has('live')){const head=document.getElementById('viewerHead');const button=document.createElement('button');button.id='viewerMotionToggle';button.type='button';button.setAttribute('aria-label','Slå på eller av spelarrörelse');button.style.cssText='min-height:44px;padding:8px 12px';button.onclick=()=>window.badmintonMotion.set(!window.badmintonMotion.enabled());head?.append(button);}apply();}
 apply();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
