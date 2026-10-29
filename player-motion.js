(() => {
 'use strict';
 const key='badminton-player-motion',reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let requested=bmStorage.getItem(key)!=='false';
 function apply(){const enabled=requested&&!reduced.matches;document.documentElement.classList.toggle('bmMotionOff',!enabled);document.documentElement.classList.toggle('bmMotionPaused',document.hidden);const control=document.getElementById('bmMenuMotion');if(control){control.checked=enabled;control.disabled=reduced.matches;control.title=reduced.matches?'Minskad rörelse är aktiverad på enheten.':'';}}
 window.badmintonMotion={enabled:()=>requested&&!reduced.matches,set:enabled=>{requested=!!enabled;bmStorage.setItem(key,String(requested));apply();},refresh:apply};
 document.addEventListener('visibilitychange',apply);reduced.addEventListener('change',apply);window.addEventListener('storage',event=>{if(event.key==='badminton-netlify:'+key){requested=event.newValue!=='false';apply();}});
 function init(){apply();}
 apply();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
