# 堂測 DeskQuiz

A local web app for a Hong Kong student. Paste class notes written as `詞: 解釋` or `Term: meaning`, and it builds a short quiz from those lines. Every question cites the note line it came from. Nothing is sent to an AI API.

## Run

```bash
npm start
```

Then open http://127.0.0.1:4317

`npm test` checks the note parser and scoring without a browser.

Notes and scores are saved in `data/store.json` on this computer only.
