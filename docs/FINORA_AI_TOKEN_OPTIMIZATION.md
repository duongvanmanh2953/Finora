# FINORA AI — TOKEN OPTIMIZATION & COST ARCHITECTURE
## Intent Routing, Deterministic Pre-Calculation & Compact Serialization

- **Document ID:** `docs/FINORA_AI_TOKEN_OPTIMIZATION.md`
- **Revision:** 2.0.0
- **Goal:** Minimize token costs by 70–85% while guaranteeing 100% calculation accuracy.

---

## 1. THREE PILLARS OF TOKEN OPTIMIZATION

1. **Deterministic Calculation Offloading:**
   - LLMs are notoriously prone to floating-point errors, hallucinated percentages, and cumulative rounding drift.
   - All arithmetic (Sum, Average Buy Price, P&L, Remaining Budget, Safe-to-Spend, Runaway Days) is computed in TypeScript backend services. The LLM receives pre-calculated metrics and focuses purely on linguistic synthesis and actionable advice.

2. **Intent-Based Context Pruning:**
   - If the intent router detects `EXPENSE_ANALYSIS`, only the user's expense snapshot, relevant categories, and selected period are loaded.
   - Investment positions, insurance policies, and credit card interest tables are pruned from the context window.
   - If the user says "Chào bạn" (`GENERAL_CHAT`), zero financial tables are injected.

3. **Rolling Conversation Compression:**
   - Previous conversation turns are stored as a compact rolling summary rather than an endlessly growing array of raw JSON payloads.
   - Only the latest 2–3 messages are kept in verbatim format. Older turns are summarized into:
     `{ goal: "Tiết kiệm 50tr", currentTopic: "giảm chi tiêu ăn uống", pendingPlanId: "act-123" }`.

---

## 2. INTENT CLASSIFICATION TAXONOMY

```
User Message
     │
     ▼
[Intent Classifier (Fast Pattern / Light Model)]
     │
     ├── Greeting / Meta ──> [Zero Financial DB Context] (Cost: ~50 tokens)
     ├── Expense / Budget ─> [Expense + Budget Snapshots] (Cost: ~350 tokens)
     ├── Investment / SLTP ─> [Portfolio Snapshot + Quotes] (Cost: ~450 tokens)
     └── Batch Action ─────> [Action Planner + Validation] (Cost: ~600 tokens)
```
