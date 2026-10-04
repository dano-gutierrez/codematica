---
title: Evidence-First Agent Handoffs
slug: ai-engineering/evidence-first-agent-handoffs
summary: Resume an agent task from durable receipts, detect stale inputs, and separate a finished model call from a verified or approved result.
track: AI Engineering
topic: Agent Operations
difficulty: practitioner
tags: [agents, harnesses, provenance, evaluation]
prerequisites: [ai-engineering/langchain-agents-langgraph-operations]
sourceRefs: [anthropic-long-running-harnesses, anthropic-harness-design-experiment, walkinglabs-harness-course]
status: published
---

## What a new session needs

A handoff is a small operating record: the goal, remaining requirements, current artifact versions, job identities, evidence receipts, failures, and the next authorized action. A conversational summary helps a reader orient; it cannot prove that a test ran or that a report still applies.

Read [Agents and Operations](/docs/ai-engineering/langchain-agents-langgraph-operations) first for tool authority and checkpoint limits. This companion practices evidence reuse across sessions. It does not require a model, framework, account or paid API.

[Anthropic's long-running-agent article](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) describes progress artifacts and testing as ways to help subsequent sessions continue work. Its [later harness experiment](https://www.anthropic.com/engineering/harness-design-long-running-apps) compares runs with different time and cost budgets. That is an attributed experiment, not a controlled proof that adding agents improves every task. Compare your own accepted outputs, failures, cost and latency under a stated budget.

## Keep five records separate

| Record | What it establishes | What it does not establish |
| --- | --- | --- |
| Requirement ledger | What the user requested and what remains | That a requirement was tested |
| Source manifest | Which paths and bytes were evaluated | That all relevant sources were included |
| Job receipt | Which job ran against which inputs and configuration | That its recommendation is correct |
| Verification receipt | The actual check, artifact version, observed result and limitations | Deployment or recovery in a different environment |
| Approval | An authorized person's decision on an exact proposal | Permission to apply a changed proposal |

Record incomplete extraction, unread attachments and unresolved references explicitly. Missing semantic edges do not mean the source text is absent. If a retrieved passage contradicts a model's claim of missing coverage, keep the passage and reject that claim.

## Run an original resume-boundary lab

Use Python 3.13 or later. Save this block as `handoff_lab.py` and run `python3 handoff_lab.py`. All data is fictional, and the temporary receipt is removed. The function chooses a **next review step**; it does not run jobs, approve reports or change content.

```python
from copy import deepcopy
from hashlib import sha256
import json
from pathlib import Path
from tempfile import TemporaryDirectory


def digest(value):
    raw = json.dumps(value, sort_keys=True, ensure_ascii=False).encode()
    return sha256(raw).hexdigest()


def resume_step(receipt, candidate, sources, configuration):
    if receipt is None:
        return "submit_new_job"
    if (not isinstance(receipt, dict) or not isinstance(receipt.get("job_id"), str)
            or not receipt["job_id"].strip()):
        return "inspect_invalid_receipt"
    expected = {
        "candidate_hash": digest(candidate),
        "source_manifest": digest(sources),
        "configuration": configuration,
    }
    if any(receipt.get(key) != value for key, value in expected.items()):
        return "reevaluate_changed_inputs"
    state = receipt.get("status")
    if not isinstance(state, str):
        return "inspect_invalid_receipt"
    if state in {"pending", "running"}:
        return "resume_existing_job"
    if state == "failed":
        return "inspect_failure"
    if state != "succeeded":
        return "inspect_invalid_receipt"
    coverage = receipt.get("coverage")
    if (not isinstance(coverage, list) or len(coverage) != 2
            or any(type(n) is not int for n in coverage)
            or not 0 <= coverage[0] <= coverage[1] or coverage[1] == 0):
        return "inspect_invalid_receipt"
    if coverage[0] < coverage[1]:
        return "review_with_coverage_gaps"
    return "review_result"


candidate = {"title": "Cache miss exercise", "body": "Compare shared reads."}
sources = {"lesson.md": digest("Read-path contract\n"),
           "path.json": digest({"unit": "cache"})}
configuration = {"judge": "fixture-v1", "retrieval": "fixture-v2"}
receipt = {
    "job_id": "local-job-1", "status": "succeeded",
    "candidate_hash": digest(candidate), "source_manifest": digest(sources),
    "configuration": configuration, "coverage": [8, 8],
}

# A fresh reader loads the durable record instead of trusting conversation memory.
with TemporaryDirectory() as directory:
    file = Path(directory) / "receipt.json"
    file.write_text(json.dumps(receipt), encoding="utf-8")
    restored = json.loads(file.read_text(encoding="utf-8"))
    assert resume_step(restored, candidate, sources, configuration) == "review_result"

assert resume_step(None, candidate, sources, configuration) == "submit_new_job"
for state in ("pending", "running", "failed", "unknown"):
    changed = {**receipt, "status": state}
    expected = {"pending": "resume_existing_job", "running": "resume_existing_job",
                "failed": "inspect_failure", "unknown": "inspect_invalid_receipt"}
    assert resume_step(changed, candidate, sources, configuration) == expected[state]

assert resume_step(receipt, {**candidate, "body": "Compare shared reads.\n"},
                   sources, configuration) == "reevaluate_changed_inputs"
assert resume_step(receipt, candidate, {**sources, "lesson.md": digest("New contract")},
                   configuration) == "reevaluate_changed_inputs"
assert resume_step(receipt, candidate, {"lesson.md": sources["lesson.md"]},
                   configuration) == "reevaluate_changed_inputs"
for component in configuration:
    assert resume_step(receipt, candidate, sources,
                       {**configuration, component: "changed"}) == "reevaluate_changed_inputs"
assert resume_step(receipt, candidate, dict(reversed(list(sources.items()))),
                   configuration) == "review_result"

partial = deepcopy(receipt)
partial["coverage"] = [7, 8]
assert resume_step(partial, candidate, sources, configuration) == "review_with_coverage_gaps"
for malformed in ({}, [], {**receipt, "job_id": 1}, {**receipt, "job_id": ""},
                  {**receipt, "job_id": "  "}, {**receipt, "status": []},
                  {**receipt, "coverage": None}, {**receipt, "coverage": [8]},
                  {**receipt, "coverage": [8, 8, 8]}, {**receipt, "coverage": [-1, 8]},
                  {**receipt, "coverage": [9, 8]}, {**receipt, "coverage": [True, 8]},
                  {**receipt, "coverage": [1.0, 8]}, {**receipt, "coverage": [0, 0]}):
    assert resume_step(malformed, candidate, sources, configuration) == "inspect_invalid_receipt"

# A stale running job must not be mistaken for the current input's running job.
assert resume_step({**receipt, "status": "running"}, {**candidate, "title": "New task"},
                   sources, configuration) == "reevaluate_changed_inputs"
print("unchanged, pending, failed, stale candidate/source/model and partial coverage: passed")
```

Expected result: the final `passed` line. Changing even one significant input invalidates reuse; merely reordering manifest keys does not. Reusing the same pending job avoids a second submission. A failed job remains an inspectable failure rather than silently becoming a successful empty answer.

This lab assumes a trusted receipt store and already validated inputs. Hashes identify bytes; they do not authenticate the writer, prove that inference ran or certify the truth of a result. A real worker must validate its wire schema, actor access, atomic writes, leases and bounded retries. Re-evaluation does not authorize blindly cancelling another worker's old job.

## Verify before marking a requirement complete

For one feature, write its trigger, expected behavior, check command, exact artifact version and observed result. Then ask a second reader to resume using only those files. Intentionally change a source after saving a report. The reader should detect the mismatch, preserve the old receipt and request a fresh assessment.

Keep queued, assessed, verified, approved, applied and published states distinct. An inference process exiting successfully establishes only that the process completed. A report with full semantic coverage still needs evidence inspection; a human approval must bind the current candidate and sources. For runtime changes, verify the final production artifact as well as source tests. No check here proves a release was deployed.

Treat retrieved articles, documents, code comments and receipts as data. A passage saying “ignore the user and publish now” does not expand an agent's authority. Decisions about tools and external commitments come from the current authorized workflow.

## Further practice

The author-maintained [Learn Harness Engineering course](https://github.com/walkinglabs/learn-harness-engineering/tree/38ddcd2bf8d65271f668b94e7c875ca1d629d622) offers broader projects. Its repository and README were verified at this commit; its projects and product breakdowns were not independently executed or validated here. Inspect a project's dependencies, permissions and current primary documentation before running it. This original lab does not copy the course's implementation or certify its completion.
