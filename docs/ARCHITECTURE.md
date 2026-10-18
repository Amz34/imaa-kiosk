# إيماء (Imaa) — Architecture Decisions

## ADR-001: Hybrid inference — WASM landmarks, ONNX classifier

**Decision.** Landmark extraction runs in the browser (MediaPipe Tasks WASM);
classification runs server-side on ONNX Runtime.

**Why not all-client.** Landmarks from MediaPipe are 33 pose + 42 hand points.
Sending raw video exposes faces and the room — a PDPL problem we refuse to own.
Sending landmarks is ~4 KB/frame and carries no identity.

**Why not all-server.** Server-side `cv2` decoding is what broke Ishara-AI
(their engine silently degraded to a stub because `mediapipe`/`opencv` were
absent). Client extraction removes a heavyweight server dependency and the
GPU bill.

**Consequence.** Two deployables, one contract: `POST /api/v1/translate`
takes `{"landmarks": [[...]], "dialect": "psl"|"arsl", "target_lang": ...}`.

## ADR-002: Learned sequence classifier, DTW as verifier only

Ishara-AI matched against DTW templates: 2 samples per sign, one signer,
398 ms per decision. DTW cannot generalise across signers because it has no
notion of what is invariant.

**Decision.** ST-GCN (spatial-temporal graph over the skeleton) as primary.
DTW is retained only as a cheap sanity check that the motion is in-distribution.

**Why ST-GCN.** The input *is* a graph (joints, bones, time) — a GCN respects
that structure; a Transformer over flattened 194-dim vectors does not, and
needs far more data to learn it.

## ADR-003: Calibrated abstention, never a hardcoded tau

Ishara-AI documented `tau_accept: <TBD>` and `delta_margin: <TBD>` in its spec,
then shipped `tau=0.55, delta=0.15` as constants in `recognize.py`. Their
"2% wrong-accept" target was never measured — 0 trials exist in their database.

**Decision.** Split-conformal gate (`services/gate.py`), fitted per release,
with the calibration set version recorded. An unfitted gate raises; it does
not fall back to a default. Fail-closed, always.

**Reported metric.** We publish `accepted`, `abstained`, `wrong-accepted`
separately. A system that abstains 40% and is wrong 1% is *better* than one
that accepts 90% and is wrong 8%, and only separate numbers make that visible.

## ADR-004: Zero biometric persistence

No captured sequence is written to disk or object storage by default. If a
signer opts in to contribute a sample, it goes to a consent-scoped bucket with
an explicit retention clock, and the capture path is not in the request path.

Ishara-AI wrote "frames are never permanently stored" in its privacy doc while
`recognize.py` wrote every capture to `experiments/day1/captures/` — and shipped
~37 of those `.npz` files in a public GitHub repo. That is the single most
serious defect in their build, and it is a *design* defect, not a bug.

## ADR-005: Two dialects, one label space

PSL and ArSL share Islamic/Arabic-rooted vocabulary but diverge in handshape
and signing space. Labels are therefore `(code, dialect)`-scoped, with an
optional `bridge` mapping for signs that are genuinely identical.

The viral feature — a Pakistani worker signing PSL to a Saudi clerk — is a
*retrieval* problem across two label spaces, not a translation problem. We
solve it by projecting both into one embedding space and reporting the closest
cross-dialect match with its own confidence.
