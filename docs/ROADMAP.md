# إيماء (Imaa) — Build Roadmap

## Phase 0 — Foundation (done in this scaffold)
- [x] Clean-room repo, no Ishara-AI code, no third-party media
- [x] FastAPI service: `/health`, `/translate`, `/ws/stream`
- [x] Vectorised feature layer (194-dim anchor+shape, translation/scale invariant)
- [x] Conformal abstention gate with fail-closed semantics
- [x] **10 passing tests** covering the safety property
- [x] Postgres schema with reviewer/enablement constraints proven to reject
      the exact violations Ishara-AI's schema allowed
- [x] 50-sign trilingual vocabulary (ar/en/ur) with speech-act classes

## Phase 1 — Real model (weeks 1–4)
- [ ] Ingest PakSign + one ArSL corpus via `scripts/ingest_dataset.py`
- [ ] Train ST-GCN baseline, signer-disjoint split
- [ ] Export ONNX, wire `services/engine.py` to ONNX Runtime
- [ ] Freeze first calibration release (alpha=0.05) and store `qhat`
- [ ] Publish first honest metrics sheet (accuracy + abstain + wrong-accept)

## Phase 2 — Product vocabulary (weeks 5–10)
- [ ] Record 8 signers x 50 signs x 10 reps (both dialects)
- [ ] Retrain on signer-disjoint split; target ≥90% top-1 on unseen signers
- [ ] Template library: 50 signs x 3 languages x 3 urgency levels = 450 rows
- [ ] TTS: Arabic + Urdu pre-generated WAVs, played only on user tap
- [ ] Kiosk UI: single-screen, three-tap maximum, works offline

## Phase 3 — Government integration (weeks 11–16)
- [ ] PDPL data-flow document + DPIA (no biometric retention by design)
- [ ] Sehha / Absher-shaped export payload behind a reviewed adapter
- [ ] Interpreter-in-the-loop review of all 450 templates
- [ ] Arabic-first accessibility audit (RTL, contrast, 200% zoom)
- [ ] Pilot with one clinic + one government service centre

## Phase 4 — Viral surface (parallel)
- [ ] Telegram mini-app: `@ImaaBot` — sign a phrase, get 3-language card
- [ ] Shareable "what I said" card with Arabic + Urdu + English
      (no faces, no personal data — designed to be screenshotted)
- [ ] Public counter: signs translated, languages bridged, regions served
- [ ] Deaf-signer advisory board credited on the site (trust, not decoration)

## Guardrails that do not move
1. No biometric data persisted by default.
2. No decision without an active, versioned calibration release.
3. No sign enabled without a named reviewer and a date.
4. No accuracy claim without a signer-disjoint test number behind it.
