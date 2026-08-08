---
title: Python And NumPy For ML Systems
slug: ml-systems/python-numpy-foundations
summary: Build the Python, array, shape, dtype, and measurement habits needed to reason about machine learning systems rather than isolated notebooks.
track: ML Systems
topic: Prerequisites
difficulty: foundation
tags: [python, numpy, arrays, profiling]
prerequisites: []
diagramRefs: []
sourceRefs: [harvard-vol1]
status: published
---

## Why this prerequisite exists

The Harvard curriculum assumes Python proficiency and familiarity with NumPy. This companion narrows that large prerequisite to the behaviors you will use throughout the path: reading shapes, predicting memory, vectorizing work, testing numerical code, and measuring before optimizing. The [official Volume I homepage](https://mlsysbook.ai/vol1/) remains the authoritative statement of prerequisites and curriculum scope.

## Arrays are layouts, not just lists

For an array with shape `(batch, features)`, make every axis nameable. Shape bugs often execute successfully because broadcasting produces a valid but unintended result. Before running an operation, write the expected input and output shapes. Then confirm them with assertions.

Memory is approximately `element_count × bytes_per_element`. A `1000 × 1000` `float32` array holds one million four-byte values, or about 4 MB before temporary arrays and framework overhead. Changing to `float64` doubles that payload. This simple calculation becomes essential when activations, optimizer state, and batches compete for memory.

```python
import numpy as np

x = np.zeros((1_000, 1_000), dtype=np.float32)
assert x.shape == (1_000, 1_000)
assert x.nbytes == 4_000_000
```

## Vectorization and hidden work

Vectorized NumPy moves loops into optimized native kernels, but concise syntax does not guarantee low cost. An expression can allocate several full-sized temporaries. Inspect `shape`, `dtype`, `nbytes`, and whether an operation returns a view or a copy. Treat each allocation and data movement as part of the algorithm.

## Reproducibility and tests

Use explicit random generators, small deterministic fixtures, tolerance-aware comparisons, and tests for shapes as well as values. A useful numerical test states the invariant: conservation, monotonicity, bounds, or agreement with a tiny reference implementation.

## Measure a baseline

Use `time.perf_counter()` around repeated work, warm up code whose first call initializes caches, and report the environment with the result. One timing is an anecdote; a distribution with inputs and hardware recorded is evidence.

## Practical exercise

Create arrays with two dtypes, predict their memory before printing `nbytes`, and compare a Python loop with a vectorized operation. Record where your prediction differed from observation and explain whether computation or data movement dominated.

