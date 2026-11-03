# FINORA AI — PRODUCT SPECIFICATION
## Conversational Personal Financial Intelligence & Controlled Action System

- **Document ID:** `docs/FINORA_AI_PRODUCT_SPEC.md`
- **Revision:** 2.0.0
- **Status:** APPROVED & ACTIVE
- **Core Philosophy:** **"AI understands. Backend calculates. AI proposes. User approves. Backend executes."**

---

## 1. PRODUCT IDENTITY & MISSION

**Finora AI** is an intelligent personal financial operating system assistant designed specifically for Vietnamese users. It bridges conversational natural-language understanding with institutional-grade deterministic accounting, cash-flow forecasting, risk monitoring, and controlled financial ledger mutations.

### Core Value Propositions:
1. **Holistic Financial Context:** Understands the user's complete financial picture (Income, Expense, Accounts, Investments, Budgets, Savings, Debt, Insurance, Net Worth) via scoped, authorized backend tools.
2. **Deterministic Computing:** Mathematical and accounting calculations (P&L, budget limits, burn rate, average price, safe-to-spend) are executed strictly in verified backend engines. AI interprets and advises; it never hallucinates financial arithmetic.
3. **Draft Action Execution Workflow:** AI proposes structured, multi-item financial modifications (Action Plans). **All valid actions are selected by default**. Users review, modify inline, toggle selection, and explicitly confirm through a safety dialog before any production record is altered.
4. **Gold PRO Identity:** Premium intelligence tiers (deep scenario simulations, multi-asset risk optimization, cash-flow runaway forecasts) are unified under a sophisticated Gold visual identity (`#C99A32`) with server-side authorization enforcement.

---

## 2. USER INTENT CATEGORIES & EXAMPLES

Finora AI natively handles Vietnamese idioms, colloquial financial phrasing, and multi-turn conversational memory:

| Intent Category | Vietnamese Sample Queries | Action / Tool Resolution |
| :--- | :--- | :--- |
| `FINANCIAL_OVERVIEW` | "Tình hình tài chính của tôi hiện ra sao?", "Tôi còn an toàn để chi tiêu không?" | Queries True Spendable Balance, Net Worth, Daily Safe-to-Spend. |
| `EXPENSE_ANALYSIS` | "Tháng này tôi tiêu hết bao nhiêu?", "Khoản nào ngốn tiền nhất?" | Aggregates expense by category, identifies top spending items. |
| `BUDGET_ANALYSIS` | "Ngân sách ăn uống còn bao nhiêu?", "Tôi có bị lạm chi mục nào không?" | Compares actual spending against category limits, calculates % usage. |
| `INVESTMENT_ANALYSIS`| "Danh mục cổ phiếu đang lời hay lỗ?", "Có mã nào chạm ngưỡng cắt lỗ không?" | Retrieves position values, unrealized PnL, and SL/TP trigger states. |
| `ACTION_BUDGET_CREATE`| "Tạo ngân sách tháng này: ăn uống 3 triệu, đi lại 1 triệu, mua sắm 1,5 triệu." | Generates 3 draft `CREATE` budget actions, selected 3/3 by default. |
| `ACTION_TX_CREATE` | "Thêm 3 khoản chi: 50k ăn sáng, 30k gửi xe, 80k ăn trưa." | Generates 3 draft `CREATE` transaction actions, selected 3/3 by default. |
| `ACTION_INLINE_EDIT` | "Đổi ngân sách ăn uống thành 3,5 triệu." | Modifies pending draft action without duplicating records. |
| `SAVINGS_PLANNING` | "Tôi muốn tiết kiệm 50 triệu trong 6 tháng tới, mỗi tháng cần để dành bao nhiêu?" | Generates monthly contribution schedule and savings goal action. |
| `DEBT_MANAGEMENT` | "Tôi còn những khoản nợ nào sắp đến hạn thanh toán?" | Lists outstanding debts, due dates, and draft repayment actions. |

---

## 3. MULTI-TURN CONVERSATION MEMORY

Finora AI preserves context across conversational turns without forcing the user to repeat prior parameters:
- **Turn 1:** User: *"Tháng này tôi muốn tiết kiệm 5 triệu."*
- **Turn 2:** AI: *"Bạn muốn giữ mức tiết kiệm 5 triệu sau khi trừ các hóa đơn cố định chứ?"*
- **Turn 3:** User: *"Đúng rồi, hãy giảm bớt ngân sách mua sắm giúp tôi."*
- **Resolution:** The AI combines the 5,000,000 VND target from Turn 1 with current shopping budget figures to propose an exact reduction action.
