(() => {
  'use strict';
  function calculate(matches, members = []) {
    const players = new Map(members.map(p => [p.id,{id:p.id,name:p.name,played:0,wins:0,losses:0,draws:0,for:0,against:0,difference:0,winPercent:0}]));
    const scored = [], seen = new Set();let unscored=0,invalid=0;
    for(const match of matches){
      if(match.round_status!=='completed')continue;
      const key=[match.session_id,match.round_number,match.court_number].join(':');if(seen.has(key))continue;seen.add(key);
      const participants=match.players||[],redTeam=participants.filter(p=>p.team===1),blueTeam=participants.filter(p=>p.team===2);
      if(![1,2].includes(redTeam.length)||redTeam.length!==blueTeam.length||participants.length!==redTeam.length+blueTeam.length||new Set(participants.map(p=>p.id)).size!==participants.length||participants.some(p=>!p.id)){invalid++;continue;}
      if(!Number.isInteger(match.red)||!Number.isInteger(match.blue)||match.red<0||match.blue<0||(match.red===0&&match.blue===0)){unscored++;continue;}
      scored.push(match);
      for(const participant of participants){
        if(!players.has(participant.id))players.set(participant.id,{id:participant.id,name:participant.name,played:0,wins:0,losses:0,draws:0,for:0,against:0,difference:0,winPercent:0});
        const player=players.get(participant.id),own=participant.team===1?match.red:match.blue,other=participant.team===1?match.blue:match.red;
        player.played++;player.for+=own;player.against+=other;
        if(own>other)player.wins++;else if(own<other)player.losses++;else player.draws++;
        player.difference=player.for-player.against;player.winPercent=Math.round(player.wins/player.played*100);
      }
    }
    return {players:[...players.values()].sort((a,b)=>b.wins-a.wins||b.difference-a.difference||a.name.localeCompare(b.name,'sv')),matches:scored,unscored,invalid};
  }
  const headers=['Spelare','Resultatmatcher','Vinster','Förluster','Oavgjorda','Gjorda poäng','Insläppta poäng','Poängskillnad','Vinstprocent'];
  const values=p=>[p.name,p.played,p.wins,p.losses,p.draws,p.for,p.against,p.difference,p.winPercent];
  function csv(result){const cell=v=>{let text=String(v);if(typeof v==='string'&&/^[=+@-]/.test(text))text="'"+text;return '"'+text.replace(/"/g,'""')+'"';};return '\uFEFF'+[headers,...result.players.map(values)].map(row=>row.map(cell).join(';')).join('\r\n');}
  const escape=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function report(result,groupName){return '<!doctype html><html lang="sv"><meta charset="utf-8"><title>Resultatstatistik</title><style>body{font:14px system-ui;padding:24px}table{border-collapse:collapse;width:100%}th,td{padding:8px;border:1px solid #aaa;text-align:left}@page{size:landscape}</style><h1>Resultatstatistik – '+escape(groupName)+'</h1><p>'+result.matches.length+' färdigspelade matcher med poäng. '+result.unscored+' matcher utan registrerat resultat (saknade poäng eller 0–0).</p><table><thead><tr>'+headers.map(h=>'<th>'+escape(h)+'</th>').join('')+'</tr></thead><tbody>'+result.players.map(p=>'<tr>'+values(p).map(v=>'<td>'+escape(v)+'</td>').join('')+'</tr>').join('')+'</tbody></table><p>I dubbel räknas lagets poäng för båda spelarna. Endast rundor markerade Klar ingår. Oavgjorda räknas separat.</p></html>';}
  const api={calculate,csv,report};
  if(typeof module!=='undefined')module.exports=api;
  if(typeof window!=='undefined')window.badmintonResults=api;
})();
