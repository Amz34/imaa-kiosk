"""Calibrated abstention gate — replaces Ishara-AI's hardcoded tau=0.55.

Their spec left tau/delta as <TBD> in the docs while shipping uncalibrated
constants in code, so every "unknown" decision was effectively arbitrary.

Here the gate is fitted from data with split-conformal prediction:

    * fit(probabilities, labels)  collects non-conformity scores
    * decide(probs)               returns a label only if the conformal
                                  set is a singleton, else ABSTAINS

Guarantee (distribution-free, finite sample):
    P(abstain or correct) >= 1 - alpha
i.e. the wrong-accept rate is bounded by alpha on exchangeable data,
instead of being asserted in a doc.
"""
from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np

ABSTAIN = "__unknown__"


@dataclass
class ConformalGate:
    alpha: float = 0.05
    min_margin: float = 0.15          # second-opinion requirement
    qhat: float = 1.0                 # fitted non-conformity quantile
    n_calibration: int = 0
    labels: list[str] = field(default_factory=list)
    fitted: bool = False

    def _nonconformity(self, probs: np.ndarray, y: np.ndarray) -> np.ndarray:
        """1 - p(true class): standard APS-style score."""
        return 1.0 - probs[np.arange(len(y)), y]

    def fit(self, probs: np.ndarray, y: np.ndarray) -> "ConformalGate":
        probs = np.asarray(probs, dtype=np.float64)
        y = np.asarray(y, dtype=np.int64)
        if probs.ndim != 2 or len(probs) != len(y):
            raise ValueError("probs must be (N, C) and match len(y)")
        scores = self._nonconformity(probs, y)
        n = len(scores)
        # Finite-sample correction from Vovk et al. — not ceil(alpha*N).
        level = min(1.0, np.ceil((n + 1) * (1 - self.alpha)) / n)
        self.qhat = float(np.quantile(scores, level, method="higher"))
        self.n_calibration = n
        self.fitted = True
        return self

    def decide(self, probs: np.ndarray) -> tuple[str, float, list[str]]:
        """Return (label_or_ABSTAIN, confidence, conformal_set)."""
        if not self.fitted:
            # Fail CLOSED, never open. An unfitted gate cannot certify anything.
            raise RuntimeError("gate not fitted — refusing to emit a decision")
        probs = np.asarray(probs, dtype=np.float64).ravel()
        order = np.argsort(probs)[::-1]
        top, second = order[0], order[1] if len(order) > 1 else order[0]

        # Conformal set = every class whose score clears qhat.
        keep = np.flatnonzero(1.0 - probs <= self.qhat).tolist()
        margin = float(probs[top] - probs[second])

        if len(keep) != 1:
            return ABSTAIN, float(probs[top]), [str(k) for k in keep]
        if margin < self.min_margin:
            return ABSTAIN, float(probs[top]), [str(keep[0])]
        return str(keep[0]), float(probs[top]), [str(keep[0])]
