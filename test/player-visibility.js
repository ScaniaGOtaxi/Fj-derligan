(() => {
 'use strict';
 const key='badminton-show-player-figures';
 function refresh(){const enabled=bmStorage.getItem(key)!=='false';document.documentElement.classList.toggle('bmTextOnlyPlayers',!enabled);const control=document.getElementById('bmMenuFigures');if(control)control.checked=enabled;}
 window.badmintonPlayerVisibility={enabled:()=>bmStorage.getItem(key)!=='false',set:enabled=>{bmStorage.setItem(key,String(!!enabled));refresh();}};
 window.addEventListener('storage',event=>{if(event.key==='badminton-test-v2:'+key)refresh();});
 refresh();
})();
