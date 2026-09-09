import test from 'node:test';
import assert from 'node:assert/strict';
import {questions} from './questions.js';
import {createSession,begin,batch,answer,next,continueQuiz,submitMatches,continueMatching} from './engine.js';
const fresh=()=>{const s=createSession(questions.map(q=>q.id));begin(s);return s;};
test('all 36 source items have a valid highlighted answer',()=>{assert.equal(questions.length,36);assert.equal(new Set(questions.map(q=>q.id)).size,36);for(const q of questions){assert.ok(q.prompt&&q.source);assert.ok(q.answer>=0&&q.answer<q.choices.length);}});
test('wrong answers block advancing, remain queued after correction, and repeat until clean',()=>{
 const s=fresh(),original=[...batch(s)],missed=original[0];
 answer(s,1,0);next(s);assert.equal(s.index,0);
 answer(s,0,0);next(s);
 for(let i=1;i<7;i++){answer(s,0,0);next(s);}
 assert.equal(s.phase,'retry');assert.deepEqual(s.missed,[missed]);continueQuiz(s);assert.deepEqual(s.round,[missed]);
 answer(s,1,0);answer(s,0,0);next(s);assert.equal(s.phase,'retry');continueQuiz(s);
 answer(s,0,0);next(s);assert.equal(s.phase,'passed');continueQuiz(s);assert.equal(s.offset,7);assert.ok(batch(s).every(id=>!original.includes(id)));
});
test('matching rejects partial submission and repeats every original item after any miss',()=>{
 const s=fresh(),original=[...batch(s)],key=Object.fromEntries(s.order.map(id=>[id,'answer']));
 s.matches[original[0]]='answer';submitMatches(s,key);assert.equal(s.result,null);
 original.forEach(id=>s.matches[id]='answer');s.matches[original[2]]='wrong';submitMatches(s,key);assert.equal(s.result.length,6);
 continueMatching(s);assert.deepEqual(batch(s),original);assert.deepEqual(s.matches,{});assert.equal(s.offset,0);
 original.forEach(id=>s.matches[id]='answer');submitMatches(s,key);continueMatching(s);assert.equal(s.offset,7);
});
test('both modes cover every item once in new batches and finish the final remainder',()=>{
 for(const matching of [false,true]){const s=fresh(),seen=[];while(s.phase!=='complete'){seen.push(...batch(s));if(matching){const key=Object.fromEntries(batch(s).map(id=>[id,'yes']));s.matches={...key};submitMatches(s,key);continueMatching(s);}else{for(const id of batch(s)){answer(s,0,0);next(s);}continueQuiz(s);}}assert.equal(s.offset,36);assert.equal(seen.length,36);assert.equal(new Set(seen).size,36);}
});
