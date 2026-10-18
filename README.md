# إيماء · Imaa

Cross-dialect sign-language bridge for the Saudi market: **PSL + ArSL →
Arabic / English / Urdu**, starting with 50 universal medical and government
signs.

Built clean-room. No Ishara-AI code, no third-party sign videos, no borrowed brand.

## What this is

A working backend with a tested safety core, plus a trilingual result card.

```
backend/
  app/main.py            FastAPI: /health, /translate, /ws/stream
  app/services/features.py   vectorised 194-dim anchor+shape features
  app/services/gate.py       conformal abstention gate (fail-closed)
  db/schema.sql          governance enforced as DB constraints
  tests/                 10 passing tests
docs/
  ARCHITECTURE.md        ADRs — including what we deliberately did differently
  SIGNS_50.md            50 signs x ar/en/ur x speech-act class
  DATASET_PLAN.md        signer-disjoint splits, consent, licensing
  ROADMAP.md             4 phases, 16 weeks
frontend/
  app/page.tsx           trilingual card, real RTL
```

## Why it is not a repeat of the audit

| Ishara-AI defect | Imaa design |
|---|---|
| `numpy`/`mediapipe` commented out of requirements → engine silently a stub | deps declared; ONNX path; health reports the real engine |
| Frames "never stored" in docs, but every capture written to disk and ~37 `.npz` committed publicly | no persistence in the request path; `**/captures/` and `**/*.npz` gitignored |
| `tau=0.55` hardcoded while spec said `<TBD>` | conformal gate fitted per release; unfitted gate **raises** |
| `reliability='reliable'` settable with no reviewer | `CHECK (reliable ⇒ verified_by AND verified_on)` |
| Sign enableable while still a candidate | `CHECK (is_enabled ⇒ reliable)` — both proven to reject |
| 0 tests, 0 trials | 10 tests now; trials protocol in Roadmap |
| 398 ms/decision (pure-Python DTW) | vectorised features, ONNX classifier |

## Verify

```bash
make verify     # backend tests + frontend typecheck + production build
make smoke      # headless-Chrome functional test of the built kiosk UI
```

One command, one exit code. Everything below is wired into it.

## Run it

```bash
cd backend
python3 -m venv .venv && . .venv/bin/activate
pip install fastapi numpy pytest pydantic pydantic-settings
PYTHONPATH=. python -m pytest tests/ -q          # 10 passed
PYTHONPATH=. uvicorn app.main:app --port 8101    # /docs
```

```bash
createdb imaa_db
psql -d imaa_db -f backend/db/schema.sql
psql -d imaa_db -c "select * from v_release_readiness;"   # BLOCKED until content is signed off
```

## Honest status

The classifier is **not trained yet**. `/translate` returns a fixed
`CHEST_PAIN` payload and `/ws/stream` acknowledges frames — both are interface
contracts, clearly labelled, not claims of recognition. Phase 1 in
`docs/ROADMAP.md` is where the model becomes real.

This label matters: the audit's central finding was that a stub was reachable
in the shipped path while the README claimed recognition. Imaa's stub says it
is a stub, in the response, in the health check, and here.
