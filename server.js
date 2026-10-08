"use strict";

const fs = require("fs");
const path = require("path");
const http = require("http");
const { parseFacts, buildQuestions, publicQuestion, scoreAttempt, SAMPLE_NOTES } = require("./lib/quiz");

const PORT = Number(process.env.PORT || 4317);
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const STORE_PATH = path.join(ROOT, "data", "store.json");

function readStore() {
  try {
    const raw = fs.readFileSync(STORE_PATH, "utf8");
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.quizzes)) return { quizzes: [] };
    return data;
  } catch (error) {
    return { quizzes: [] };
  }
}

function writeStore(data) {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
}

function send(res, status, body, type) {
  const payload = Buffer.from(body);
  res.writeHead(status, {
    "Content-Type": type || "application/json; charset=utf-8",
    "Content-Length": payload.length,
    "Cache-Control": "no-store",
  });
  res.end(payload);
}

function sendJson(res, status, data) {
  send(res, status, JSON.stringify(data), "application/json; charset=utf-8");
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > 200000) {
        reject(new Error("Notes are too long."));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (!chunks.length) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch (error) {
        reject(new Error("Could not read that request."));
      }
    });
    req.on("error", reject);
  });
}

function summary(quiz) {
  const latest = quiz.attempts[quiz.attempts.length - 1];
  return {
    id: quiz.id,
    title: quiz.title,
    createdAt: quiz.createdAt,
    factCount: quiz.factCount,
    questionCount: quiz.questions.length,
    attempts: quiz.attempts.length,
    latestScore: latest ? latest.score : null,
    latestTotal: latest ? latest.total : null,
  };
}

function createQuiz(input) {
  const title = String(input.title || "").trim().slice(0, 80) || "未命名筆記 Untitled notes";
  const notes = String(input.notes || "").trim();
  if (notes.length < 20) {
    const error = new Error("Paste a bit more of your notes first.");
    error.status = 400;
    throw error;
  }
  const facts = parseFacts(notes);
  if (facts.length < 3) {
    const error = new Error(
      "Need at least 3 term lines. Write them like「酵素: 一種可以加快反應的蛋白質」or「Enzyme: a protein that speeds up a reaction」."
    );
    error.status = 400;
    throw error;
  }
  const requested = Number(input.questionCount || 8);
  const questionCount = Number.isFinite(requested) ? requested : 8;
  const questions = buildQuestions(facts, questionCount, title + "\n" + notes);
  if (questions.length < 3) {
    const error = new Error("Could not build a quiz from these notes.");
    error.status = 400;
    throw error;
  }
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    title,
    notes,
    createdAt: new Date().toISOString(),
    factCount: facts.length,
    questions,
    attempts: [],
  };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://127.0.0.1");
  try {
    if (req.method === "GET" && url.pathname === "/api/sample") {
      sendJson(res, 200, { title: "S4 Biology — Enzymes 酵素", notes: SAMPLE_NOTES });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/quizzes") {
      const store = readStore();
      sendJson(res, 200, { quizzes: store.quizzes.map(summary).reverse() });
      return;
    }

    const quizMatch = url.pathname.match(/^\/api\/quizzes\/([a-z0-9]+)$/);
    if (req.method === "GET" && quizMatch) {
      const store = readStore();
      const quiz = store.quizzes.find((item) => item.id === quizMatch[1]);
      if (!quiz) {
        sendJson(res, 404, { error: "Quiz not found." });
        return;
      }
      sendJson(res, 200, {
        ...summary(quiz),
        questions: quiz.questions.map(publicQuestion),
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/quizzes") {
      const body = await readBody(req);
      const quiz = createQuiz(body);
      const store = readStore();
      store.quizzes.push(quiz);
      writeStore(store);
      sendJson(res, 201, {
        ...summary(quiz),
        questions: quiz.questions.map(publicQuestion),
      });
      return;
    }

    const attemptMatch = url.pathname.match(/^\/api\/quizzes\/([a-z0-9]+)\/attempts$/);
    if (req.method === "POST" && attemptMatch) {
      const body = await readBody(req);
      const store = readStore();
      const quiz = store.quizzes.find((item) => item.id === attemptMatch[1]);
      if (!quiz) {
        sendJson(res, 404, { error: "Quiz not found." });
        return;
      }
      const result = scoreAttempt(quiz.questions, body.answers);
      const attempt = {
        at: new Date().toISOString(),
        score: result.score,
        total: result.total,
      };
      quiz.attempts.push(attempt);
      writeStore(store);
      sendJson(res, 200, { ...attempt, detail: result.detail });
      return;
    }

    if (req.method === "GET") {
      const requested = url.pathname === "/" ? "/index.html" : url.pathname;
      const filePath = path.normalize(path.join(PUBLIC_DIR, requested));
      if (!filePath.startsWith(PUBLIC_DIR)) {
        sendJson(res, 403, { error: "Forbidden." });
        return;
      }
      if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        sendJson(res, 404, { error: "Not found." });
        return;
      }
      const types = {
        ".html": "text/html; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".js": "text/javascript; charset=utf-8",
      };
      send(res, 200, fs.readFileSync(filePath), types[path.extname(filePath)] || "application/octet-stream");
      return;
    }

    sendJson(res, 405, { error: "Method not allowed." });
  } catch (error) {
    sendJson(res, error.status || 500, { error: error.message || "Something went wrong." });
  }
});

if (require.main === module) {
  server.listen(PORT, "127.0.0.1", () => {
    console.log("堂測 DeskQuiz is running at http://127.0.0.1:" + PORT);
  });
}

module.exports = { server, createQuiz };
