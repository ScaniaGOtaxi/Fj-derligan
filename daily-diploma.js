(() => {
 'use strict';
 const W=1240,H=1754,SOURCE_W=1056,SOURCE_H=1492;
 const templateURL=new URL('diploma-template.png',document.currentScript?.src||document.baseURI).href;
 let templatePromise;
 function loadTemplate(){
  if(!templatePromise)templatePromise=new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>{templatePromise=null;reject(Error('Diplomets bildmall kunde inte laddas. Kontrollera anslutningen och försök igen.'));};image.src=templateURL;});
  return templatePromise;
 }
 function text(x,value,cx,y,size=28,color='#fff0b9',align='center',bold=true){x.font=(bold?'bold ':'')+size+'px Georgia, serif';x.fillStyle=color;x.textAlign=align;x.shadowColor='#000';x.shadowBlur=3;x.shadowOffsetY=1;x.fillText(String(value),cx,y);x.shadowBlur=0;x.shadowOffsetY=0;}
 function fitted(x,value,cx,y,width,size=28,color='#fff0b9',align='center',bold=true){
  value=String(value);while(size>12){x.font=(bold?'bold ':'')+size+'px Georgia, serif';if(x.measureText(value).width<=width)break;size--;}
  x.save();x.beginPath();x.rect(align==='left'?cx:align==='right'?cx-width:cx-width/2,y-size-3,width,size+10);x.clip();text(x,value,cx,y,size,color,align,bold);x.restore();
 }
 function winner(x,people,cx,y,width){
  if(!people.length){fitted(x,'Ingen placering',cx,y,width,23);return;}
  if(people.length<=3){const size=people.length===1?38:people.length===2?22:14,step=people.length===1?0:people.length===2?22:14;const top=y-(people.length-1)*step;people.forEach((p,i)=>fitted(x,p.name,cx,top+i*step,width,size));}
  else fitted(x,people.length+' spelare · delad plats',cx,y,width,24);
  fitted(x,people[0].wins+' vinster'+(people.length>1?' · delad plats':''),cx,y+30,width,27);
 }
 async function create({groupName,date,ranking,participants,matches,rounds}){
  const template=await loadTemplate(),pages=[];
  const dateValue=/^\d{4}-\d{2}-\d{2}$/.test(date)?new Date(date+'T12:00:00'):null;
  const dateLabel=dateValue?dateValue.toLocaleDateString('sv-SE',{day:'numeric',month:'long',year:'numeric'}):date;
  const group=String(groupName).replace(/^=+\s*|\s*=+$/g,'').trim().toLocaleUpperCase('sv-SE');
  for(let offset=0;offset<Math.max(1,ranking.length);offset+=8){
   const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;const x=canvas.getContext('2d');
   x.drawImage(template,0,0,W,H);x.scale(W/SOURCE_W,H/SOURCE_H);
   fitted(x,group,528,71,720,25);fitted(x,dateLabel,528,204,500,30);
   winner(x,ranking.filter(p=>p.rank===2),286,469,225);
   winner(x,ranking.filter(p=>p.rank===1),528,451,250);
   winner(x,ranking.filter(p=>p.rank===3),778,487,225);
   fitted(x,participants.length+' spelare',305,751,150,31);
   fitted(x,matches.length+' matcher',586,751,177,31);
   fitted(x,rounds+' rundor',856,751,161,31);
   const baselines=[953,997,1041,1087,1125,1162,1200,1238];
   for(let row=0;row<8;row++){
    const p=ranking[offset+row],y=baselines[row];
    if(!p){if(row<3){x.fillStyle='#071c2b';x.fillRect(98,y-30,855,35);}continue;}
    const color=row===0?'#10100b':row===1?'#121921':row===2?'#fff4de':'#fff';
    if(row<3){if(p.rank!==row+1){
      // Copy a clean patch from the same metallic row, retaining the original laurels.
      const sy=(y-27)/SOURCE_H*template.naturalHeight,sh=32/SOURCE_H*template.naturalHeight;
      x.drawImage(template,210/SOURCE_W*template.naturalWidth,sy,26/SOURCE_W*template.naturalWidth,sh,144,y-27,24,32);
      fitted(x,p.rank,156,y,26,30,color);
    }}else fitted(x,p.rank,156,y,55,26,color);
    fitted(x,p.name,320,y,row<3?280:280,row<3?32:26,color,'left',row<3);
    fitted(x,p.wins,641,y,70,row<3?32:26,color);
    fitted(x,(p.difference>0?'+':'')+p.difference,862,y,132,row<3?30:26,row===0?'#fff3c1':color,'center',false);
   }
   if(!ranking.length)text(x,'Inga registrerade resultat idag',528,1150,27);
   if(ranking.length>8)text(x,'Resultatlista '+(offset/8+1)+' / '+Math.ceil(ranking.length/8),528,1276,16);
   pages.push(canvas);
  }
  return pages;
 }
 window.badmintonDailyDiploma={create};
})();
