(() => {
 'use strict';
 const key='badminton-show-player-figures';
 function names(stage,selector){return [...stage.querySelectorAll(selector)].map(label=>label.querySelector('span:not(.flagTextFallback)')?.textContent?.trim()).filter(Boolean).join(' & ');}
 function attach(root){root.querySelectorAll('.threeDStage,.viewerStage').forEach(stage=>{
  if(stage.querySelector('.bmTextTeam'))return;
  const game=stage.classList.contains('threeDStage');
  for(const [team,selector] of [[1,game?'.threeDLabel.pos0,.threeDLabel.pos1':'.viewerName.top'],[2,game?'.threeDLabel.pos2,.threeDLabel.pos3':'.viewerName.bottom']]){
   const text=names(stage,selector);if(!text)continue;const label=document.createElement('div');label.className='bmTextTeam '+(team===1?'bmTextRed':'bmTextBlue');label.textContent=text;stage.append(label);
  }
 });}
 function refresh(){const enabled=bmStorage.getItem(key)!=='false';document.documentElement.classList.toggle('bmTextOnlyPlayers',!enabled);const control=document.getElementById('bmMenuFigures');if(control)control.checked=enabled;}
 window.badmintonPlayerVisibility={enabled:()=>bmStorage.getItem(key)!=='false',set:enabled=>{bmStorage.setItem(key,String(!!enabled));refresh();}};
 window.addEventListener('storage',event=>{if(event.key==='badminton-test-v2:'+key)refresh();});
 function init(){['bigCourts','viewerCourts'].forEach(id=>{const root=document.getElementById(id);if(!root)return;let queued=false;new MutationObserver(records=>{if(!records.some(record=>[...record.addedNodes].some(node=>node.nodeType===1&&(node.matches?.('.threeDStage,.viewerStage')||node.querySelector?.('.threeDStage,.viewerStage')))))return;if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;attach(root);});}).observe(root,{childList:true,subtree:true});attach(root);});}
 refresh();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
