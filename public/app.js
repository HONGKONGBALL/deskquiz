"use strict";

const $ = (id) => document.getElementById(id);

const state = {
  quiz: null,
  index: 0,
  choices: {},
};

function show(id, visible) {
  $(id).hidden = !visible;
}

async function api(path, options) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

function setError(message) {
  const node = $("form-error");
  node.hidden = !message;
  node.textContent = message || "";
}

async function loadSaved() {
  const data = await api("/api/quizzes");
  const list = $("saved-list");
  list.innerHTML = "";
  if (!data.quizzes.length) {
    const item = document.createElement("li");
    item.className = "empty";
    item.textContent = "還沒有小測。貼上筆記再生成。";
    list.appendChild(item);
    return;
  }
  data.quizzes.forEach((quiz) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    const score =
      quiz.latestScore === null ? "未做" : quiz.latestScore + "/" + quiz.latestTotal;
    button.innerHTML =
      "<strong></strong><small></small>";
    button.querySelector("strong").textContent = quiz.title;
    button.querySelector("small").textContent =
      quiz.factCount + " 個詞 · " + quiz.questionCount + " 題 · 最近 " + score;
    button.addEventListener("click", () => openQuiz(quiz.id));
    item.appendChild(button);
    list.appendChild(item);
  });
}

function renderQuestion() {
  const quiz = state.quiz;
  const question = quiz.questions[state.index];
  $("quiz-title").textContent = quiz.title;
  $("progress").textContent = state.index + 1 + " / " + quiz.questions.length;
  $("prompt").textContent = question.prompt;
  $("stem").textContent = question.stem;
  const box = $("options");
  box.innerHTML = "";
  question.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = option;
    if (state.choices[question.id] === index) button.classList.add("selected");
    button.addEventListener("click", () => {
      state.choices[question.id] = index;
      renderQuestion();
    });
    box.appendChild(button);
  });
  $("prev-btn").disabled = state.index === 0;
  $("next-btn").textContent =
    state.index === quiz.questions.length - 1 ? "交卷 Submit" : "下一題";
}

async function openQuiz(id) {
  state.quiz = await api("/api/quizzes/" + id);
  state.index = 0;
  state.choices = {};
  setError("");
  show("quiz", true);
  show("result", false);
  renderQuestion();
  $("quiz").scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderResult(result) {
  show("quiz", false);
  show("result", true);
  $("score").textContent = result.score + " / " + result.total;
  const review = $("review");
  review.innerHTML = "";
  result.detail.forEach((item, index) => {
    const li = document.createElement("li");
    const title = document.createElement("strong");
    title.className = item.correct ? "ok" : "bad";
    title.textContent =
      (item.correct ? "對" : "錯") + " · 第 " + (index + 1) + " 題 · " + item.term;
    const picked = document.createElement("div");
    const choiceText =
      item.choice === null || item.choice === undefined
        ? "未作答"
        : item.options[item.choice];
    picked.textContent = "你的答案: " + choiceText;
    if (!item.correct) {
      const right = document.createElement("div");
      right.textContent = "筆記答案: " + item.answerText;
      li.appendChild(title);
      li.appendChild(picked);
      li.appendChild(right);
    } else {
      li.appendChild(title);
      li.appendChild(picked);
    }
    const source = document.createElement("span");
    source.className = "source";
    source.textContent = "第 " + item.sourceLine + " 行 · " + item.sourceText;
    li.appendChild(source);
    review.appendChild(li);
  });
}

$("sample-btn").addEventListener("click", async () => {
  const sample = await api("/api/sample");
  $("title").value = sample.title;
  $("notes").value = sample.notes;
  setError("");
});

$("make-btn").addEventListener("click", async () => {
  setError("");
  $("make-btn").disabled = true;
  try {
    const quiz = await api("/api/quizzes", {
      method: "POST",
      body: JSON.stringify({
        title: $("title").value,
        notes: $("notes").value,
        questionCount: Number($("count").value),
      }),
    });
    await loadSaved();
    await openQuiz(quiz.id);
  } catch (error) {
    setError(error.message);
  } finally {
    $("make-btn").disabled = false;
  }
});

$("prev-btn").addEventListener("click", () => {
  if (state.index > 0) {
    state.index -= 1;
    renderQuestion();
  }
});

$("next-btn").addEventListener("click", async () => {
  if (state.index < state.quiz.questions.length - 1) {
    state.index += 1;
    renderQuestion();
    return;
  }
  const answers = state.quiz.questions.map((question) => ({
    questionId: question.id,
    choice: Object.prototype.hasOwnProperty.call(state.choices, question.id)
      ? state.choices[question.id]
      : null,
  }));
  const result = await api("/api/quizzes/" + state.quiz.id + "/attempts", {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
  await loadSaved();
  renderResult(result);
});

$("retry-btn").addEventListener("click", () => {
  if (state.quiz) openQuiz(state.quiz.id);
});

$("back-btn").addEventListener("click", () => {
  show("result", false);
  show("quiz", false);
  $("desk").scrollIntoView({ behavior: "smooth" });
});

loadSaved().catch((error) => setError(error.message));
