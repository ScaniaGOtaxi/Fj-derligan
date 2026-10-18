(() => {
 'use strict';
 const W=1240,H=1754;
 function create({groupName,date,ranking,participants,matches,sessions,rounds}){
  const pages=[];
  function sheet(){const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
   const bg=x.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#061424');bg.addColorStop(.5,'#123047');bg.addColorStop(1,'#030e1b');x.fillStyle=bg;x.fillRect(0,0,W,H);
   const glow=x.createRadialGradient(620,460,10,620,460,750);glow.addColorStop(0,'#c6963b22');glow.addColorStop(1,'#00000000');x.fillStyle=glow;x.fillRect(0,0,W,H);
   x.strokeStyle='#cfa454';x.lineWidth=3;x.strokeRect(26,26,W-52,H-52);x.lineWidth=1;x.strokeRect(38,38,W-76,H-76);
   for(let i=0;i<95;i++){const px=45+((i*157)%1150),py=65+((i*293)%1600);x.fillStyle=i%3?'#d4ae5529':'#e8c66a66';x.beginPath();x.arc(px,py,i%3+1,0,Math.PI*2);x.fill();}
   // Decorative rackets and shuttlecocks, drawn locally without external images.
   for(const side of [-1,1]){x.save();x.translate(side<0?115:W-115,140);x.rotate(side*.45);x.strokeStyle='#dab76b88';x.lineWidth=3;x.beginPath();x.ellipse(0,0,37,57,0,0,7);x.moveTo(0,57);x.lineTo(0,135);x.stroke();for(let j=-2;j<=2;j++){x.beginPath();x.moveTo(j*12,-40);x.lineTo(j*12,40);x.moveTo(-28,j*15);x.lineTo(28,j*15);x.stroke();}x.restore();}
   pages.push(c);return {c,x};
  }
  function text(x,value,cx,y,size=28,color='#f5e4b9',align='center',font='Arial'){x.fillStyle=color;x.font=(font==='Georgia'?'bold ':'')+size+'px '+font;x.textAlign=align;x.fillText(String(value),cx,y);}
  function fitted(x,value,cx,y,max,size=30,color='#fff',font='Arial'){while(size>14){x.font=size+'px '+font;if(x.measureText(value).width<=max)break;size--;}text(x,value,cx,y,size,color,'center',font);}
  function gold(x,y,h){const g=x.createLinearGradient(0,y,0,y+h);g.addColorStop(0,'#fff0af');g.addColorStop(.25,'#c5963b');g.addColorStop(.55,'#f4d779');g.addColorStop(1,'#8e6023');return g;}
  function heading(x,title,subtitle){fitted(x,groupName,620,115,870,33,'#e8cb82','Georgia');fitted(x,title,620,220,1050,74,'#f5db94','Georgia');text(x,subtitle,620,275,29);x.strokeStyle='#cda352';x.beginPath();x.moveTo(270,305);x.lineTo(970,305);x.stroke();}
  function footer(x,page){text(x,'Badminton App · Skapad av Piotr Zdeb',620,1678,23);text(x,'Vinster → poängskillnad → gjorda poäng · Delad placering vid lika resultat',620,1708,17,'#d0d8df');if(page)text(x,page,1150,1688,19);}
  const {x}=sheet();heading(x,'DAGENS MÄSTARE',date);
  const colors={1:['#fff0ae','#d6a443','#85581c'],2:['#f6faff','#aab9c5','#536474'],3:['#ffd4b2','#bf7846','#734122']};
  for(const [rank,cx,top] of [[2,290,685],[1,620,620],[3,950,725]]){
   const palette=colors[rank],people=ranking.filter(p=>p.rank===rank),width=290;
   const g=x.createLinearGradient(cx-width/2,0,cx+width/2,0);palette.forEach((c,i)=>g.addColorStop(i/2,c));x.fillStyle=g;x.beginPath();x.roundRect(cx-width/2,top,width,825-top,15);x.fill();x.strokeStyle=palette[0];x.lineWidth=3;x.stroke();text(x,rank,cx,top+67,58,'#152236','center','Georgia');
   // Ribbon and embossed medal.
   const my=rank===1?440:rank===2?475:500;
   x.fillStyle=palette[1];for(const direction of [-1,1]){x.beginPath();x.moveTo(cx+direction*8,my-25);x.lineTo(cx+direction*55,my-115);x.lineTo(cx+direction*22,my-115);x.lineTo(cx-direction*16,my-25);x.fill();}
   x.shadowColor='#0008';x.shadowBlur=22;x.fillStyle=g;x.beginPath();x.arc(cx,my,66,0,Math.PI*2);x.fill();x.shadowBlur=0;x.strokeStyle=palette[0];x.lineWidth=3;x.beginPath();x.arc(cx,my,55,0,Math.PI*2);x.stroke();text(x,['','GULD','SILVER','BRONS'][rank],cx,my+7,22,'#152236','center','Georgia');
   if(people.length){const names=people.map(p=>p.name).join(' & ');fitted(x,names,cx,my+112,300,37,'#fff1c7','Georgia');text(x,people[0].wins+' vinster'+(people.length>1?' · delad plats':''),cx,my+151,23);}else text(x,'Ingen placering',cx,my+110,24,'#bec8d2');
  }
  x.strokeStyle='#cca24d';x.lineWidth=2;x.beginPath();x.roundRect(85,855,1070,95,24);x.stroke();
  text(x,participants.length+' spelare',275,913,30);text(x,matches.length+' matcher',620,913,30);text(x,rounds+' rundor',960,913,30);
  text(x,'Dagens resultat',620,1020,49,'#f5db94','center','Georgia');
  function table(x,rows,y){
   x.fillStyle='#203b50';x.fillRect(85,y-37,1070,53);text(x,'Plats',110,y,22,'#edcf86','left');text(x,'Spelare',245,y,22,'#edcf86','left');text(x,'Vinster',875,y,22,'#edcf86','right');text(x,'Poängskillnad',1120,y,22,'#edcf86','right');y+=25;
   for(const p of rows){x.fillStyle=p.rank<=3?colors[p.rank][1]:'#102536';x.fillRect(85,y,1070,53);const color=p.rank<=3?'#0c1724':'#f5f7fa';text(x,p.rank,120,y+36,26,color,'left');x.save();x.beginPath();x.rect(230,y,570,53);x.clip();text(x,p.name,245,y+36,28,color,'left');x.restore();text(x,p.wins,875,y+36,27,color,'right');text(x,(p.difference>0?'+':'')+p.difference,1120,y+36,27,color,'right');y+=55;}
  }
  table(x,ranking.slice(0,8),1080);
  if(!ranking.length)text(x,'Inga registrerade resultat idag',620,1210,30);
  text(x,'Tack för dagens spel!',620,1625,43,'#eac979','center','Georgia');footer(x);
  for(let i=8;i<ranking.length;i+=21){const next=sheet();heading(next.x,'ALLA PLACERINGAR',date);table(next.x,ranking.slice(i,i+21),400);footer(next.x);}
  return pages;
 }
 window.badmintonDailyDiploma={create};
})();
