# إيماء (Imaa) — Data Plan

DTW against dictionary templates died because PSL Dictionary has ~2 samples per
sign from one signer. No amount of model tuning fixes that. This plan exists so
we never hit that wall.

## Source matrix

| Source | Content | Signers | Use |
|--------|---------|---------|-----|
| PakSign (CVUI 2025) | 52 Urdu signs, 1,280 pose sequences | 5 | PSL bootstrapping |
| ArSL open corpora (KArSL / ArASL) | Arabic alphabet + common signs | multi | ArSL bootstrapping |
| Own recording (Phase 2) | 50 medical/gov signs | 8+ | The actual product vocabulary |
| GOV.UK / KSA MoH phrase lists | English/Arabic clinical phrasing | — | Template review source only |

Rules:
1. **No dataset enters training without a recorded licence and a `sources` row.**
   Ishara-AI committed third-party PSL clips to a public repo with no LICENSE
   file at all. We do not repeat that.
2. **Public datasets bootstrap; they never ship.** PakSign has no KSA medical
   vocabulary. It teaches the encoder what motion invariance looks like, then
   our own recordings define the product's label space.
3. **Signer-disjoint splits, always.** Group by signer ID, never by sequence.
   A random split leaks the same person into train and test and inflates
   accuracy — the most common way sign-language papers report fake numbers.

## Collection protocol (own data)

- 8 signers minimum: 4 deaf native signers, 4 hearing CODAs/interpreters.
- Both dialects: PSL signers and ArSL signers recorded separately.
- 10 repetitions per sign, 2 camera distances, 2 lighting conditions.
- Consent per purpose: research / model training / demo. Separate checkboxes.
- Compensation paid; signer retains right to withdraw (and a withdrawal is
  honoured by retraining exclusion, tracked in `sources`).
- Raw video is deleted after landmark extraction unless the signer opts in.

## Split policy

```
train   6 signers      ~75%
val     1 signer       ~12%   (model selection only)
test    2 signers      ~13%   (touched once per release, never during tuning)
```

## Reporting contract

Every release publishes, on the signer-disjoint test set:

- top-1 accuracy
- **accepted / abstained / wrong-accepted** (separate lines, never merged)
- confusion among the top-10 confusable pairs, which for these 50 signs will be
  CHEST_PAIN↔PAIN, FEVER↔INJURY, BLOOD_PRESSURE↔DIABETES, YES↔CORRECT
- latency p50/p95 on a mid-range Android device, not on a dev laptop

A release that improves accuracy while raising wrong-accepts is a regression.
