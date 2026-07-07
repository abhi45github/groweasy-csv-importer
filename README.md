# GrowEasy — AI CSV → CRM Importer

> Upload **any** CSV — Facebook Lead Ads, Google Ads, an Excel export, a real-estate
> CRM dump, or a hand-made spreadsheet — and an LLM intelligently maps its columns
> into clean **GrowEasy CRM** records. The hard part isn't parsing CSV; it's
> understanding wildly different column names, layouts and messiness. That's what
> this app does.

<p align="center">
  <em>Next.js frontend · Express + TypeScript backend · provider-agnostic LLM extraction (Gemini / OpenAI / Claude) with a deterministic fallback</em>
</p>

---

## 🔗 Live demo & submission

| | |
|---|---|
| **Live app** | `<add your Vercel URL here>` |
| **Backend API** | `<add your Render/Railway URL here>` |
| **Repository** | `<add your GitHub URL here>` |
| **Position** | Software Developer (Intern / Full-Time) |

> ⚠️ **To enable real AI extraction**, set an LLM API key (see [Configuration](#-configuration)).
> Without a key the app still works end-to-end using a built-in **heuristic mapper**,
> so the demo never breaks — but the LLM path is where the intelligent mapping shines.

---

## ✨ What it does

A guided, four-step flow:

1. **Upload** — drag & drop or browse for a CSV (or click a bundled sample).
2. **Preview** — the file is parsed and shown in a virtualized table with sticky
   headers and horizontal/vertical scroll. **Nothing is sent to the AI yet.**
3. **Extract** — on **Confirm**, the CSV is streamed to the backend, which batches
   the rows to an LLM and shows **live progress** (batch-by-batch counts).
4. **Results** — the extracted CRM records render in a second table, with totals
   (imported / skipped / rate), skipped-row explanations, and **CSV / JSON export**.

### CRM schema produced

`created_at · name · email · country_code · mobile_without_country_code · company ·
city · state · country · lead_owner · crm_status · crm_note · data_source ·
possession_time · description`

The AI follows the assignment's rules precisely:

- `crm_status` ∈ `GOOD_LEAD_FOLLOW_UP · DID_NOT_CONNECT · BAD_LEAD · SALE_DONE` (else blank)
- `data_source` ∈ `leads_on_demand · meridian_tower · eden_park · varah_swamy · sarjapur_plots` (else blank)
- `created_at` is always `new Date()`-parseable
- multiple emails/phones → first is used, the rest are folded into `crm_note`
- country code is split from the mobile number
- values are CSV-safe (newlines escaped as `\n`)
- **a row with neither email nor mobile is skipped** (and reported)

---

## 🧠 How the AI extraction works

```
CSV ──▶ parse (Papa) ──▶ batch rows ──▶ LLM (JSON mode) ──▶ validate (Zod)
                                     │                          │
                                     │        on failure/timeout▼
                                     └────────▶ heuristic mapper (rule-based)
                                                                │
                                                                ▼
                                              normalize · enforce CRM rules · skip
                                                                │
                                                                ▼
                                                    { records, skipped, summary }
```

**Prompt engineering** ([`backend/src/services/ai/prompt.ts`](backend/src/services/ai/prompt.ts))
- A strict system prompt describes the target schema, closed value-sets with
  **synonym guidance** (e.g. "no answer / busy / switched off → `DID_NOT_CONNECT`"),
  contact-splitting rules, and CSV-safety rules.
- The model must return **exactly one record per input row, in order** — this makes
  row alignment deterministic, so skip-logic and row-number tracking are reliable.
- JSON is *forced*: Gemini `responseMimeType`, OpenAI `response_format: json_object`,
  Claude assistant-prefill.

**Batching & resilience** ([`extractor.ts`](backend/src/services/ai/extractor.ts))
- Rows are chunked (`AI_BATCH_SIZE`, default 25) and processed with bounded
  concurrency (`AI_CONCURRENCY`).
- Each batch retries with **exponential backoff + jitter** on transient errors
  (429 / 5xx / network).
- If a batch permanently fails (or the model returns malformed JSON / the wrong
  row count), that batch **falls back to the heuristic mapper** so no data is lost.
- Progress is streamed to the UI as newline-delimited JSON.

**Deterministic safety net** ([`fallbackMapper.ts`](backend/src/services/ai/fallbackMapper.ts))
- Fuzzy header matching (handles plurals/glued names), split first/last-name
  combination, and keyword-based status/source classification — so the product
  works **with zero API keys**.

**Normalization** ([`normalize.ts`](backend/src/services/crm/normalize.ts))
- The final, authoritative layer: enforces the closed value-sets, splits country
  codes, folds extra contacts into notes, validates dates, escapes newlines, and
  applies the skip rule — regardless of whether the AI or the fallback produced
  the record.

---

## 🏗️ Architecture

```
Software Developer/
├── backend/                 # Express + TypeScript API
│   ├── src/
│   │   ├── app.ts           # Express app factory (helmet, cors, routes)
│   │   ├── index.ts         # server bootstrap + graceful shutdown
│   │   ├── config/env.ts    # validated, typed configuration
│   │   ├── routes/          # /api/health, /api/config, /api/import[/stream]
│   │   ├── controllers/     # request handling + NDJSON streaming
│   │   ├── middleware/      # multipart upload, error handler
│   │   ├── services/
│   │   │   ├── csv/         # robust CSV parsing
│   │   │   ├── ai/          # providers, prompt, extractor, fallback
│   │   │   └── crm/         # Zod schema + normalization/skip rules
│   │   ├── types/           # CRM + API contracts
│   │   └── utils/           # logger, retry, concurrency, errors
│   └── tests/               # Vitest unit + supertest integration (49 tests)
│
├── frontend/                # Next.js 14 (App Router) + Tailwind + Framer Motion
│   ├── app/                 # layout, page (state machine), global styles
│   ├── components/          # dropzone, tables (virtualized), stepper, results…
│   └── lib/                 # api client (stream reader), csv, types, samples
│
├── sample-data/             # diverse messy CSVs to try
├── docker-compose.yml       # full stack in one command
└── README.md
```

---

## 🧰 Tech stack

| Layer | Choices |
|---|---|
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS, Framer Motion, TanStack Virtual, react-dropzone |
| **Backend** | Node.js, Express, TypeScript, Zod, Multer, Papa Parse, Helmet |
| **AI** | Google Gemini · OpenAI · Anthropic Claude (auto-detected), native `fetch` adapters |
| **Testing** | Vitest + Supertest |
| **Tooling** | Docker, Docker Compose |

---

## 🚀 Getting started (local)

**Prerequisites:** Node.js ≥ 18, npm. (An LLM API key is optional.)

```bash
# 1) Install dependencies for both apps
npm run install:all          # or: cd backend && npm i ; cd ../frontend && npm i

# 2) (optional) configure an LLM key for the backend
cp backend/.env.example backend/.env
#   → set GEMINI_API_KEY (or OPENAI_API_KEY / ANTHROPIC_API_KEY)

# 3) run the backend  (http://localhost:4000)
npm run dev:backend

# 4) in a second terminal, run the frontend  (http://localhost:3000)
npm run dev:frontend
```

Open **http://localhost:3000** and try a bundled sample or upload your own CSV.

> The frontend reads the backend URL from `NEXT_PUBLIC_API_BASE_URL`
> (defaults to `http://localhost:4000`). To override, create `frontend/.env.local`.

---

## 🔌 API reference

Base URL: `http://localhost:4000`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Liveness probe |
| `GET` | `/api/config` | CRM fields, allowed values, limits, active provider |
| `POST` | `/api/import` | One-shot import → full JSON result |
| `POST` | `/api/import/stream` | Streaming import → NDJSON `meta`→`progress`*→`result` |

Both import endpoints accept a **multipart** upload (field `file`) **or** JSON `{ "csv": "..." }`.

```bash
# multipart
curl -F "file=@sample-data/facebook-lead-export.csv" http://localhost:4000/api/import

# inline JSON
curl -X POST http://localhost:4000/api/import \
  -H "Content-Type: application/json" \
  -d '{"csv":"name,email\nJohn,john@x.com"}'
```

**Response shape**

```jsonc
{
  "success": true,
  "provider": { "name": "gemini", "model": "gemini-2.0-flash", "heuristic": false },
  "summary": {
    "totalRows": 6, "totalRowsInFile": 6,
    "imported": 5, "skipped": 1,
    "batches": 1, "failedBatches": 0, "truncated": false
  },
  "fields": ["created_at", "name", "email", "..."],
  "records": [ { "rowNumber": 1, "name": "John Doe", "email": "...", "...": "..." } ],
  "skipped": [ { "rowNumber": 6, "reason": "missing_email_and_mobile", "message": "...", "raw": {} } ]
}
```

---

## ⚙️ Configuration

Backend environment variables (see [`backend/.env.example`](backend/.env.example)):

| Variable | Default | Description |
|---|---|---|
| `PORT` | `4000` | API port |
| `CORS_ORIGIN` | `*` | Allowed frontend origin(s), comma-separated |
| `AI_PROVIDER` | `auto` | `auto` \| `gemini` \| `openai` \| `anthropic` |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | – / `gemini-2.0-flash` | Google Gemini |
| `OPENAI_API_KEY` / `OPENAI_MODEL` | – / `gpt-4o-mini` | OpenAI |
| `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` | – / `claude-3-5-haiku-latest` | Anthropic |
| `AI_BATCH_SIZE` | `25` | Rows per LLM request |
| `AI_CONCURRENCY` | `3` | Concurrent batches |
| `AI_MAX_RETRIES` | `3` | Retries per failed batch |
| `MAX_ROWS` | `5000` | Row cap per upload |
| `MAX_UPLOAD_MB` | `10` | Upload size cap |

Frontend: `NEXT_PUBLIC_API_BASE_URL` (backend base URL).

`AI_PROVIDER=auto` picks the first provider whose key is present (Gemini → OpenAI → Anthropic).
**With no key set, extraction uses the deterministic heuristic mapper.**

---

## 🧪 Testing

```bash
cd backend
npm test            # 49 unit + integration tests (Vitest + Supertest)
```

Covers CSV parsing edge cases, CRM normalization & skip rules, the heuristic
mapper, the batching/retry/fallback extractor (with mocked providers), and the
HTTP API. Tests run fully offline (no real LLM calls).

---

## 🐳 Docker

```bash
cp .env.example .env      # optionally add an LLM key
docker compose up --build
# frontend → http://localhost:3000   backend → http://localhost:4000
```

Each app also ships a standalone multi-stage `Dockerfile`.

---

## ☁️ Deployment

**Frontend → Vercel**
1. Import the repo, set the project root to `frontend/`.
2. Add env var `NEXT_PUBLIC_API_BASE_URL = https://<your-backend-url>`.
3. Deploy (framework auto-detected as Next.js).

**Backend → Render / Railway**
1. New Web Service from the repo, root `backend/`.
2. Build `npm install && npm run build`, start `npm start`.
3. Add `GEMINI_API_KEY` (or another provider key) and
   `CORS_ORIGIN = https://<your-vercel-url>`.

---

## 📁 Sample data

The [`sample-data/`](sample-data/) folder (and the in-app "try a sample" cards)
include deliberately diverse files to showcase the mapping:

- `facebook-lead-export.csv` — ISO timestamps, campaign names, `+CC` phones
- `google-ads-export.csv` — split first/last name, international numbers
- `real-estate-crm.csv` — projects, possession dates, alternate numbers, remarks
- `messy-marketing-sheet.csv` — multiple emails/phones, invalid & empty rows, odd headers

---

## ✅ Assignment coverage

| Requirement | Status |
|---|---|
| Upload (drag & drop + file picker) | ✅ |
| Preview table (sticky headers, H/V scroll, responsive, virtualized) | ✅ |
| Confirm before any AI processing | ✅ |
| Results table with imported / skipped / totals | ✅ |
| Accept any CSV, no fixed columns | ✅ |
| Batched AI extraction → structured JSON | ✅ |
| Intelligent field mapping & messy-data handling | ✅ |
| Closed value-sets, date validity, contact folding, skip rule | ✅ |
| **Bonus:** drag & drop, progress indicators, streaming, retry, virtualized tables, dark mode, unit tests, Docker, deployment-ready, README | ✅ |

---

<p align="center"><sub>Built for the GrowEasy Software Developer assignment.</sub></p>
