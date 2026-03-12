# OpenApply

> **Open-source browser extension** — visit any job posting, get a tailored resume, cover letter & honest feedback in seconds. Autofill on supported ATS platforms (Greenhouse, Lever, Ashby, Workday…).

![Status](https://img.shields.io/badge/status-alpha-orange) ![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ Features

- 🌐 **Works on any job page** — Greenhouse, Lever, Workday, LinkedIn, Indeed, or any custom careers page
- 📄 **Tailored resume bullets** using your own skills/projects as RAG context
- ✉️ **Cover letter generation** — professional, personalized, one click
- 🎯 **Fit feedback** — keyword gap analysis, strengths, suggestions
- ⚡ **Autofill** — one-click form filling on supported ATS platforms
- 🔒 **100% local** — your data never leaves your machine
- 🤖 **Your keys** — Gemini, DeepSeek, Claude, or local Ollama

## 🚀 Quick Start

### 1. Extension

```bash
cd extension
npm install
npm run dev   # load unpacked from extension/dist in Chrome
```

### 2. Companion Service

```bash
cd companion
cp .env.example .env         # fill in your API key
pip install -r requirements.txt
python main.py               # runs on http://localhost:7523
```

### 3. Add your context files

Drop your own markdown files into `companion/rag/`:
```
companion/rag/
├── skills.md          # your tech stack
├── master_resume.md   # your full resume in markdown
└── projects/
    ├── project1.md    # project READMEs
    └── project2.md
```

### 4. Load the extension

1. Open Chrome → `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** → select `extension/dist`

## 🤖 LLM Providers

Set `LLM_PROVIDER` in `companion/.env`:

| Value | Provider | Key needed |
|---|---|---|
| `gemini` | Google Gemini | `GEMINI_API_KEY` |
| `deepseek` | DeepSeek | `DEEPSEEK_API_KEY` |
| `claude` | Anthropic Claude | `ANTHROPIC_API_KEY` |
| `local` | Ollama (local) | none — set `OLLAMA_MODEL` |

## 📁 Structure

```
openapply/
├── extension/       # Browser extension (Vite + React + TypeScript)
└── companion/       # Lightweight FastAPI companion service
    └── rag/         # Drop your markdown files here
```

## 🤝 Contributing

Adding a new ATS adapter is as simple as creating `extension/src/adapters/yourplatform.ts` and implementing the `ATSAdapter` interface. See `CONTRIBUTING.md`.

## License

MIT — do whatever you want.
