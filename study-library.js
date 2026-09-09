import {studyItems} from './study-data.js';
const esc = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const topics = [...new Set(studyItems.map(q=>q.topic))];
const settings = {
  answers: {title:'Answers to remember',intro:'The key answers, organized by topic. Hide them to test your recall.',eyebrow:'KEEP THE ESSENTIALS CLOSE',pdf:'answers-and-mnemonics.pdf'},
  mnemonics: {title:'Mnemonics',intro:'A memory cue for each answer. Read it, say it, then recall it.',eyebrow:'GIVE YOUR MEMORY A CUE',pdf:'answers-and-mnemonics.pdf'},
  guide: {title:'Complete guide',intro:'All 62 answered study-guide items, organized into seven topics. Try an answer before revealing it.',eyebrow:'YOUR COMPLETE STUDY REFERENCE',pdf:'complete-study-guide.pdf'}
};
let review = new Set();
try { const saved=JSON.parse(localStorage.getItem('test9-study-review-v1')); if(Array.isArray(saved))review=new Set(saved.filter(n=>Number.isInteger(n)&&n>=1&&n<=65&&![13,14,60].includes(n))); } catch {}
export function renderLibrary(app,view) {
  const config=settings[view];
  const items=studyItems.filter(q=>!q.missing);
  let topic='',onlyReview=false;
  const revealed=new Set(view==='answers'?items.map(q=>q.number):[]);
  app.innerHTML=`<div class="library-heading"><p class="eyebrow">${config.eyebrow}</p><h1>${config.title}</h1><p class="intro">${config.intro}</p></div><div class="library-tools"><div class="library-filters"><label for="study-topic">Topic<select id="study-topic"><option value="">All topics</option>${topics.map(t=>`<option>${esc(t)}</option>`).join('')}</select></label><label class="review-filter"><input type="checkbox" id="only-review"> Review later <span id="review-total">(${review.size})</span></label></div><div class="library-controls"><span id="study-count" role="status"></span>${view!=='mnemonics'?'<button class="text-button" id="toggle-answers">'+(view==='answers'?'Hide answers':'Reveal answers')+'</button>':''}</div></div><div id="study-list"></div><div class="source-downloads"><p>Source documents</p><a href="documents/${config.pdf}" target="_blank" rel="noopener">Open original ${view==='guide'?'study guide':'answers & mnemonics'} PDF ↗</a><a href="documents/remaining-practice.pdf" target="_blank" rel="noopener">Open remaining-questions practice PDF ↗</a></div>`;
  const list=app.querySelector('#study-list');
  function filtered(){return items.filter(q=>(!topic||q.topic===topic)&&(!onlyReview||review.has(q.number)));}
  function paint() {
    const found=filtered();
    app.querySelector('#study-count').textContent=`${found.length} of ${items.length} ${view==='mnemonics'?'memory cues':'items'}`;
    app.querySelector('#review-total').textContent=`(${review.size})`;
    list.innerHTML=found.length?topics.map(t=>{
      const group=found.filter(q=>q.topic===t);if(!group.length)return '';
      return `<section class="topic-section"><div class="topic-heading"><h2>${esc(t)}</h2><span>${group.length} ${group.length===1?'item':'items'}</span></div>${group.map(q=>{
        const open=revealed.has(q.number),marked=review.has(q.number);
        return `<article class="study-entry" id="study-item-${q.number}"><div class="entry-heading"><span class="entry-number">${String(q.number).padStart(2,'0')}</span><div class="entry-content"><p class="entry-question">${esc(q.question)}</p></div><button class="review-star ${marked?'marked':''}" data-review="${q.number}" aria-pressed="${marked}" aria-label="${marked?'Remove question':'Save question'} ${q.number} ${marked?'from':'for'} review later" title="Review later">${marked?'★':'☆'}</button></div>${view==='mnemonics'?`<div class="memory-cue"><span class="answer-label">MEMORY CUE</span><p>${esc(q.mnemonic)}</p><div class="cue-answer"><span>Remember:</span> ${esc(q.remember)}</div></div>`:`<div class="recall-section"><button class="reveal-answer" data-reveal="${q.number}" aria-expanded="${open}" aria-controls="answer-${q.number}">${open?'Hide answer':'Reveal answer'} <span aria-hidden="true">${open?'−':'+'}</span></button><div class="remember-answer" id="answer-${q.number}" ${open?'':'hidden'}><span class="answer-label">${view==='answers'?'ANSWER TO REMEMBER':'SOURCE ANSWER'}</span><p>${esc(view==='answers'?q.remember:q.answer)}</p></div></div>`}</article>`;
      }).join('')}</section>`;
    }).join(''):'<div class="empty-library"><h2>No items found.</h2><p>Choose another topic. Use the star beside any question to save it for review later.</p></div>';
    list.querySelectorAll('[data-review]').forEach(button=>button.onclick=()=>{
      const n=Number(button.dataset.review);review.has(n)?review.delete(n):review.add(n);
      try{localStorage.setItem('test9-study-review-v1',JSON.stringify([...review]));}catch{document.querySelector('#save-note').textContent='Review marks cannot be saved in this browser.';}
      paint();list.querySelector(`[data-review="${n}"]`)?.focus({preventScroll:true});
    });
    list.querySelectorAll('[data-reveal]').forEach(button=>button.onclick=()=>{
      const n=Number(button.dataset.reveal);revealed.has(n)?revealed.delete(n):revealed.add(n);
      paint();list.querySelector(`[data-reveal="${n}"]`)?.focus({preventScroll:true});
    });
    const toggle=app.querySelector('#toggle-answers');
    if(toggle)toggle.textContent=found.filter(q=>!q.missing).every(q=>revealed.has(q.number))&&found.some(q=>!q.missing)?'Hide answers':'Reveal answers';
  }
  app.querySelector('#study-topic').onchange=e=>{topic=e.target.value;paint();};
  app.querySelector('#only-review').onchange=e=>{onlyReview=e.target.checked;paint();};
  const toggle=app.querySelector('#toggle-answers');
  if(toggle)toggle.onclick=()=>{const found=filtered().filter(q=>!q.missing),hide=found.every(q=>revealed.has(q.number));found.forEach(q=>hide?revealed.delete(q.number):revealed.add(q.number));paint();};
  paint();
}
