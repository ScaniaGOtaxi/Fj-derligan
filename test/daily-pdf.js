(() => {
 'use strict';
 async function create(section){
  const canvas=document.createElement('canvas');canvas.width=1240;canvas.height=1754;
  const ctx=canvas.getContext('2d'),pages=[];let y;
  const reset=()=>{ctx.fillStyle='#0b1e30';ctx.fillRect(0,0,1240,1754);ctx.strokeStyle='#cda352';ctx.lineWidth=2;ctx.strokeRect(30,30,1180,1694);ctx.fillStyle='#e9c979';ctx.font='bold 28px Arial';ctx.fillText('DAGENS SPEL · DETALJER OCH MATCHRESULTAT',65,82);ctx.fillStyle='#f2f5f8';ctx.font='26px Arial';y=145;};
  const save=()=>pages.push(Uint8Array.from(atob(canvas.toDataURL('image/jpeg',0.9).split(',')[1]),c=>c.charCodeAt(0)));
  section.querySelectorAll('canvas[data-diploma-page]').forEach(page=>pages.push(Uint8Array.from(atob(page.toDataURL('image/jpeg',0.94).split(',')[1]),c=>c.charCodeAt(0))));
  reset();
  const details=section.querySelector('details');
  for(const node of (details||section).children){
   if(node.tagName==='SUMMARY'||node.tagName==='CANVAS')continue;
   const heading=/^H/.test(node.tagName);ctx.font=heading?'bold 32px Arial':'26px Arial';
   let line='';
   const flush=()=>{if(y>1650){save();reset();ctx.font=heading?'bold 32px Arial':'26px Arial';}ctx.fillText(line,65,y);y+=40;line='';};
   for(const word of node.textContent.split(/\s+/)){const next=line?line+' '+word:word;if(ctx.measureText(next).width>1110&&line)flush();line=line?line+' '+word:word;}if(line)flush();y+=18;
  }
  save();
  const enc=new TextEncoder(),parts=[],offsets=[0];let length=0;
  const push=data=>{const bytes=typeof data==='string'?enc.encode(data):data;parts.push(bytes);length+=bytes.length;};
  const object=(id,body)=>{offsets[id]=length;push(id+' 0 obj\n');push(body);push('\nendobj\n');};
  push('%PDF-1.4\n');object(1,'<< /Type /Catalog /Pages 2 0 R >>');
  object(2,'<< /Type /Pages /Count '+pages.length+' /Kids ['+pages.map((_,i)=>(3+i*3)+' 0 R').join(' ')+'] >>');
  pages.forEach((jpg,i)=>{const id=3+i*3;object(id,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im '+(id+1)+' 0 R >> >> /Contents '+(id+2)+' 0 R >>');
   offsets[id+1]=length;push((id+1)+' 0 obj\n<< /Type /XObject /Subtype /Image /Width 1240 /Height 1754 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+jpg.length+' >>\nstream\n');push(jpg);push('\nendstream\nendobj\n');
   const stream='q 595 0 0 842 0 0 cm /Im Do Q';object(id+2,'<< /Length '+stream.length+' >>\nstream\n'+stream+'\nendstream');});
  const start=length;push('xref\n0 '+offsets.length+'\n0000000000 65535 f \n');offsets.slice(1).forEach(n=>push(String(n).padStart(10,'0')+' 00000 n \n'));push('trailer\n<< /Size '+offsets.length+' /Root 1 0 R >>\nstartxref\n'+start+'\n%%EOF');
  return new File(parts,'badminton-dagsrapport-'+new Date().toLocaleDateString('sv-SE')+'.pdf',{type:'application/pdf'});
 }
 function download(file){const url=URL.createObjectURL(file),a=document.createElement('a');a.href=url;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}
 window.badmintonDailyPDF={create,download};
})();

