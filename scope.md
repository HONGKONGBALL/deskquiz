---
doc: scope
status: approved
---

# 堂測 DeskQuiz

A local page that turns a Hong Kong student's own class notes into a quiz they can take immediately.

This scope was written from the delegated brief (a notes-to-quiz app for a Hong Kong student), not from a live `2-scope` interview. The learner did not say "looks good" in this session.

## The Unique Kernel
The quiz is built only from lines the student already wrote, like `酵素: 一種蛋白質…` or `Enzyme: a protein…`, and every question shows the exact note line it came from. It is not a chatbot and it does not invent facts from a model.

## Who It's For
A Hong Kong secondary student revising from messy bilingual class notes, who today re-reads the page or highlights it and still cannot tell what they remember.

## The Core Loop
They paste today's notes, generate a short quiz, answer it, and see which terms they missed next to the original line.

## Inspiration & Identity
A classroom desk, not a generic purple AI product: cream paper, black rules, a red chop mark, and Traditional Chinese with English beside it. Type is Noto Serif CJK TC and Alegreya, which are already on this machine.

## Why This Matters to the Learner
The brief asked for something a Hong Kong student can use on class notes. Personal wording beyond that was not collected.

## What "Working" Looks Like
Open the page, load the sample S4 enzyme notes or paste real notes, get at least a few multiple-choice items, submit, and see a score plus the source line for each item. That moment is the demo.

## The POC Boundary
One local web app. Paste notes, generate, take, score, and reopen a saved quiz. Sample notes are included so it runs with no typing. Parsing is local.

## Later
Export, spaced repetition, accounts, and a teacher view.

## Explicitly Cut
- Cloud or paid AI question generation — no API key, and the kernel is "from your notes," not "from a model."
- Login and sharing — not needed to prove the loop.
- Handwritten photo OCR — the proof of concept starts from text the student can paste.
- Public hosting — a local server is enough to record a demo.
