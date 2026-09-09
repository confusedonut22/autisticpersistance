export function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function createSession(ids) {
  return { order: shuffle(ids), offset: 0, round: [], index: 0, missed: [], attempts: [], corrected: false, phase: 'question', pass: 1, matches: {}, result: null };
}
export function batch(s) { return s.order.slice(s.offset, s.offset + 7); }
export function begin(s) {
  s.round = batch(s); s.index = 0; s.missed = []; s.attempts = []; s.corrected = false;
  s.phase = s.round.length ? 'question' : 'complete'; s.pass = 1; s.matches = {}; s.result = null;
}
export function answer(s, choice, correct) {
  if (s.phase !== 'question' || s.corrected || s.attempts.includes(choice)) return;
  s.attempts.push(choice);
  if (choice === correct) s.corrected = true;
  else if (!s.missed.includes(s.round[s.index])) s.missed.push(s.round[s.index]);
}
export function next(s) {
  if (s.phase !== 'question' || !s.corrected) return;
  s.index++; s.attempts = []; s.corrected = false;
  if (s.index === s.round.length) s.phase = s.missed.length ? 'retry' : 'passed';
}
export function continueQuiz(s) {
  if (s.phase === 'retry') {
    s.round = shuffle(s.missed); s.missed = []; s.index = 0; s.pass++; s.phase = 'question';
  } else if (s.phase === 'passed') { s.offset += batch(s).length; begin(s); }
}
export function submitMatches(s, correctAnswers) {
  if (s.result || !batch(s).every(id => typeof s.matches[id] === 'string' && s.matches[id])) return;
  s.result = batch(s).filter(id => s.matches[id] === correctAnswers[id]);
}
export function continueMatching(s) {
  if (!s.result) return;
  if (s.result.length === batch(s).length) { s.offset += batch(s).length; begin(s); }
  else { s.matches = {}; s.result = null; s.pass++; }
}
