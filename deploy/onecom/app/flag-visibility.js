(() => {
 'use strict';
 const key='badminton-show-flags';
 const storageKey=(document.currentScript.dataset.storagePrefix||'')+key;
 function refresh(){document.documentElement.classList.toggle('bmHideFlags',bmStorage.getItem(key)==='false');}
 window.badmintonFlagVisibility={enabled:()=>bmStorage.getItem(key)!=='false',set:value=>{bmStorage.setItem(key,String(!!value));refresh();window.badmintonPlayerVisibility?.refit?.();}};
 window.addEventListener('storage',event=>{if(event.key===storageKey)refresh();});
 refresh();
})();
