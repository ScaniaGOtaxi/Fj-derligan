const assert=require('node:assert/strict'),api=require('../test/rotation-two-one.js');
for(let n=3;n<=12;n++)for(let c=1;c<=3;c++)for(const on of [false,true])for(let strict=0;strict<=n;strict++){
 const ps=Array.from({length:n},(_,i)=>({name:'P'+i,mode:i<strict?'onlySingles':'normal'}));
 
 const layout=api.selectLayout(n,c,strict,on),R=strict?8:api.cycle(layout)*2,plan=api.plan(ps,R,c,on,api.seeded(42));assert.equal(plan.length,R);const roles=Object.fromEntries(ps.map(p=>[p.name,{solo:0,duo:0,single:0,double:0,rest:0}]));
 for(const round of plan){assert.equal(round.courts.length,layout.used);assert.equal(round.rest.length,layout.rest);const names=[...round.courts.flatMap(x=>x.players),...round.rest];assert.equal(names.length,n);assert.equal(new Set(names).size,n);if(!on)assert(round.courts.every(x=>x.type!=='2 mot 1'));for(const name of round.rest)roles[name].rest++;
 for(const court of round.courts){const [a,b]=api.teams(court);assert([1,2].includes(a.length)&&[1,2].includes(b.length));for(const team of [a,b])for(const name of team){const role=court.type==='Dubbel'?'double':court.type==='Singel'?'single':team.length===1?'solo':'duo';roles[name][role]++;if(ps.find(p=>p.name===name).mode==='onlySingles')assert(['solo','single'].includes(role));}}
 if(!strict){const counts=Object.values(roles).map(x=>x.rest);assert(Math.max(...counts)-Math.min(...counts)<=1);}
 }
 if(!strict)for(const p of Object.values(roles)){assert.equal(p.solo,R*layout.t/n);assert.equal(p.duo,R*2*layout.t/n);assert.equal(p.single,R*2*layout.s/n);assert.equal(p.double,R*4*layout.d/n);assert.equal(p.rest,R*layout.rest/n);}
}
const ps=Array.from({length:8},(_,i)=>({name:'P'+i,mode:'normal'}));const off=api.recommend(ps,2,false),on=api.recommend(ps,2,true);assert.equal(off.rounds,7);assert.equal(on.rounds,7);assert.equal(off.partners,28);assert.equal(off.opponents,28);assert.deepEqual(off.plan,on.plan);assert.equal(api.coverage(off.plan).partnerRepeats,0);assert.deepEqual(api.plan(ps,off.rounds,2,false,api.seeded(off.seed)),off.plan);
console.log('PASS shared planner: 3–12 players, 1–3 courts, both modes, every strict preference count, fair rests, complete role cycles and identical 8/2 pair coverage');

const mixed=Array.from({length:4},(_,i)=>({name:'M'+i,mode:i<2?'onlySingles':'normal'}));const mixedPlan=api.plan(mixed,16,1,false,api.seeded(42));for(const p of mixed)assert(mixedPlan.some(r=>r.courts.some(c=>c.players.includes(p.name))));console.log('PASS constrained singles preserve participation for all players');

for(let n=3;n<=12;n++)for(let c=1;c<=3;c++)for(let only=0;only<=n;only++)assert(api.selectLayout(n,c,only,true).rest<=api.selectLayout(n,c,only,false).rest);console.log('PASS allowing 2-v-1 cannot increase required rests');
