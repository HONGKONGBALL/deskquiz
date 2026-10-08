"use strict";

const STOP = new Set(
  "a an the of to and or in on for with from by as is are was were be this that these those it its their your our into over under about not no yes 的 了 和 與 与 在 是 把 被 就 也 都 很 一個 一个 一種 一种".split(
    /\s+/
  )
);

function clean(value) {
  return String(value || "")
    .replace(/^[-*•]\s+/, "")
    .replace(/\s+/g, " ")
    .replace(/[。.!?？；;]+$/g, "")
    .trim();
}

function parseFacts(notes) {
  const lines = String(notes || "").replace(/\r\n/g, "\n").split("\n");
  const facts = [];
  const seen = new Set();
  let section = "筆記 Notes";

  lines.forEach((raw, index) => {
    const line = raw.trim();
    if (!line || line.length < 4) return;

    const markdownHeading = line.match(/^#{1,3}\s+(.+)$/);
    const numberedHeading = line.match(
      /^[（(]?[0-9一二三四五六七八九十]{1,3}[)）.、]\s*(.{2,48})$/
    );
    const looksLikeFact =
      /[:：]/.test(line) ||
      /\s[—–-]\s/.test(line) ||
      /\s(是|指|稱為|叫做|means|is defined as)\s/i.test(line);

    if ((markdownHeading || numberedHeading) && !looksLikeFact && line.length < 80) {
      section = clean((markdownHeading && markdownHeading[1]) || numberedHeading[1]);
      return;
    }

    let term = "";
    let definition = "";
    const colon = line.match(/^(.{2,60}?)\s*[:：]\s*(.{6,})$/);
    const dash = line.match(/^(.{2,60}?)\s+[—–-]\s+(.{6,})$/);
    const copula = line.match(
      /^(.{2,48}?)\s+(是|指|稱為|叫做|means|is defined as|refers to)\s+(.{6,})$/i
    );

    if (colon) {
      term = clean(colon[1]);
      definition = clean(colon[2]);
    } else if (dash && !/^\d{1,4}$/.test(clean(dash[1]))) {
      term = clean(dash[1]);
      definition = clean(dash[2]);
    } else if (copula) {
      term = clean(copula[1]);
      definition = clean(copula[3]);
    }

    if (!term || !definition) return;
    if (term.length > 60 || definition.length < 6) return;
    if (STOP.has(term.toLowerCase())) return;

    const key = term.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);

    facts.push({
      term,
      definition,
      section,
      line: index + 1,
      raw: line,
    });
  });

  return facts;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(value) {
  let h = 2166136261;
  const text = String(value);
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function shuffle(list, random) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

function pickDistractors(facts, correct, field, count, random) {
  const pool = facts.filter((fact) => fact !== correct && fact[field] !== correct[field]);
  return shuffle(pool, random).slice(0, count);
}

function buildQuestions(facts, questionCount, seedText) {
  const random = mulberry32(hashString(seedText || facts.map((f) => f.term).join("|")));
  const kinds = ["recall-term", "recall-meaning", "cloze"];
  const questions = [];
  const target = Math.max(1, Math.min(questionCount || 8, facts.length * 2, 12));
  let cursor = 0;

  while (questions.length < target) {
    const fact = facts[cursor % facts.length];
    const kind = kinds[questions.length % kinds.length];
    const optionCount = Math.min(4, facts.length);
    const built = makeQuestion(kind, fact, facts, optionCount, random, questions.length + 1);
    if (built) questions.push(built);
    cursor += 1;
    if (cursor > facts.length * kinds.length + 2) break;
  }

  return questions;
}

function makeQuestion(kind, fact, facts, optionCount, random, number) {
  const distractorField = kind === "recall-meaning" ? "definition" : "term";
  const correctValue = kind === "recall-meaning" ? fact.definition : fact.term;
  const distractors = pickDistractors(
    facts,
    fact,
    distractorField,
    optionCount - 1,
    random
  );
  if (distractors.length < 1) return null;

  const options = shuffle(
    [correctValue].concat(distractors.map((item) => item[distractorField])),
    random
  );
  const answer = options.indexOf(correctValue);

  if (kind === "recall-term") {
    return {
      id: "q" + number,
      kind,
      prompt: "這句筆記在講哪個詞？ Which term is this?",
      stem: fact.definition,
      options,
      answer,
      sourceLine: fact.line,
      sourceText: fact.raw,
      section: fact.section,
      term: fact.term,
    };
  }

  if (kind === "recall-meaning") {
    return {
      id: "q" + number,
      kind,
      prompt: "根據你的筆記，這個詞是什麼意思？ What do your notes say?",
      stem: fact.term,
      options,
      answer,
      sourceLine: fact.line,
      sourceText: fact.raw,
      section: fact.section,
      term: fact.term,
    };
  }

  const blanked = fact.raw.replace(fact.term, "______");
  return {
    id: "q" + number,
    kind: "cloze",
    prompt: "填回你寫過的詞。 Fill the blank from your notes.",
    stem: blanked === fact.raw ? "______ — " + fact.definition : blanked,
    options,
    answer,
    sourceLine: fact.line,
    sourceText: fact.raw,
    section: fact.section,
    term: fact.term,
  };
}

function publicQuestion(question) {
  return {
    id: question.id,
    kind: question.kind,
    prompt: question.prompt,
    stem: question.stem,
    options: question.options,
    section: question.section,
  };
}

function scoreAttempt(questions, answers) {
  const byId = new Map((answers || []).map((item) => [item.questionId, item.choice]));
  const detail = questions.map((question) => {
    const choice = byId.has(question.id) ? byId.get(question.id) : null;
    const correct = choice === question.answer;
    return {
      questionId: question.id,
      correct,
      choice,
      answer: question.answer,
      answerText: question.options[question.answer],
      sourceLine: question.sourceLine,
      sourceText: question.sourceText,
      section: question.section,
      term: question.term,
      stem: question.stem,
      options: question.options,
    };
  });
  const score = detail.filter((item) => item.correct).length;
  return { score, total: questions.length, detail };
}

const SAMPLE_NOTES = `# S4 Biology — Enzymes 酵素
Miss Chan · 8 Oct 2026

酵素: 一種蛋白質，可以加快化學反應，本身不會被用掉。
Enzyme: a protein that speeds up a chemical reaction and is not used up.
活性部位: 酵素表面跟底物結合的位置。
Active site: the region of an enzyme where the substrate binds.
底物: 被酵素作用的物質。
Denaturation: 高溫或極端 pH 改變酵素形狀，活性部位不再配合底物。
最適溫度: 人體酵素活性最高的溫度大約是 37°C。
Lock and key: 底物形狀必須配合活性部位，好像鎖和鑰匙。

# 小測提醒
對照組: 沒有酵素的實驗組，用來比較反應有沒有變快。
`;

module.exports = {
  parseFacts,
  buildQuestions,
  publicQuestion,
  scoreAttempt,
  SAMPLE_NOTES,
};
