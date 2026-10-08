---
doc: prd
status: approved
---

# 堂測 DeskQuiz — Product Requirements

A local study quiz for a Hong Kong student, made from their class notes.
Source: `scope.md > The Unique Kernel`. Written from the delegated brief without a live product interview.

## The Core Journey
1. The student opens the page and sees a notes desk plus an empty list of past quizzes.
2. They type a title and paste notes, or press the button that fills the sample enzyme notes.
3. They choose how many questions (3–12) and press generate.
4. If the notes do not contain at least three `term: meaning` lines, they see a short error telling them the expected shape. Nothing else changes.
5. Otherwise a quiz opens on the first question. The stem is a meaning, a term, or a line with a blank. Options are other terms or meanings from the same notes.
6. They pick an option, move forward and back, and submit on the last question.
7. They see a score and, for each item, whether it was right, the note's answer if they missed it, and the source line.
8. The quiz stays in the side list. Opening it starts a fresh attempt. Scores from the latest attempt show in the list.

## Screens and Layout
One page. Top: name and a one-sentence explanation. Left column: notes desk, then the quiz or the result. Right column: saved quizzes. On a narrow window the columns stack.

## Look and Feel
Cream paper (`#f3ecdf`), warm card, black 2px border, offset black shadow, red chop with the character 測. Headlines in Noto Serif CJK TC. English name in Alegreya italic. Buttons are plain, with a gold hover. No gradient, no purple, no chat bubbles. Interface copy is Traditional Chinese with a short English gloss.

## Features and Behavior

### Paste notes and generate
The desk has a title, a notes box, a question count, a sample button, and generate.
- [ ] Acceptance criterion — sample button fills the title and the enzyme notes.
- [ ] Acceptance criterion — generate with those notes opens a quiz of the requested length, at most 12, and at least 3.
- [ ] Acceptance criterion — notes without three term lines show the format hint and do not create a quiz.

### Take the quiz
One question at a time. Choosing an option highlights it. Previous and next work. The last step submits.
- [ ] Acceptance criterion — the student can change an answer before submit.
- [ ] Acceptance criterion — unanswered questions count as wrong, not as a crash.

### Score against the note line
- [ ] Acceptance criterion — the result shows `score / total`.
- [ ] Acceptance criterion — a miss shows the note's answer and the original line with its line number.
- [ ] Acceptance criterion — a perfect set of answers scores full marks.

### Saved quizzes
- [ ] Acceptance criterion — after generate, the quiz appears in the side list with its title, fact count, and latest score.
- [ ] Acceptance criterion — choosing it opens the same questions again without showing the answer key first.
- [ ] Acceptance criterion — refreshing the page keeps the list. Data stays on this computer.

## States and Boundaries
- **First use** — the saved list says there is no quiz yet.
- **Empty or thin notes** — the error under the button explains the `詞: 解釋` shape.
- **Notes too long** — the server refuses bodies over about 200KB.
- **What persists** — title, notes, questions, answer key, and attempt scores in `data/store.json`.
- **What the taker sees** — options only, until submit.

## Product Decisions
- Questions come from the student's lines, not a language model — that is the brief's app, and there is no API key.
- Traditional Chinese first, English kept on the same screen — the user is a Hong Kong student and notes are often mixed.
- One page rather than a multi-step wizard — the loop has to be visible in a one-minute demo.
- These choices were made by the agent from the brief because the learner was not in the session.

## What We're Building
Paste, sample notes, local quiz generation, take, score with source lines, and a saved list that survives restart.

## Deferred From the POC
Accounts, sharing a quiz with a classmate, and photo import of handwritten notes. They do not prove that pasted notes can become a checkable quiz.

## Possible Later Enhancements
Spaced repetition across days, and an export of missed terms.

## Non-Goals
- Calling a paid or hosted AI API to write questions.
- Marking free-typed Chinese answers. Options keep the proof of concept checkable.
- A native mobile app.

## Open Questions
None that block the proof of concept. Learner review of wording and visual taste is still open because no review happened.
