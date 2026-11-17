import assert from 'node:assert/strict';
import {CPL as C} from '../supabase/functions/cricket-api/engine.js';
const teams=[{name:'A',players:[{id:'a0',name:'A0'},{id:'a1',name:'A1'}]},{name:'B',players:[{id:'b0',name:'B0'},{id:'b1',name:'B1'}]}];
function match(mode){return C.create(teams,'T10',{players:2,overs:2,cap:1,extraBallMode:mode})}
function ball(m,extra='normal',penaltyRuns){const n=m.innings.at(-1),s=C.stats(m,m.innings.length-1);return C.append(m,{striker:n.striker,nonStriker:n.nonStriker,bowler:n.batting===0?(s.balls<6?'b0':'b1'):(s.balls<6?'a0':'a1'),extra,runs:0,...(penaltyRuns===undefined?{}:{penaltyRuns})})}
let m=match('standard');ball(m,'wide',2);assert.equal(C.stats(m,0).balls,0);assert.equal(C.stats(m,0).runs,2);
m=match('repeat_last');for(let i=0;i<6;i++)ball(m,'wide',2);assert.equal(C.stats(m,0).balls,6);assert.equal(C.stats(m,0).runs,12);assert.equal(m.innings[0].ended,false);ball(m,'wide',2);assert.equal(C.stats(m,0).balls,6);ball(m,'noball',2);assert.equal(C.stats(m,0).balls,6);ball(m,'wide',1);assert.equal(C.stats(m,0).free,true);for(let i=0;i<6;i++)ball(m);assert.equal(C.stats(m,0).balls,12);assert.equal(m.innings[0].ended,true);assert.deepEqual(C.stats(C.validate(m),0),C.stats(m,0));
const corrupted=C.copy(m);corrupted.innings[0].events[0].countsBall=false;assert.equal(C.validate(corrupted).innings[0].events[0].countsBall,true);
m=match('count_all');for(let i=0;i<12;i++)ball(m,'wide',0);assert.equal(m.innings[0].ended,true);assert.equal(C.stats(m,0).runs,0);
m=match('repeat_last');assert.throws(()=>ball(m,'wide',-1));assert.throws(()=>ball(m,'wide',1.5));assert.throws(()=>ball(m,'normal',2));
const one=C.create(teams,'T10',{players:2,overs:1,cap:1,extraBallMode:'repeat_last'});ball(one,'wide',2);assert.equal(C.stats(one,0).balls,0);
assert.throws(()=>match('invalid'));
m=match('count_all');for(let i=0;i<12;i++)ball(m);C.next(m);ball(m,'wide',2);assert.equal(m.innings[1].ended,true);assert.equal(C.stats(m,1).runs,2);
console.log('PASS: standard, count-all, repeat-last, one-over edge, manual penalties, innings completion/target, free-hit, bowler quota and replay validation.');
