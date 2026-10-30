const assert=require('node:assert/strict'),api=require('../test/rotation-two-one.js');const rng=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32};
for(let n=3;n<=12;n++)for(let c=1;c<=3;c++)for(let only=0;only<=n;only++)for(let seed=1;seed<=5;seed++){
 const ps=Array.from({length:n},(_,i)=>({name:'P'+i,mode:i<only?'onlySingles':'normal'}));const possible=api.shape(n,c),shape=api.shape(n,c,only);
 if(possible&&!shape){assert(api.plan(ps,9,c,true,rng(seed)).every(r=>r.rest.length>0));continue;}
 if(!possible){const plan=api.plan(ps,9,c,true,rng(seed));assert(plan.every(r=>r.rest.length>0));continue;}
 const R=only?12:api.cycle(shape)*2,plan=api.plan(ps,R,c,true,rng(seed)),roles=Object.fromEntries(ps.map(p=>[p.name,{solo:0,duo:0,single:0,double:0}]));
 for(const round of plan){assert.equal(round.rest.length,0);assert(round.courts.length<=c);assert.equal(round.courts.length,shape.used);const names=round.courts.flatMap(x=>x.players);assert.equal(names.length,n);assert.equal(new Set(names).size,n);
 for(const court of round.courts){const [a,b]=api.teams(court);assert([1,2].includes(a.length)&&[1,2].includes(b.length));assert.equal(court.players.length,court.type==='Dubbel'?4:court.type==='Singel'?2:3);for(const team of [a,b])for(const name of team){const role=court.type==='Dubbel'?'double':court.type==='Singel'?'single':team.length===1?'solo':'duo';roles[name][role]++;if(ps.find(p=>p.name===name).mode==='onlySingles')assert(['solo','single'].includes(role));}}
 }
 if(!only){for(const counts of Object.values(roles)){assert.equal(counts.solo,R*shape.t/n);assert.equal(counts.duo,R*2*shape.t/n);assert.equal(counts.single,R*2*shape.s/n);assert.equal(counts.double,R*4*shape.d/n);}}
}
for(const [n,c,t,d,s] of [[9,3,3,0,0],[7,2,1,1,0],[11,3,1,2,0],[10,3,2,1,0],[8,3,2,0,1],[6,2,2,0,0],[5,2,1,0,1]])assert.deepEqual(api.shape(n,c),{d,t,s,used:c});
assert.equal(api.cycle(api.shape(9,3)),3);assert.equal(api.cycle(api.shape(7,2)),7);assert.equal(api.cycle(api.shape(11,3)),11);
for(const [n,c] of [[7,2],[11,3]]){const ps=Array.from({length:n},(_,i)=>({name:'P'+i,mode:'normal'}));const plan=api.plan(ps,n,c,false,rng(1));for(const p of ps)assert.equal(plan.filter(r=>r.rest.includes(p.name)).length,1);assert(plan.every(r=>r.courts.filter(c=>c.type==='Singel').length===1));}
console.log('PASS all 3–12 player / 1–3 court combinations, strict preferences, no rests when feasible, balanced full role cycles and OFF regression');

