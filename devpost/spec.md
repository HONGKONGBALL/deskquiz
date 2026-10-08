---
doc: spec
status: approved
---

# 堂測 DeskQuiz — Technical Spec

Written from the delegated brief. The learner did not approve this blueprint in conversation. No paid API is required.

## How This Works, In Plain Language
A small Node program serves a single web page and stores quizzes in a JSON file. When notes are submitted, `lib/quiz.js` looks for lines shaped like `詞: 解釋`. It turns those pairs into multiple-choice questions and keeps the answer on the server until the quiz is submitted. The page never sends the notes anywhere except this computer.

## The Core Journey Through the System
The student opens `http://127.0.0.1:4317` → `public/index.html` loads. Sample notes come from `GET /api/sample`. Generate is `POST /api/quizzes` → `parseFacts` and `buildQuestions` → the quiz, without answers, is saved and returned. Each option click stays in the browser. Submit is `POST /api/quizzes/:id/attempts` → `scoreAttempt` compares choices to the stored key and appends the score. The side list is `GET /api/quizzes`.
PRD ref: `prd.md > The Core Journey`.

## Stack
- Node.js built-in `http`, `fs`, and `path` only. No npm dependencies.
- Docs: https://nodejs.org/api/http.html
- Rationale: the brief allows Node or static HTML, and a tiny server is what lets scores stay hidden until submit and survive a restart. The tradeoff is that the page is not a single double-clicked file.

## Where It Runs and How Someone Tries It
Local process. Node 20 is enough. No API key.
Start: `npm start`
Open: http://127.0.0.1:4317
Demo: load sample notes, generate, answer, submit, refresh, reopen the quiz.
A short demo video and a public GitHub repository are submission requirements. Deployment is optional and not set up. This session must not push or add a remote.

## Look and Feel
Carry-forward from `prd.md > Look and Feel`: paper `#f3ecdf`, card `#fffaf2`, ink `#1c1612`, chop red `#9e2a2b`, gold hover `#e7c56a`. Fonts: `"Noto Serif CJK TC"` and `"Alegreya"`, which exist on this machine, with `"Noto Sans CJK TC"` for UI text. Styling is plain CSS. No framework.

## Components

### Note parser
`parseFacts` in `lib/quiz.js` reads headings, `term: definition`, dash pairs, and a few copula patterns in Chinese and English. It drops duplicates.
PRD ref: `prd.md > Paste notes and generate`.

### Question builder
`buildQuestions` rotates three kinds: pick the term, pick the meaning, fill the blank. Distractors are other facts from the same notes. A seeded shuffle keeps a given note set stable.
PRD ref: `prd.md > Take the quiz`.

### Scoring
`scoreAttempt` compares submitted choice indexes to the stored answer and returns the source line.
PRD ref: `prd.md > Score against the note line`.

### HTTP server
`server.js` serves `public/` and the JSON API, and reads or writes `data/store.json`.
PRD ref: `prd.md > Saved quizzes`.

### Page
`public/index.html`, `public/styles.css`, and `public/app.js` are the desk, the quiz, the result, and the saved list.
PRD ref: `prd.md > Screens and Layout`.

## Data Model
`data/store.json`:
- `quizzes[]`: `id`, `title`, `notes`, `createdAt`, `factCount`, `questions[]`, `attempts[]`
- `questions[]`: `id`, `kind`, `prompt`, `stem`, `options`, `answer`, `sourceLine`, `sourceText`, `section`, `term`
- `attempts[]`: `at`, `score`, `total`
The answer index is stored on disk and omitted from `GET` and create responses. Restarting the server keeps the file.

## File Structure
```
learn-ai-basics/
├── package.json
├── server.js
├── lib/quiz.js
├── public/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── tests/quiz.test.js
├── data/store.json          # created at runtime, gitignored
├── devpost/                 # planning docs for the skill pack
├── scope.md                 # same text as devpost/scope.md
├── prd.md
├── spec.md
└── README.md
```

## External Services and Dependencies
None. No database, no hosting, no model API. Cost is zero. Rate limits do not apply.

## Important Failure Modes
- **Fewer than three term lines** → HTTP 400 and the format hint. No quiz is saved.
- **Request body over ~200KB** → the connection is closed and the error is reported.
- **Missing store file** → treated as an empty list and created on the next save.
- **Unknown quiz id** → HTTP 404.

## What Was Simplified and Why
- **Rule-based questions** instead of a language model — no key, and the kernel is the student's wording. A model would need network, cost, and a way to stop it inventing facts.
- **Multiple choice** instead of typed answers — Chinese spelling differences would need a grader this proof of concept does not have.
- **JSON file** instead of a database — one student, one computer.

## Decisions and Open Issues
- Local Node server, accepted in this brief as the way to run the app. Tradeoff: needs `npm start` rather than opening a file.
- Learner uncertainty was not identified; there was no interview. The open product question is whether the learner likes the wording and the paper-and-chop look.
- `6-ship` is not done: no demo video, no public repository, no learner-written submission.
