---
title: "Security, Permissions And Customer Trust"
slug: "fde/security-and-trust"
summary: "Protect customer data through explicit identity, object authorization, tenant isolation and controlled operational access."
track: "Forward Deployed Engineering"
topic: "Security, Permissions And Customer Trust"
difficulty: "practitioner"
tags: ["fde", "career-transition", "customer-engineering"]
prerequisites: ["Basic programming, Git and HTTP"]
sourceRefs: ["fde-owasp-authorization", "fde-openai-role"]
status: "published"
---

An FDE often works across organizational boundaries with valuable data and broad integration capabilities. Make the trust boundary visible before implementation. Authentication establishes who is calling; authorization determines which action they may perform on which object. A logged-in user with a guessed ticket ID still needs an object-specific permission check.

## Draw the trust map

List browser, application backend, identity provider, datastore, job worker, model provider, tool endpoints and telemetry destination. Draw every data transfer and credential location. Record the customer owner who approves data use and each operational permission. This is an engineering artifact for review; it does not certify regulatory or contractual compliance.

Build a permission matrix: role × object type × action × tenant. Derive the tenant from verified identity and validate membership. Test reading, exporting, editing and replaying operations. Include background jobs and administrative routes; securing only the main UI leaves other paths exposed. Object IDs, including UUIDs, are identifiers rather than permission grants, as OWASP's API1 guidance emphasizes.

SSO usually handles organizational sign-in; lifecycle provisioning and deprovisioning are separate integration needs. Ask how group changes and revoked access reach your system. Do not claim that an enterprise login integration automatically establishes correct authorization or timely revocation.

## Protect information throughout the workflow

Retrieve only authorized data before constructing model context. Filtering the final answer cannot remove data already sent to a model or written to a trace. Preserve document permissions across chunks, embeddings, caches and citations. Include tenant, relevant permission context and policy/version scope in cache design, and define invalidation when access changes.

Treat retrieved text and tool results as untrusted data. An instruction inside a document does not authorize a tool action. Validate structured output against a schema, authorize the requested action server-side and use approval for consequential operations when the workflow requires it. A model's recommendation is not an authorization decision.

Use scoped service identities and approved secret storage. Never ship secret credentials to a client bundle. Minimize data in logs, set retention and deletion expectations, and verify that backups and derived stores are covered by the agreed policy. Request temporary, auditable access rather than sharing an administrator password. Route policy and legal questions to the customer's responsible experts.

## Practice

Create two fictional tenants, an operator and an administrator in each. Write at least six denial cases: tenant A reads B's ticket; an operator exports an unauthorized collection; a revoked user reuses an old session; a queued job runs after permissions change; a shared cache serves another tenant's response; a retrieved document requests a forbidden tool action.

For each case, name the enforcing component, expected response and audit evidence. Use synthetic records. Your portfolio should show test inputs and permission decisions without containing real credentials or customer documents.

## Review your work

Can an auditor trace identity → policy → object → action? Does authorization apply before data leaves its trust boundary? Who owns revocation, incident access and offboarding? Security is a delivery requirement, so unresolved permissions should change scope or schedule rather than become an undocumented bypass.

## Sources and further study

- [API1:2023 Broken Object Level Authorization](https://api-security.owasp.org/editions/2023/en/0xa1-broken-object-level-authorization/): OWASP API Security Top 10, 2023 edition. Object/action authorization and regression testing.
- [Forward Deployed Engineer — Singapore](https://openai.com/careers/forward-deployed-engineer-singapore-singapore/): Dated role example: discovery, delivery, adoption and product feedback. Requirements vary by posting.
