---
title: "Asynchronous User Repository Matrix Interview Guide"
slug: "frontend/interview-user-matrix"
summary: "Fetch user counts, handle partial failures, and place results in stable unique cells despite out-of-order requests."
track: "Front-End Development"
topic: "Frontend Interview Practice"
difficulty: "practitioner"
tags: ["frontend", "interview", "react", "typescript", "python", "user-matrix"]
sourceRefs: ["frontend-github-repos", "frontend-react-effects", "frontend-python-async"]
status: "published"
---

## Build requirements

Fetch up to three users from /userList, retrieve each user’s public owned repository count, and display the users in distinct random positions of a 3×3 grid. Keep positions stable while results arrive and report errors per user.

## Correct the API contract

The brief's repository URL is malformed. The intended public-user listing is `/users/{username}/repos`, with `type=owner` for this practice definition. It is paginated: the default page has up to 30 repositories and `per_page` allows up to 100. A count of one returned page is not a total. The companion loops until a page has fewer than 100 records.

“Repository count” here means **public owned repositories**, not private repositories, memberships, contributions, or repositories across organizations. Ask which meaning is intended. Live pagination is not a snapshot if repositories change during the request.

## Separate the three decisions

Fetch and validate up to three usernames; deduplicate case-insensitively as an authored practice rule. Sample unique cells once for that load. Then request counts without changing assignments. A failure stays attached to its user and never becomes the number zero.

Sequential fetching is easiest to debug. Parallel independent results reduce waiting when three requests can run together. Two-worker progressive loading illustrates bounded concurrency and quota tradeoffs; it is an extension, not a requirement to overbuild a three-user task.

## Rehearse the lifecycle failure

If a timeout or promise callback sees an older array after `setState`, first read [React State Snapshots and Async Callbacks](/docs/frontend/react-state-async-callbacks). It explains functional updates, item identity, and the difference between stale closures and stale requests.

Start load A, then reload to start B. If A resolves late, it must not replace B. Abort A on cleanup and also check cancellation after awaited work, because an adapter may ignore abort. This protects local state; it does not establish remote cancellation.

## Deterministic practice data

The playground never calls a live API. Ada has 103 repositories across two pages, Grace returns a 429 failure, and Linus has two. Reloading assigns a new seeded placement. The injected fetch adapter allows local experiments without changing the model. Keep credentials out of client code.

## Choose a solution

| Approach | When to choose it |
| --- | --- |
| Sequential requests | Start with the easiest request order to explain and debug, accepting additive latency. |
| Parallel independent outcomes | Load all users concurrently and keep failure attached to the corresponding user. |
| Bounded progressive requests | Use two worker slots and publish each completed user while keeping cell assignments stable. |

Build the first approach and discuss the other two as alternatives; do not build all three in one interview. Each walkthrough includes numbered steps, a correctness argument, pitfalls, a full React/TypeScript project, and a Python logic companion.

## Senior-engineer rehearsal

1. Restate the contract and name the ambiguous rule before writing code.
2. Make the smallest visible example work, using the first approach.
3. Say the invariant aloud and demonstrate one counterexample.
4. Check correctness before discussing optimization. Include copying, output, and I/O costs.
5. Summarize what works, what you tested, and which extension you would build next.

Practice the baseline for roughly 20–30 minutes, then explain an alternative without coding it. This suggested rehearsal schedule does not describe an actual interview duration.

## Worked example

**Input:** Ada succeeds with 103 repositories; Grace fails; Linus succeeds with 2.

**Result:** Three unique cells retain their assigned users; Grace shows an error while Ada and Linus show their counts.

Failures and completion order do not change identity or placement.

## Continue studying

[Open the three guided solutions](/interviews/frontend-practice/user-matrix?path=frontend-interview-practice), then [take the checkpoint](/practice/frontend/interview-user-matrix-questionnaire?path=frontend-interview-practice). The final checkpoint leads into the combined vertical review feed.

These original prompts adapt privately supplied preparation material. The sources support technical claims, not employer endorsement or interview outcomes.
