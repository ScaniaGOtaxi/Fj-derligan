(() => {
 'use strict';
 const key='badminton-show-player-figures';
 const canvas=document.createElement('canvas'),context=canvas.getContext('2d');let scheduled=false;
 function fit(){scheduled=false;if(!document.documentElement.classList.contains('bmTextOnlyPlayers'))return;
  document.querySelectorAll('#bigCourts .threeDLabel:not(.isEmpty),#viewerCourts .viewerName').forEach(label=>{
   const name=label.querySelector('span:not(.flagTextFallback)');if(!name)return;const stage=label.closest('.threeDStage,.viewerStage');if(!stage)return;
   const style=getComputedStyle(label);const width=label.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight);
   const flags=[...label.querySelectorAll('img,.flagTextFallback')].filter(e=>getComputedStyle(e).display!=='none').length;
   context.font='800 100px system-ui';const nameUnits=context.measureText(name.textContent).width/100;
   const maxHeight=Math.max(44,Math.min(120,stage.clientHeight*.12));
   const size=Math.max(12,Math.min(96,(width-flags*4)/(nameUnits+flags*1.35), (maxHeight-12)/1.15));
   label.style.setProperty('font-size',Math.floor(size)+'px','important');label.style.setProperty('flex-wrap','nowrap','important');
  });
 }
 function scheduleFit(){if(scheduled)return;scheduled=true;requestAnimationFrame(fit);}
 function watch(){for(const id of ['bigCourts','viewerCourts']){const root=document.getElementById(id);if(!root)continue;new ResizeObserver(scheduleFit).observe(root);new MutationObserver(scheduleFit).observe(root,{childList:true,subtree:true});}scheduleFit();}
 window.addEventListener('resize',scheduleFit);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch);else watch();

 function refresh(){const enabled=bmStorage.getItem(key)!=='false';document.documentElement.classList.toggle('bmTextOnlyPlayers',!enabled);const control=document.getElementById('bmMenuFigures');if(control)control.checked=enabled;scheduleFit();}
 window.badmintonPlayerVisibility={refit:scheduleFit,enabled:()=>bmStorage.getItem(key)!=='false',set:enabled=>{bmStorage.setItem(key,String(!!enabled));refresh();}};
 window.addEventListener('storage',event=>{if(event.key==='badminton-test-v2:'+key)refresh();});
 refresh();
})();
