"""Tests for the calibrated abstention gate.

These are the tests Ishara-AI never wrote. They assert the property that
matters clinically: the machine refuses rather than guesses.
"""

import numpy as np
import pytest

from app.services.gate import ABSTAIN, ConformalGate


def _toy(n=600, classes=5, seed=0, noise=0.35):
    rng = np.random.default_rng(seed)
    y = rng.integers(0, classes, n)
    logits = rng.normal(0, noise, (n, classes))
    logits[np.arange(n), y] += 2.0
    e = np.exp(logits - logits.max(axis=1, keepdims=True))
    return e / e.sum(axis=1, keepdims=True), y


def test_unfitted_gate_fails_closed():
    """An unfitted gate must refuse to decide — never default to 'accept'."""
    with pytest.raises(RuntimeError):
        ConformalGate().decide(np.array([0.9, 0.1]))


def test_confident_prediction_is_accepted():
    probs, y = _toy()
    gate = ConformalGate(alpha=0.1, min_margin=0.1).fit(probs, y)
    label, conf, keep = gate.decide(np.array([0.95, 0.02, 0.01, 0.01, 0.01]))
    assert label == "0"
    assert conf > 0.9
    assert keep == ["0"]


def test_ambiguous_prediction_abstains():
    probs, y = _toy()
    gate = ConformalGate(alpha=0.1, min_margin=0.15).fit(probs, y)
    label, _, _ = gate.decide(np.array([0.40, 0.38, 0.10, 0.07, 0.05]))
    assert label == ABSTAIN


def test_wrong_accept_rate_is_bounded_by_alpha():
    """The core safety property, measured instead of asserted."""
    probs, y = _toy(seed=1)
    half = len(y) // 2
    gate = ConformalGate(alpha=0.1, min_margin=0.0).fit(probs[:half], y[:half])

    wrong = accepted = 0
    for p, truth in zip(probs[half:], y[half:]):
        label, _, _ = gate.decide(p)
        if label == ABSTAIN:
            continue
        accepted += 1
        if int(label) != int(truth):
            wrong += 1

    assert accepted > 0, "gate accepted nothing — calibration is degenerate"
    assert wrong / accepted <= 0.25, f"wrong-accept rate too high: {wrong}/{accepted}"


def test_gate_is_deterministic():
    probs, y = _toy(seed=2)
    gate = ConformalGate(alpha=0.1).fit(probs, y)
    p = probs[7]
    assert gate.decide(p) == gate.decide(p)
