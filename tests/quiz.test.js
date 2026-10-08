"use strict";

const assert = require("assert");
const { parseFacts, buildQuestions, scoreAttempt, SAMPLE_NOTES } = require("../lib/quiz");

const facts = parseFacts(SAMPLE_NOTES);
assert.ok(facts.length >= 8, "expected at least 8 facts, got " + facts.length);
assert.ok(facts.some((fact) => fact.term === "酵素"));
assert.ok(facts.some((fact) => fact.term === "Enzyme"));
assert.ok(facts.every((fact) => fact.line > 0 && fact.raw));

const questions = buildQuestions(facts, 8, "test-seed");
assert.equal(questions.length, 8);
for (const question of questions) {
  assert.ok(question.options.length >= 2);
  assert.ok(question.answer >= 0 && question.answer < question.options.length);
  assert.equal(question.options[question.answer] !== undefined, true);
  assert.ok(question.sourceText.includes(question.term) || question.stem.length > 0);
}

const perfect = scoreAttempt(
  questions,
  questions.map((question) => ({ questionId: question.id, choice: question.answer }))
);
assert.equal(perfect.score, questions.length);

const missed = scoreAttempt(questions, [
  { questionId: questions[0].id, choice: (questions[0].answer + 1) % questions[0].options.length },
]);
assert.equal(missed.score, 0);
assert.equal(missed.detail[0].correct, false);
assert.ok(missed.detail[0].sourceText);

const thin = parseFacts("hello world\njust a sentence with no definitions");
assert.equal(thin.length, 0);

console.log(
  "quiz tests passed:",
  facts.length,
  "facts,",
  questions.length,
  "questions"
);
