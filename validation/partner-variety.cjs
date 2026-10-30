const assert=require('node:assert/strict'),api=require('../test/rotation-two-one.js');
for(const [n,c] of [[7,2],[9,3],[11,3]]){
 const players=Array.from({length:n},(_,i)=>({name:'Spelare '+i,mode:'normal'})),tip=api.recommend(players,c),actual=api.plan(players,tip.rounds,c,true,api.seeded(tip.seed));
 assert.deepEqual(actual,tip.plan,'Creation must use the same proposal');assert(tip.complete);assert.equal(tip.partners,n*(n-1)/2);assert.equal(tip.opponents,n*(n-1)/2);assert(actual.every(r=>r.rest.length===0));
 const period=api.cycle(tip.layout),cyclePlan=api.plan(players,period,c,true,api.seeded(tip.seed));
 for(const p of players){let solo=0,duo=0;for(const r of cyclePlan)for(const m of r.courts)if(m.type==='2 mot 1')for(const team of api.teams(m))if(team.includes(p.name))team.length===1?solo++:duo++;assert.equal(solo,tip.layout.t*period/n);assert.equal(duo,2*tip.layout.t*period/n);}
 if(n===9){assert.equal(tip.rounds,12);assert.equal(api.coverage(actual).partnerRepeats,0,'All 36 partner pairs exactly once');const shorter=api.plan(players,3,c,true,api.seeded(tip.seed));assert(api.coverage(shorter).partners<36);}
 console.log('PASS',n,'players:',tip.rounds,'rounds, partner pairs',tip.partners,'and opponent pairs',tip.opponents);
}
for(const mode of ['onlySingles','moreSingles']){const players=Array.from({length:9},(_,i)=>({name:'P'+i,mode:i===0?mode:'normal'})),tip=api.recommend(players,3),plan=api.plan(players,tip.rounds,3,true,api.seeded(tip.seed));assert.deepEqual(plan,tip.plan);for(const r of plan){assert.equal(r.rest.length,0);const match=r.courts.find(m=>m.players.includes('P0'));assert.equal(match.type,'2 mot 1');assert.equal(api.teams(match)[0][0],'P0');}}
console.log('PASS preferences, stable proposals, normal role cycles and shorter-manual-choice coverage');


const eight=Array.from({length:8},(_,i)=>({name:'P'+i,mode:'normal'}));const off=api.recommend(eight,2,false),on=api.recommend(eight,2,true);assert.equal(off.rounds,7);assert.equal(off.partners,28);assert.equal(off.opponents,28);assert.equal(api.coverage(off.plan).partnerRepeats,0);assert.deepEqual(off.plan,on.plan);assert.deepEqual(api.plan(eight,off.rounds,2,false,api.seeded(off.seed)),off.plan);console.log('PASS identical 8/2 double rotation and coverage with ON and OFF');
