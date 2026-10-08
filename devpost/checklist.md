---
doc: checklist
status: approved
---

# Build Checklist

Build mode: fast

The build order was not reviewed by the learner. It is recorded as approved only so the autonomous brief could be implemented. Hands-on learner checks were not performed.

## Slices

- [x] **1. Paste notes and see a quiz made from those lines**
  Becomes usable: The sample enzyme notes turn into an on-screen quiz whose options come from the notes.
  Why now: This is the kernel. Scaffold, parser, page, and first quiz land together.
  PRD ref: `prd.md > Paste notes and generate`
  Spec ref: `spec.md > Note parser`, `spec.md > Question builder`, `spec.md > Page`
  Build: Add the Node server, quiz library, and the notes desk that can generate a quiz.
  Verify (mechanical): `npm test` passes. `POST /api/quizzes` with the sample notes returns at least 3 questions and does not include an answer key.
  Learner check: Open the app, press the sample button, generate, and see whether the first question is actually from those notes.
  Commit: `Add notes desk that builds a quiz from term lines`

- [x] **2. Submit answers and see the source line**
  Becomes usable: A finished attempt shows a score and the original note line for each item.
  Why now: A generated quiz that cannot be marked does not prove the study loop.
  PRD ref: `prd.md > Take the quiz`, `prd.md > Score against the note line`
  Spec ref: `spec.md > Scoring`
  Build: Add attempt submission, result review, and scoring tests.
  Verify (mechanical): A scripted perfect attempt scores full marks. A wrong choice scores zero on that item and the response includes `sourceText`.
  Learner check: Answer one question wrong on purpose and confirm the result quotes your note line.
  Commit: `Score attempts and show the note line`

- [x] **3. Saved quizzes survive a restart**
  Becomes usable: The side list still has the quiz after the server starts again, and opening it does not reveal answers.
  Why now: Persistence is the remaining check that the data model matches the page.
  PRD ref: `prd.md > Saved quizzes`
  Spec ref: `spec.md > Data Model`, `spec.md > HTTP server`
  Build: Store quizzes in `data/store.json` and list them on the page.
  Verify (mechanical): Create a quiz, request the list, restart the server, fetch the same id, and confirm `answer` is absent.
  Learner check: Refresh the page and open the saved quiz from the side list.
  Commit: `Keep quizzes in a local JSON file`

## Hands-on Checkpoints

- [ ] Early usable behavior explored — slice 1, not performed; no learner in this session
- [ ] Final kick-the-tires exploration and feedback completed — not performed

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: not done with a learner. An app map file will still be written so the code path is documented.
Route and stops: not walked with a learner.
Edit outcome: not applicable
Reflection: not offered; no learner in this session
Activity mode: recap

## Revisions

- Slices 1–3 were implemented in one pass — the session had no learner to pause between steps, and the parser, scoring, and JSON store landed in the same files. Mechanical checks still ran: `npm test`, a create call that hides the answer key, a restart that reloads the quiz, and a perfect attempt that scores 8/8.

