---
title: Quantitative Foundations For ML Systems
slug: ml-systems/math-foundations
summary: Refresh linear algebra, calculus, probability, units, logarithms, and estimation through the calculations used in practical ML systems work.
track: ML Systems
topic: Prerequisites
difficulty: foundation
tags: [mathematics, linear-algebra, probability, estimation]
prerequisites: []
diagramRefs: []
sourceRefs: [harvard-vol1]
status: published
---

## The math is a decision tool

Volume I assumes undergraduate foundations in linear algebra, calculus, and probability. In systems work, the goal is rarely a long symbolic proof. The goal is to translate a design into quantities, preserve units, estimate its order of magnitude, and notice when an answer is physically impossible. Use the [official Volume I curriculum](https://mlsysbook.ai/vol1/) as the primary source for scope.

## Linear algebra with shapes

For `A ∈ R^(m×k)` and `B ∈ R^(k×n)`, `AB` has shape `m×n` and requires approximately `2mkn` floating-point operations when a multiply and add are counted separately. Shape annotations catch invalid compositions; the operation count helps estimate cost.

Know vectors, matrices, tensors, dot products, matrix multiplication, transposes, norms, and reductions. Focus on what an operation does to dimensions and data movement.

## Calculus for training

A derivative measures local sensitivity. Gradients collect partial derivatives; the chain rule propagates sensitivity through composed operations. For systems reasoning, connect the math to stored activations, backward-pass work, numerical precision, and optimizer state. Backpropagation is both an algorithm and a memory schedule.

## Probability for uncertain behavior

Refresh conditional probability, expectation, variance, sampling, confidence intervals, and distribution shift. Accuracy is an estimate over a sample, not an eternal property. A production population can change while code remains unchanged.

## Units and orders of magnitude

Carry units through every calculation: bytes, seconds, operations, watts, dollars, or requests. Throughput is work per time; latency is time per request. Bandwidth is data per time. These quantities relate but are not interchangeable.

Use powers of ten and bounds before precise arithmetic. If a model has one billion `float16` parameters, weights alone are roughly 2 GB. Training requires more because gradients, optimizer states, activations, and temporary buffers also exist.

## Practical exercise

Estimate the weight memory and matrix-multiply work for a small dense layer. State assumptions, calculate a lower and upper bound, then verify with a short NumPy program. Explain why measured process memory differs from the tensor payload.

