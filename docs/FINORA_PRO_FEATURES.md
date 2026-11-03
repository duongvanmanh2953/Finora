# FINORA — GOLD PRO FEATURE IDENTITY & SUBSCRIPTION ENTITLEMENTS
## Premium Visual Language, Access Control Gates & AI Quota Architecture

- **Document ID:** `docs/FINORA_PRO_FEATURES.md`
- **Revision:** 2.0.0
- **Visual Standard:** Gold Luxury Identity (`#C99A32`) according to `baoyu-design` and `design-taste-frontend`.

---

## 1. GOLD PRO VISUAL TOKENS

The PRO identity throughout Finora utilizes a consistent, refined Gold palette:
- **Primary Gold:** `#C99A32`
- **Dark Gold / Text:** `#A9791D`
- **Soft Gold Surface:** `#FFF5D9`
- **Subtle Gold Border:** `#EED99D`
- **Accompanying Iconography:** Crown (`Crown`), Sparkles (`Sparkles`), and a sleek `PRO` badge.

> [!NOTE]
> Gold is strictly reserved for the PRO subscription tier and premium intelligence features. It is never used for ordinary success indicators (which use Emerald `#16865B`) or investment profits.

---

## 2. PRO FEATURE MATRIX & QUOTA ENFORCEMENT

| Feature Capability | Gói Miễn Phí (Free) | Gói Cao Cấp (Pro) | Kiểm Soát Kỹ Thuật |
| :--- | :--- | :--- | :--- |
| **Trợ lý Finora AI (Chat)** | 5 lượt hội thoại / ngày | Không giới hạn hội thoại | Kiểm tra backend quota theo ngày |
| **Thực thi Action Plan (Batch)** | Tối đa 2 hành động / lần | Không giới hạn hành động | Kiểm định backend trước khi thực thi |
| **Dự báo Dòng tiền & Cháy túi** | Tối đa 7 ngày tới | 30–90 ngày chi tiết | Backend feature flag |
| **Phân tích Rủi ro & Tái cân bằng**| Cảnh báo cơ bản | Đề xuất tái cân bằng 1-chạm | Phân tích sâu danh mục |
| **Theo dõi SL/TP Đầu tư** | Tối đa 2 mã chứng khoán | Không giới hạn mã cổ phiếu/vàng | Engine SL/TP check |

---

## 3. GRACEFUL UPGRADE EXPERIENCE

When a Free user hits a PRO limitation:
1. The backend returns a structured `SUBSCRIPTION_REQUIRED` response (`{ code: 'PRO_REQUIRED', feature: 'ai_copilot', quota: 5 }`).
2. The UI renders a non-blocking, elegant Gold Upgrade Card explaining the benefit with an immediate `Nâng cấp ngay` button opening the [PricingDialog.tsx](file:///c:/Users/manhd/Downloads/Finora/src/components/PricingDialog.tsx).
