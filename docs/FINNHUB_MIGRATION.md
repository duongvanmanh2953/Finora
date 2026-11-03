# FINORA — EXTERNAL MARKET DATA INTEGRATION AUDIT
## Comprehensive Provider Review & Finnhub Migration Blueprint

- **Document ID:** `docs/FINNHUB_MIGRATION.md`
- **Revision:** 1.0.0
- **Status:** APPROVED & IN EXECUTION
- **Target Provider:** Finnhub Stock API (`https://finnhub.io/api/v1`)

---

## 1. EXECUTIVE SUMMARY & EXISTING ARCHITECTURE AUDIT

An exhaustive audit of the existing Finora codebase was conducted to identify all external market data dependencies, price quotation mechanisms, and portfolio valuation workflows.

### 1.1. Current Provider Inventory & Fragility Analysis

| Component / File | Old Mechanism | Provider / Source | Defect / Vulnerability |
| :--- | :--- | :--- | :--- |
| `src/lib/vietnamMarketService.ts` | Direct browser `fetch()` | `apipubaws.tcbs.com.vn/tcanalysis/v1/ticker/all` | Unofficial, undocumented public endpoint subject to CORS failure, rate-limiting, and unexpected breaking schema changes. |
| `src/lib/riskAndInsightEngine.ts` | Static Dictionary | Hardcoded in `MARKET_PRICES` (`FPT: 138000`, `VCB: 94500`) | Prices never update automatically; yields static unrealized PnL figures. |
| `src/lib/investmentEngine.ts` | Static Array | `VIETNAMESE_ASSET_CATALOG` preset constants | Limited ticker list; no real-time price updates for US or global instruments. |
| `src/components/InvestmentCascadingSelect.tsx` | LocalStorage cache + TCBS fetch | Client-side HTTP request | Directly calls external domain from browser; leaks user browsing intent to third-party endpoints. |
| `src/features/assets/Assets.tsx` | Static reference prices | In-memory store | Lacks live quote refresh, historical candlestick charting, and official market status indication. |

### 1.2. Old Data Flow Trace (Fragile Client-Side Coupling)

```
[Browser / React Component]
       │
       ▼ (Direct unauthenticated client fetch)
[apipubaws.tcbs.com.vn] ──(CORS / Network Error)──> [Fallback to Static TS Fixtures]
       │
       ▼
[LocalStorage Cache] ──> [Portfolio P/L Calculation]
```

### 1.3. New Architecture: Secure Backend Proxy & Provider-Agnostic Engine

```
[Browser / Finora UI]
       │
       ▼ (Calls ONLY internal backend endpoints)
[Finora Backend API: /api/market/*]
       │
   ┌───┴─────────────────────────────────────────────┐
   │ Finora Market Data Service Layer                │
   │ - Secure Server-Side Env: FINNHUB_API_KEY       │
   │ - Multi-Tier In-Memory Cache (Quotes, Candles)  │
   │ - Request Deduplication & Rate-Limit Backoff    │
   │ - Response Normalization & Validation           │
   │ - Sensitive Credential Redaction                │
   └───┬─────────────────────────────────────────────┘
       │
       ├──[Finnhub Official REST API (v1)]
       │     ├── GET /search
       │     ├── GET /quote
       │     ├── GET /stock/profile2
       │     ├── GET /stock/candle
       │     └── GET /stock/market-status
       │
       └──[Verified Domestic VN Catalog (Fallback)]
             └── Preserves Vietnamese domestic positions with manual/reference valuation
```

---

## 2. DATA INTEGRITY COMMITMENTS & SAFETY CONSTRAINTS

1. **Zero Client-Side Key Exposure:** `FINNHUB_API_KEY` is loaded exclusively in server runtime (`process.env.FINNHUB_API_KEY`). No `VITE_` prefix is ever used.
2. **Preservation of User Portfolio History:** Market quote updates only provide real-time valuation inputs (`currentUnitPrice`, `unrealizedPnL`). Historical purchase records, transaction timestamps, buy/sell lot fees, and cash flows are strictly immutable.
3. **No Fabricated Data on Failure:** When Finnhub returns an error, rate limit (429), or unsupported instrument status, Finora explicitly labels the asset as `data_unavailable` or `manual_valuation` with a timestamp, preserving the last known valid price rather than showing misleading zero or invented values.
4. **Domestic Market Honesty:** Finnhub's native exchange coverage for domestic Vietnamese exchanges (HOSE, HNX, UPCOM) is comprehensively documented, and domestic securities retain verified catalog references and manual entry without breaking user workflows.

---

## 3. IMPLEMENTATION ROADMAP

- **Phase 1:** Complete Architecture Audit (This Document).
- **Phase 2:** Secure Backend Environment Configuration (`.env.example`, `.env` git-ignore verification).
- **Phase 3:** Finnhub API Verification & Schema Validation (Endpoints: `/search`, `/quote`, `/stock/candle`, `/stock/profile2`, `/stock/market-status`).
- **Phase 4:** Vietnamese Market Coverage Verification & Documentation (`docs/FINNHUB_MARKET_COVERAGE.md`).
- **Phase 5 & 6:** Centralized Finnhub Backend Service Layer, Normalizer, In-Memory Caching & Rate Limiting.
- **Phase 7 & 8:** Rebuilding UI Search, Asset Details, Watchlist, SL/TP monitoring & Mutual Fund NAV workflows.
- **Phase 9 & 10:** Backend API Route Contract (`/api/market/*`) & Frontend Client Adapter.
- **Phase 11 & 12:** Freshness Indicators & Admin Integration Monitoring Panel.
- **Phase 13 & 14:** Automated Unit Testing Suite & Retirement of Obsolete Provider Calls.

