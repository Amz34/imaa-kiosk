"""Feature-layer tests: shape contract and invariance properties."""
import numpy as np

from app.services.features import FEATURE_DIM, normalise, resample


def _toy_seq(T=40, seed=0):
    rng = np.random.default_rng(seed)
    pose = rng.uniform(0.2, 0.8, (T, 33, 3)).astype(np.float32)
    left = rng.uniform(0.2, 0.8, (T, 21, 3)).astype(np.float32)
    right = rng.uniform(0.2, 0.8, (T, 21, 3)).astype(np.float32)
    return pose, left, right


def test_output_shape_matches_declared_dim():
    pose, left, right = _toy_seq()
    feats = normalise(pose, left, right)
    assert feats.shape == (40, FEATURE_DIM)
    assert feats.dtype == np.float32


def test_translation_invariance():
    """Same sign shifted across the frame must produce identical features."""
    pose, left, right = _toy_seq()
    a = normalise(pose, left, right)
    shift = np.array([0.13, -0.07, 0.0], dtype=np.float32)
    b = normalise(pose + shift, left + shift, right + shift)
    assert np.allclose(a, b, atol=1e-5)


def test_scale_invariance():
    """A signer further from the camera must produce the same features."""
    pose, left, right = _toy_seq()
    a = normalise(pose, left, right)
    c = np.array([0.5, 0.5, 0.0], dtype=np.float32)
    k = 1.7
    b = normalise((pose - c) * k + c, (left - c) * k + c, (right - c) * k + c)
    assert np.allclose(a, b, atol=1e-4)


def test_resample_fixes_length():
    pose, left, right = _toy_seq(T=37)
    feats = normalise(pose, left, right)
    out = resample(feats, 64)
    assert out.shape == (64, FEATURE_DIM)


def test_resample_handles_single_frame():
    feats = np.ones((1, FEATURE_DIM), dtype=np.float32)
    assert resample(feats, 32).shape == (32, FEATURE_DIM)
