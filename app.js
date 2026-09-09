import { questions } from './questions.js';
import { renderLibrary } from './study-library.js';
import { shuffle, createSession, batch, begin, answer, next, continueQuiz, submitMatches, continueMatching } from './engine.js';
const byId = Object.fromEntries(questions.map(q => [q.id, q]));
const ids = questions.map(q => q.id);
const KEY = 'seven-test9-v1';
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const expanded = {q19:'Convenience, efficiency, safety, and service',q31:'Life safety and public safety'};
const correctAnswers = Object.fromEntries(questions.map(q => [q.id, expanded[q.id] || q.choices[q.answer]]));
let state;
try {
  state = JSON.parse(localStorage.getItem(KEY));
  if (!state || !['quiz','matching'].includes(state.mode) || !['quiz','matching'].every(mode => {
    const s = state[mode];
    return s && s.order.length === ids.length && new Set(s.order).size === ids.length && s.order.every(id => byId[id]) && Array.isArray(s.round) && Number.isInteger(s.offset) && s.offset >= 0 && s.offset <= ids.length;
  })) state = null;
} catch { state = null; }
if (!state) { state = {mode:'quiz',quiz:createSession(ids),matching:createSession(ids)}; begin(state.quiz); begin(state.matching); }
const app = document.querySelector('#app');
function save() { try { localStorage.setItem(KEY,JSON.stringify(state)); } catch { document.querySelector('#save-note').textContent = 'Progress is only available until this page closes'; } }
function render(focus = false) {
  const view = location.hash.slice(1);
  const library = ['answers','mnemonics','guide'].includes(view);
  document.querySelectorAll('[data-library]').forEach(button=>{
    button.classList.toggle('active',view===button.dataset.library);
    button.setAttribute('aria-pressed',String(view===button.dataset.library));
  });
  document.querySelector('#restart').hidden=library;
  if (library) {
    ['quiz','matching'].forEach(mode=>{document.querySelector(`#${mode}-mode`).classList.remove('active');document.querySelector(`#${mode}-mode`).setAttribute('aria-pressed','false');});
    renderLibrary(app,view);
    if(focus){app.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
    return;
  }
  const s = state[state.mode], matching = state.mode === 'matching';
  const complete = s.phase === 'complete';
  document.querySelector('#quiz-mode').classList.toggle('active',!matching);
  document.querySelector('#matching-mode').classList.toggle('active',matching);
  document.querySelector('#quiz-mode').setAttribute('aria-pressed',String(!matching));
  document.querySelector('#matching-mode').setAttribute('aria-pressed',String(matching));
  const mastered = Math.min(ids.length,s.offset + (matching ? (s.result?.length === batch(s).length ? batch(s).length : 0) : s.phase === 'passed' ? batch(s).length : 0));
  app.innerHTML = `<p class="eyebrow">${matching?'CONNECT WHAT YOU KNOW':'YOUR NEXT SMALL STEP'}</p><h1>${matching?'Matching practice':'Practice questions'}</h1><p class="intro">${matching?'Match the full set. Get every answer right to move on.':'Seven questions at a time. Revisit the misses. Make it stick.'}</p><div class="progress-row"><span>Overall progress</span><strong>${mastered} of ${ids.length} mastered</strong></div><div class="progress-track" role="progressbar" aria-label="Questions mastered" aria-valuemin="0" aria-valuemax="${ids.length}" aria-valuenow="${mastered}"><div class="progress-fill" style="width:${mastered / ids.length * 100}%"></div></div><section class="study" aria-label="${matching?'Matching set':'Question workspace'}">${complete ? summary('✓','You’ve mastered every question.',`All ${ids.length} items completed in ${matching?'matching':'question'} mode. Your persistence paid off.`,matching?'Practice questions':'Try matching practice','switch') : matching ? matchingView(s) : quizView(s)}</section><p class="under-note">${complete?'Your progress is saved. Come back whenever you want to practice.':matching?'A perfect set unlocks the next batch. Shared answers may be used more than once.':'No timer. No rush. Your place is saved automatically.'}</p>`;
  bind(s,matching);
  save();
  if (focus) { app.focus({preventScroll:true}); window.scrollTo({top:0,behavior:'instant'}); }
}
function summary(symbol,title,description,label,action) { return `<div class="summary"><span class="summary-symbol" aria-hidden="true">${symbol}</span><p class="eyebrow">${action==='continue'?'BATCH CHECKPOINT':'KEEP GOING'}</p><h2>${title}</h2><p>${description}</p><button class="primary" data-action="${action}">${label} <span aria-hidden="true">→</span></button></div>`; }
function quizView(s) {
  if(s.phase==='retry')return summary('↻',`${s.missed.length} ${s.missed.length===1?'question':'questions'} to revisit.`,`You corrected every answer. Now practice only the ${s.missed.length===1?'question':'questions'} you missed in this round. A clean answer clears it from the retry queue.`,`Retry ${s.missed.length} ${s.missed.length===1?'question':'questions'}`,'continue');
  if(s.phase==='passed')return summary('✓','Batch mastered.',`You’ve answered all ${batch(s).length} questions correctly on their latest attempt. ${ids.length-s.offset-batch(s).length} questions remain.`,s.offset+batch(s).length===ids.length?'Finish practice':'Next batch','continue');
  const q = byId[s.round[s.index]];
  const missed = s.missed.includes(q.id);
  return `<div class="study-top"><span class="batch-tag">Batch ${Math.floor(s.offset/7)+1} of ${Math.ceil(ids.length/7)}${s.pass>1?` · Retry ${s.pass-1}`:''}</span><span class="step-count">Question ${s.index+1} of ${s.round.length}</span></div><p class="source">${escape(q.source)}</p><h2 class="question">${escape(q.prompt.replace(/(^|\s)\?(?=\s|$)/g,'$1_____'))}</h2><div class="choices">${q.choices.map((c,i) => {const wrong=s.attempts.includes(i)&&i!==q.answer;const right=s.corrected&&i===q.answer;return `<button class="choice ${wrong?'wrong':right?'correct':''}" data-choice="${i}" ${s.corrected||wrong?'disabled':''}><span class="letter">${String.fromCharCode(65+i)}</span><span>${escape(c)}</span>${wrong||right?`<span class="status-icon" aria-label="${wrong?'Incorrect':'Correct'}">${wrong?'×':'✓'}</span>`:''}</button>`;}).join('')}</div><div class="feedback ${s.corrected?'success':missed?'error':''}" role="status" aria-live="polite">${s.corrected?(missed?'Correct. This question will return after this round.':'Correct. You’ve got it.'):missed?'Incorrect. Select the correct answer to continue.':'Choose the best answer.'}</div><div class="study-bottom"><div class="dots" aria-hidden="true">${s.round.map((_,i)=>`<span class="dot ${i<s.index?'done':i===s.index?'current':''}"></span>`).join('')}</div><button class="primary" data-action="next" ${s.corrected?'':'disabled'}>${s.index+1===s.round.length?'Finish round':'Next question'} <span aria-hidden="true">→</span></button></div>`;
}
function matchingView(s) {
  if (!s.bank) s.bank = shuffle([...new Set(batch(s).map(id=>correctAnswers[id]))]);
  const result=s.result;
  return `<div class="study-top"><span class="batch-tag">Batch ${Math.floor(s.offset/7)+1} of ${Math.ceil(ids.length/7)} · Attempt ${s.pass}</span><span class="step-count">${batch(s).length} matches</span></div><h2 class="question">Find the right connections.</h2><p class="intro">Choose an answer for each question, then check the entire set.</p><div class="bank"><div class="bank-title">ANSWER BANK</div><div class="bank-items">${s.bank.map(a=>`<span class="bank-item">${escape(a)}</span>`).join('')}</div></div><div>${batch(s).map((id,i)=>`<div class="match-row ${result?(result.includes(id)?'correct':'wrong'):''}"><label for="match-${id}"><strong>${i+1}.</strong> ${escape(byId[id].prompt.replace(/(^|\s)\?(?=\s|$)/g,'$1_____'))}</label><select id="match-${id}" data-match="${id}" ${result?'disabled':''}><option value="">Select an answer…</option>${s.bank.map(a=>`<option value="${escape(a)}" ${s.matches[id]===a?'selected':''}>${escape(a)}</option>`).join('')}</select>${result?`<div class="match-status">${result.includes(id)?'✓ Correct':`× Incorrect. Correct answer: ${escape(correctAnswers[id])}`}</div>`:''}</div>`).join('')}</div><div class="feedback ${result?(result.length===batch(s).length?'success':'error'):''}" role="status" aria-live="polite">${result?result.length===batch(s).length?`Perfect: ${result.length} of ${batch(s).length} correct. This batch is mastered.`:`${result.length} of ${batch(s).length} correct. Review the answers, then repeat this same set.`:'Complete every match to submit.'}</div><div class="study-bottom"><span class="step-count" id="match-count">${Object.values(s.matches).filter(Boolean).length} of ${batch(s).length} selected</span><button class="primary" data-action="${result?'matching-next':'submit'}" ${!result&&!batch(s).every(id=>s.matches[id])?'disabled':''}>${result?result.length===batch(s).length?(s.offset+batch(s).length===ids.length?'Finish matching':'Next batch'):'Retry same set':'Check matches'} <span aria-hidden="true">→</span></button></div>`;
}
function bind(s,matching) {
  app.querySelectorAll('[data-choice]').forEach(el=>el.onclick=()=>{answer(s,Number(el.dataset.choice),byId[s.round[s.index]].answer);render();if(s.corrected)app.querySelector('[data-action="next"]').focus();});
  app.querySelectorAll('[data-match]').forEach(el=>el.onchange=()=>{s.matches[el.dataset.match]=el.value;save();app.querySelector('[data-action="submit"]').disabled=!batch(s).every(id=>s.matches[id]);app.querySelector('#match-count').textContent=`${Object.values(s.matches).filter(Boolean).length} of ${batch(s).length} selected`;});
  app.querySelectorAll('[data-action]').forEach(el=>el.onclick=()=>{
    const action=el.dataset.action;
    if(action==='next')next(s);
    if(action==='continue')continueQuiz(s);
    if(action==='submit')submitMatches(s,correctAnswers);
    if(action==='matching-next'){const previous=s.offset;continueMatching(s);if(s.offset!==previous)delete s.bank;}
    if(action==='switch')state.mode=matching?'quiz':'matching';
    render(action!=='submit');
    if(action==='submit')app.querySelector('.feedback').scrollIntoView({block:'center',behavior:'instant'});
  });
}
document.querySelector('#quiz-mode').onclick=()=>{state.mode='quiz';history.replaceState(null,'',location.pathname);render(true);};
document.querySelector('#matching-mode').onclick=()=>{state.mode='matching';history.replaceState(null,'',location.pathname);render(true);};
document.querySelectorAll('[data-library]').forEach(button=>button.onclick=()=>{history.replaceState(null,'',`#${button.dataset.library}`);render(true);});
window.addEventListener('hashchange',()=>render(true));
const help=document.querySelector('#help-dialog'),reset=document.querySelector('#reset-dialog');
document.querySelector('#help').onclick=()=>help.showModal();
help.querySelector('.close').onclick=()=>help.close();
document.querySelector('#restart').onclick=()=>reset.showModal();
document.querySelector('#cancel-reset').onclick=()=>reset.close();
document.querySelector('#confirm-reset').onclick=()=>{state[state.mode]=createSession(ids);begin(state[state.mode]);reset.close();render(true);};
render();
