"""Vectorised landmark feature extraction — the performance fix.

Ishara-AI's DTW ran ~398 ms/decision in pure Python. This module is the
feature layer for the neural path: every operation is numpy-vectorised,
so a 90-frame sequence normalises in well under a millisecond.
"""
from __future__ import annotations

import numpy as np

# MediaPipe Holistic layout we depend on (33 pose landmarks).
_L_SHOULDER = 11
_R_SHOULDER = 12

# 66 body + 42 left shape + 42 right anchor + 42 right shape + 2 presence
FEATURE_DIM = 194


def _scale_and_centre(pose: np.ndarray) -> tuple[np.ndarray, float]:
    """Anchor on shoulder midpoint, scale by shoulder width."""
    ls = pose[:, _L_SHOULDER, :2]
    rs = pose[:, _R_SHOULDER, :2]
    centre = (ls + rs) / 2.0
    width = np.linalg.norm(ls - rs, axis=1)
    width = np.where(width < 1e-6, 1.0, width)
    return centre, width


def normalise(pose: np.ndarray, left: np.ndarray, right: np.ndarray) -> np.ndarray:
    """Build the 98-dim anchor+shape feature vector for every frame.

    pose:   (T, 33, 3)
    left:   (T, 21, 3)  right: (T, 21, 3)
    returns (T, 98)
    """
    pose = np.asarray(pose, dtype=np.float32)
    left = np.asarray(left, dtype=np.float32)
    right = np.asarray(right, dtype=np.float32)
    T = pose.shape[0]

    centre, width = _scale_and_centre(pose)
    centre = centre[:, None, :]
    width = width[:, None, None]

    pose_n = (pose[:, :, :2] - centre) / width          # (T,33,2) body anchor
    left_n = (left[:, :, :2] - centre) / width           # (T,21,2)
    right_n = (right[:, :, :2] - centre) / width         # (T,21,2)

    # Hand shape: translate to wrist, scale by hand span -> orientation free.
    l_shape = left_n - left_n[:, :1, :]
    r_shape = right_n - right_n[:, :1, :]
    l_span = np.linalg.norm(l_shape, axis=2).max(axis=1, keepdims=True)[:, :, None]
    r_span = np.linalg.norm(r_shape, axis=2).max(axis=1, keepdims=True)[:, :, None]
    l_shape = l_shape / np.where(l_span < 1e-6, 1.0, l_span)
    r_shape = r_shape / np.where(r_span < 1e-6, 1.0, r_span)

    # Presence flags (1.0 if the block was actually detected this frame).
    l_present = (np.abs(left).sum(axis=(1, 2)) > 0).astype(np.float32)[:, None]
    r_present = (np.abs(right).sum(axis=(1, 2)) > 0).astype(np.float32)[:, None]

    feats = np.concatenate(
        [
            pose_n.reshape(T, -1),        # 66  body anchor
            l_shape.reshape(T, -1),        # 42  left shape
            right_n.reshape(T, -1),        # 42  right anchor
            r_shape.reshape(T, -1),        # 42  right shape
            l_present,                     # 1
            r_present,                     # 1
        ],
        axis=1,
    )
    return feats[:, :FEATURE_DIM].astype(np.float32)


def resample(seq: np.ndarray, target_len: int = 64) -> np.ndarray:
    """Linear time-resample a (T, D) sequence to a fixed length."""
    T = seq.shape[0]
    if T == target_len:
        return seq
    if T < 2:
        return np.repeat(seq, target_len, axis=0)
    idx = np.linspace(0, T - 1, target_len)
    lo = np.floor(idx).astype(int)
    hi = np.minimum(lo + 1, T - 1)
    w = (idx - lo)[:, None].astype(np.float32)
    return (seq[lo] * (1 - w) + seq[hi] * w).astype(np.float32)
