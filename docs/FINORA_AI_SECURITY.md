# FINORA AI — SECURITY & PRIVACY SPECIFICATION
## Zero Cross-User Leakage, Scoped Authorization & Anti-Hallucination Guardrails

- **Document ID:** `docs/FINORA_AI_SECURITY.md`
- **Revision:** 2.0.0
- **Scope:** Complete Data Protection, Injection Mitigation & Access Control

---

## 1. DATA ACCESS BOUNDARIES & OWNERSHIP

1. **User Identity Invariance:** Every tool call and query execution binds strictly to the authenticated `user.id`. The AI is technically unable to query records belonging to other tenants.
2. **Read-Only / Draft-Only Tooling:** The AI possesses zero direct database mutation tools (`INSERT`, `UPDATE`, `DELETE`). It can only invoke `propose_*` tools that produce transient, user-editable draft plans.
3. **Admin Privacy Guarantee:** The separate Admin Console collects aggregate telemetry (total AI requests, token volume, model distribution, latency). **Admin accounts have no technical means to view user financial context or conversation logs.**

---

## 2. PROMPT INJECTION & SAFETY GUARDRAILS

- **System Prompt Hardening:** Explicit rules instruct the reasoning engine to reject prompt injections asking to "ignore previous rules", reveal system instructions, or fabricate market quotes.
- **Financial Reality Guardrail:** The model is prohibited from presenting hypothetical returns as guaranteed, and must explicitly distinguish between confirmed income vs. expected bonuses.
