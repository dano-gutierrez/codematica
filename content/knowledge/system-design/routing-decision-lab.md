---
title: Routing Decisions — Choose A Signal And Test Its Limits
slug: system-design/routing-decision-lab
summary: Compare routing signals, filter unhealthy backends and test capacity assumptions without confusing affinity with correctness.
track: System Design
topic: Load Balancing
difficulty: practitioner
tags: [load-balancing, capacity, routing, reliability]
prerequisites: [system-design/scaling-decision-worksheet]
diagramRefs: []
sourceRefs: [nginx-upstream-routing]
status: published
---

## Describe the work before choosing a rule

Start with the [capacity worksheet](/docs/system-design/scaling-decision-worksheet). In this original scenario, backend A has two active connections but fifty queued expensive jobs; B has eight connections and one queued job. A rule that counts connections can favor A even though its work backlog is larger. HTTP multiplexing, idle connections and varying request costs can weaken that signal. Measure the actual workload before treating connection count as remaining capacity.

Round robin distributes selections; weights express an assumed capacity ratio. Neither proves equal response time. Random selection avoids a shared rotation counter, but does not by itself observe overload. A response-time signal needs an observation window and a policy for errors, cold backends and stale measurements. Bandwidth matters only when it represents the constrained resource; verify that your actual proxy supports the proposed rule.

The [NGINX upstream reference](https://nginx.org/en/docs/http/ngx_http_upstream_module.html) documents weighted round robin, weighted least connections, hash-based affinity and random selection. Least-connection ties use weighted round robin. Check the deployed version and edition: the standalone `least_time` directive became available outside the commercial edition in 1.31.0, while some other variants remain commercial. This lesson does not supply a production proxy configuration.

## Separate eligibility, ranking and admission

Filter unhealthy, draining or policy-ineligible backends before ranking. Then apply a capacity limit and a bounded rejection or waiting policy when no eligible capacity remains. Routing distributes admitted work; it cannot repair a saturated shared database or guarantee a checkout deadline. Probe design, draining behavior and stale health information need their own failure tests.

IP-based affinity does not establish user identity, authorization or durable session ownership. Several people can share an address; a client can change addresses; an unavailable backend can force remapping. Keep authoritative session state recoverable and authorize each operation regardless of which backend receives it. For cache placement, hash remapping and invalidation are different concerns; read the [cache contract](/docs/system-design/cache-invalidation).

## Run an original selection experiment

Save this standard-library Python 3.13+ block as `routing_lab.py` and run `python3 routing_lab.py`. It opens no sockets and contacts no proxy. It selects from a static fixture using connections divided by an assumed positive weight, with an explicit alphabetical tie-breaker. That formula and tie policy are this toy's contract, not an implementation of NGINX's scheduler or a throughput model.

```python
from fractions import Fraction

def choose(backends):
    eligible = []
    for backend in backends:
        if not backend['healthy']:
            continue
        connections, weight = backend['connections'], backend['weight']
        if type(connections) is not int or connections < 0:
            raise ValueError('connections must be a nonnegative integer')
        if type(weight) is not int or weight <= 0:
            raise ValueError('weight must be a positive integer')
        eligible.append(backend)
    if not eligible:
        return None
    return min(eligible, key=lambda b: (
        Fraction(b['connections'], b['weight']), b['id'],
    ))['id']

def server(identity, connections, weight=1, healthy=True):
    return dict(id=identity, connections=connections, weight=weight, healthy=healthy)

assert choose([server('a', 2), server('b', 8)]) == 'a'
assert choose([server('a', 8, 4), server('b', 3)]) == 'a'
assert choose([server('a', 0, healthy=False), server('b', 3)]) == 'b'
assert choose([server('b', 2, 2), server('a', 1)]) == 'a'
assert choose([]) is None
assert choose([server('a', 0, healthy=False)]) is None
for connections, weight in [(-1, 1), (True, 1), (0, 0), (0, -1), (0, True)]:
    try:
        choose([server('a', connections, weight)])
    except ValueError:
        pass
    else:
        raise AssertionError('invalid routing input accepted')
print('eligibility, capacity normalization, ties and empty pools: passed')
```

Predict each selection before running it. Then remove the health filter, remove the capacity normalization or reverse the tie-breaker: each change must fail a different assertion. The loop pins invalid numeric inputs; missing fields, duplicate IDs, live health updates and concurrent dispatch are outside this small trusted-fixture contract.

## Preserve a routing decision receipt

Record request mix, transport, signal definition, measurement window, eligibility policy, capacity limits, tie rule, failure behavior and rollback conditions. Compare tail latency, errors and queue age under the same workload. Test a backend draining mid-request, stale measurements and all backends unavailable. Retry safety belongs to the [durable-operation contract](/docs/software-engineering/product-interview-durable-generation-architecture); choosing another machine does not make an uncertain write safe to repeat.

Complete the [Routing Decision Checkpoint](/practice/system-design/routing-decision-checkpoint). A passing toy or questionnaire does not certify a real proxy, production capacity or a vendor benchmark.
