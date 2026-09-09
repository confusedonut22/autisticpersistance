# autisticpersistance

Test 9 study app with 36 items extracted from the highlighted study packet.

- Practice: randomized batches of seven. Wrong answers must be corrected before advancing and then retried after the round until clean.
- Matching: submit the complete set; any mistake repeats the same entire batch until perfect.
- Independent progress saves in this browser. The final batch contains the one remaining item.
- The three topology pairs become individual questions. Highlighted source answers are preserved.

Serve this directory using any static web server. Run `npm test` to check mastery rules. Vercel needs no build command.

## Study library

- Answers to remember: 62 concise answers, with question context and optional hiding for recall.
- Mnemonics: 62 source memory cues, separate from the answer section.
- Complete guide: 62 answered items organized into seven topics with revealable answers; unanswered items 13, 14, and 60 are excluded.
- Review-later stars persist across library sections and reloads without changing quiz progress.
- Original PDFs are available in each library section. Search, lesson codes, and source-note callouts have been removed from the study screens.
- Direct links: `#answers`, `#mnemonics`, `#guide`.
- Remaining questions: 40 highlighted questions from the remaining practice PDF, using the existing seven-question correction/retry engine with independently saved progress. Direct link: `#remaining`.
