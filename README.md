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
- Complete guide: all 65 numbered items organized into seven topics, searchable with revealable answers.
- Review-later stars persist across library sections and reloads without changing quiz progress.
- Original PDFs are available in each library section. Items 13, 14, and 60 retain missing-figure notices; source ambiguities are labeled.
- Direct links: `#answers`, `#mnemonics`, `#guide`.
