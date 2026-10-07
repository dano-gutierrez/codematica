---
title: Neural Computation — Check A Gradient Before Training
slug: ml-systems/neural-computation
summary: Trace an original tiny neural network from prediction to loss, verify its derivatives numerically, and distinguish gradient computation from parameter updates.
track: ML Systems
topic: Model Development
difficulty: practitioner
tags: [neural-networks, backpropagation, gradients, numerical-validation]
prerequisites: [ml-systems/math-foundations, ml-systems/python-numpy-foundations]
diagramRefs: []
sourceRefs: [harvard-vol1-neural-computation, pytorch-autograd-introduction, udlbook-notebooks]
status: published
---

## Give the framework a checkable job

Continue the existing Harvard path with the [Neural Computation chapter](https://mlsysbook.ai/vol1/nn_computation/nn_computation.html). A forward pass calculates a prediction; a loss compares it with a target. Backpropagation calculates derivatives, and an optimizer uses them to change parameters. These are separate operations. Training also retains intermediate values and gradient state, so inference weight size does not determine training memory.

This companion supplies an original five-parameter calculation rather than recreating the chapter. The [author's Understanding Deep Learning notebooks](https://github.com/udlbook/udlbook/tree/0d84a591362f1cc99c6dc2ce1c2544d559280681/Notebooks) offer further practice. Choose one exercise after checking its prerequisites; completing this small check does not establish understanding of the whole collection.

## Trace one hidden unit

Let `x = (1.5, -0.5)`, with target `t = 0.4`. Our model has input weights `w0, w1`, hidden bias `b`, output weight `v` and output bias `c`:

```text
z = w0*x0 + w1*x1 + b
h = tanh(z)
prediction = v*h + c
loss = 0.5*(prediction - t)^2
```

Write `e = prediction - t`. The output derivatives are `dL/dv = e*h` and `dL/dc = e`. The gradient entering the hidden preactivation is `g = e*v*(1-h^2)`. Therefore `dL/dw0 = g*x0`, `dL/dw1 = g*x1`, and `dL/db = g`. Check which forward values each derivative needs before implementing it.

## Run an independent numerical check

Run this with Python 3; it uses only the standard library. Before running, predict whether subtracting a small multiple of the gradient should raise or lower this loss.

```python
from math import tanh

x, target = (1.5, -0.5), 0.4
initial = [0.3, -0.2, 0.1, 0.7, -0.05]

def forward(p):
    hidden = tanh(p[0] * x[0] + p[1] * x[1] + p[2])
    prediction = p[3] * hidden + p[4]
    return hidden, prediction

def loss(p):
    _, prediction = forward(p)
    return 0.5 * (prediction - target) ** 2

def gradients(p):
    hidden, prediction = forward(p)
    error = prediction - target
    hidden_gradient = error * p[3] * (1 - hidden ** 2)
    return [hidden_gradient * x[0], hidden_gradient * x[1],
            hidden_gradient, error * hidden, error]

def numerical(p, epsilon=1e-6):
    result = []
    for i in range(len(p)):
        plus, minus = p.copy(), p.copy()
        plus[i] += epsilon
        minus[i] -= epsilon
        result.append((loss(plus) - loss(minus)) / (2 * epsilon))
    return result

analytic, checked = gradients(initial), numerical(initial)
error = max(abs(a - b) for a, b in zip(analytic, checked))
assert error < 1e-7
updated = [p - 0.1 * g for p, g in zip(initial, analytic)]
assert loss(updated) < loss(initial)
print(f"loss: {loss(initial):.8f} -> {loss(updated):.8f}")
print(f"maximum gradient error: {error:.2e}")
```

Measured locally with Python 3.13.3, the loss changed from `0.00124157` to `0.00077417`; maximum absolute gradient error was approximately `2.77e-12`. Floating-point details can vary. The assertions check this fixture, not every model or learning rate.

## Break the result deliberately

Replace `1 - hidden ** 2` with `1` and rerun. The numerical comparison should fail because the hidden derivative is wrong. Next, restore it and use `p + 0.1*g` for the update: the loss-decrease assertion should fail for this fixture. Finally, vary epsilon through `1e-2`, `1e-6` and `1e-12`. Explain why truncation error and floating-point cancellation make both extremes less useful. A numerical check costs two forward evaluations per parameter; use it for small diagnostics, not bulk training.

## Translate the check to a real system

[PyTorch's autograd tutorial](https://docs.pytorch.org/tutorials/beginner/blitz/autograd_tutorial.html) shows how recorded operations supply derivatives and how gradients accumulate. When comparing it with this fixture, distinguish clearing previous gradients, running a new forward pass, calculating current gradients and applying an update. Framework defaults do not excuse checking shapes, objective scaling and a small reproducible case.

Five parameters stored as float64 need 40 bytes of tensor payload. That estimate excludes Python objects, activations, gradients, optimizer state and allocator overhead. Report payload and process memory separately, as in [Engineering Measurement Foundations](/docs/ml-systems/engineering-measurement-foundations).

## Evidence to keep

Record the equations, parameters, epsilon, maximum gradient error and before/after loss. Retain the deliberate failing version beside the correction. Then complete the [Neural Computation Checkpoint](/practice/ml-systems/neural-computation-checkpoint) before moving to the path's architecture and training references.
