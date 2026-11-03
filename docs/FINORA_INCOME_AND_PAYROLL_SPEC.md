# FINORA — DYNAMIC SALARY, PAYROLL & TAX CALCULATION SPECIFICATION
## Variable Employment Income, Compulsory Social Insurance & Versioned Vietnamese PIT Engine

- **Document ID:** `docs/FINORA_INCOME_AND_PAYROLL_SPEC.md`
- **Revision:** 2.0.0
- **Legal Compliance:** Bộ luật Lao động 2019, Luật Thuế Thu nhập Cá nhân, Luật Bảo hiểm Xã hội Việt Nam

---

## 1. TỔNG QUAN VẤN ĐỀ THU NHẬP ĐỘNG

Các ứng dụng tài chính cá nhân truyền thống thường mắc lỗi nghiêm trọng khi giả định người dùng có một khoản thu nhập cố định lặp lại mỗi tháng (Flat Recurring Income). Trong thực tế tại thị trường lao động Việt Nam, thu nhập hàng tháng biến động mạnh do:
1. **Giai đoạn thử việc:** Nhận 85% lương chính thức theo Điều 26 Bộ luật Lao động.
2. **Biến động ngày công:** Số ngày làm việc thực tế khác ngày công tiêu chuẩn của tháng (tháng 28, 30, hoặc 31 ngày).
3. **Nghỉ không lương hoặc nghỉ chế độ:** Nghỉ ốm đau hưởng BHXH, nghỉ thai sản, nghỉ việc riêng không lương.
4. **Làm thêm giờ (Overtime):** Tiền lương làm thêm ngày thường (150%), cuối tuần (200%), ngày lễ (300%).
5. **Thưởng hiệu quả & Hoa hồng:** Thưởng dự án, thưởng Quý, lương tháng 13, hoa hồng bán hàng.
6. **Thu nhập đa nguồn:** Lương công ty, tiền làm việc tự do (Freelance - bị khấu trừ thuế 10% tại nguồn), kinh doanh phụ, cổ tức.
7. **Tháng không có thu nhập (Zero-Income Month):** Chuyển việc, nghỉ việc giữa chừng, thất nghiệp tạm thời.

Finora thiết kế phân hệ **Bảng lương Hàng tháng Độc lập (Monthly Payroll Ledger)**, tính toán chính xác tiền thực nhận (Net Take-Home Pay) sau bảo hiểm và thuế.

---

## 2. CƠ CẤU PHIẾU LƯƠNG HÀNG THÁNG (PAYROLL RECORD SCHEMA)

Mỗi tháng phát sinh một bản ghi lương độc lập với các trường dữ liệu:

```typescript
export interface PayrollRecord {
  id: string;
  userId: string;
  month: string;                     // Định dạng: YYYY-MM
  status: 'draft' | 'verified' | 'paid' | 'partial' | 'unpaid';
  
  // 1. Lương hợp đồng & Chế độ
  contractSalary: number;            // Mức lương ghi trên hợp đồng lao động
  isProbation: boolean;              // Có phải tháng thử việc không (mặc định 85%)
  probationRate: number;             // Tỷ lệ % (mặc định 0.85)
  baseSalaryForInsurance: number;    // Mức lương làm căn cứ đóng BHXH/BHYT/BHTN
  
  // 2. Chấm công
  standardWorkDays: number;          // Ngày công chuẩn của tháng (VD: 22 hoặc 26 ngày)
  actualWorkDays: number;            // Ngày công thực tế đi làm
  paidLeaveDays: number;             // Ngày phép năm hưởng nguyên lương
  unpaidLeaveDays: number;           // Ngày nghỉ không lương
  
  // 3. Làm thêm giờ (Overtime)
  overtimeWeekdayHours: number;      // Giờ OT ngày thường (hưởng 150%)
  overtimeWeekendHours: number;      // Giờ OT ngày nghỉ (hưởng 200%)
  overtimeHolidayHours: number;      // Giờ OT ngày lễ (hưởng 300%)
  overtimePayTotal: number;          // Tổng tiền làm thêm giờ
  overtimeTaxExemptPay: number;      // Phần tiền OT được miễn thuế TNCN
  
  // 4. Các khoản phụ cấp & Thưởng
  taxableAllowances: number;         // Phụ cấp chịu thuế (trách nhiệm, kiêm nhiệm, hiệu quả...)
  nonTaxableAllowances: number;      // Phụ cấp không chịu thuế (tiền ăn trưa trong định mức, trang phục, điện thoại...)
  performanceBonus: number;          // Thưởng KPI / Thưởng dự án
  salesCommission: number;           // Hoa hồng doanh số
  
  // 5. Tổng thu nhập (Gross Income)
  grossIncome: number;               // Tổng thu nhập trước thuế & bảo hiểm
  
  // 6. Trích trừ Bảo hiểm người lao động (10.5%)
  socialInsuranceEmployee: number;   // BHXH (8%)
  healthInsuranceEmployee: number;   // BHYT (1.5%)
  unemploymentInsuranceEmployee: number; // BHTN (1%)
  totalInsuranceEmployee: number;    // Tổng trích bảo hiểm (10.5%)
  
  // 7. Bảo hiểm người sử dụng lao động đóng (Tham chiếu, KHÔNG tính vào lương người dùng)
  socialInsuranceEmployer: number;   // BHXH công ty đóng (17.5%)
  healthInsuranceEmployer: number;   // BHYT công ty đóng (3%)
  unemploymentInsuranceEmployer: number; // BHTN công ty đóng (1%)
  workAccidentInsuranceEmployer: number; // BHTNLĐ-BNN (0.5%)
  totalInsuranceEmployer: number;    // Tổng bảo hiểm công ty đóng (21.5%)
  
  // 8. Thuế Thu nhập Cá nhân (PIT)
  personalDeduction: number;         // Giảm trừ gia cảnh bản thân (11,000,000 ₫)
  dependentCount: number;            // Số người phụ thuộc đã đăng ký MST
  dependentDeductionTotal: number;   // Tổng giảm trừ người phụ thuộc (count * 4,400,000 ₫)
  taxableIncome: number;             // Thu nhập chịu thuế
  assessableIncome: number;          // Thu nhập tính thuế (để đưa vào biểu 7 bậc)
  pitWithheld: number;               // Thuế TNCN tạm khấu trừ
  
  // 9. Lương Thực nhận (Net Salary)
  netSalary: number;                 // Gross - Bảo hiểm 10.5% - Thuế TNCN - Giảm trừ khác
  actualPaidDate?: string;           // Ngày tiền về tài khoản thực tế
  actualReceivedAmount?: number;     // Số tiền thực nhận vào tài khoản (đối soát khớp lệnh)
  targetAccountId?: string;          // Tài khoản ngân hàng nhận lương (VCB, TCB...)
}
```

---

## 3. CÔNG THỨC TÍNH TOÁN BẢO HIỂM BẮT BUỘC (SHUI)

Áp dụng quy định mới nhất của Luật BHXH và các Nghị định hướng dẫn của Chính phủ:
1. **Mức trích trừ của Người lao động:**
   - BHXH: $8\%$ $\times$ Mức lương đóng BH.
   - BHYT: $1.5\%$ $\times$ Mức lương đóng BH.
   - BHTN: $1\%$ $\times$ Mức lương đóng BH.
2. **Khống chế trần đóng bảo hiểm (Cap Rules):**
   - **Trần đóng BHXH & BHYT:** Tối đa bằng **20 lần mức lương cơ sở**.
   - **Trần đóng BHTN:** Tối đa bằng **20 lần mức lương tối thiểu vùng** theo địa bàn công ty hoạt động (Vùng I, II, III, IV).
3. **Quy tắc Bất khả xâm phạm trong Kế toán Finora:**
   - Các khoản đóng góp bảo hiểm của **Người sử dụng lao động (21.5%)** chỉ được lưu trữ nhằm mục đích thống kê quyền lợi bảo hiểm, **TUYỆT ĐỐI KHÔNG cộng vào thu nhập thực nhận bằng tiền mặt của người dùng**.

---

## 4. BỘ ĐỘNG CƠ TÍNH THUẾ TNCN LŨY TIẾN 7 BẬC (VERSIONED PIT ENGINE)

Hệ thống thiết kế công thức tính thuế độc lập theo phiên bản (`TaxRuleConfig`), có ngày hiệu lực và ngày hết hiệu lực, giúp dễ dàng thích ứng khi Quốc hội điều chỉnh mức giảm trừ gia cảnh hoặc bậc thuế mà không làm sai lệch lịch sử các năm cũ.

### 4.1. Cấu hình Giảm trừ Gia cảnh Hiện hành:
- Giảm trừ bản thân: $11.000.000\text{ ₫/tháng}$ ($132.000.000\text{ ₫/năm}$).
- Giảm trừ mỗi người phụ thuộc: $4.400.000\text{ ₫/người/tháng}$.

### 4.2. Biểu thuế Lũy tiến Từng phần 7 Bậc (Thu nhập từ Tiền lương, Tiền công):

| Bậc | Thu nhập tính thuế / tháng (Triệu VND) | Thuế suất | Cách tính nhanh (Triệu VND) |
| :---: | :--- | :---: | :--- |
| **1** | Đến 5 triệu | **5%** | $0.05 \times \text{TNTT}$ |
| **2** | Trên 5 triệu đến 10 triệu | **10%** | $0.1 \times \text{TNTT} - 0.25$ |
| **3** | Trên 10 triệu đến 18 triệu | **15%** | $0.15 \times \text{TNTT} - 0.75$ |
| **4** | Trên 18 triệu đến 32 triệu | **20%** | $0.2 \times \text{TNTT} - 1.65$ |
| **5** | Trên 32 triệu đến 52 triệu | **25%** | $0.25 \times \text{TNTT} - 3.25$ |
| **6** | Trên 52 triệu đến 80 triệu | **30%** | $0.3 \times \text{TNTT} - 5.85$ |
| **7** | Trên 80 triệu | **35%** | $0.35 \times \text{TNTT} - 9.85$ |

### 4.3. Thu nhập Vãng lai & Freelance:
- Đối với hợp đồng dịch vụ không ký HĐLĐ hoặc ký dưới 3 tháng có tổng mức trả thu nhập từ **2.000.000 ₫/lần** trở lên: Tạm khấu trừ thuế **10%** tại nguồn trước khi chi trả.

---

## 5. BÁO CÁO THUẾ & ĐỐI SOÁT QUYẾT TOÁN CUỐI NĂM

Phân hệ tiền lương Finora cung cấp:
1. **Lịch sử thu nhập tháng (Monthly Payroll Timeline):** Thống kê biến động Gross vs Net, số thuế và bảo hiểm đã trích trong từng tháng.
2. **Ước tính Quyết toán Thuế TNCN Năm (Annual PIT Reconciliation):**
   - Tổng hợp thu nhập cả năm.
   - Tính lại số thuế phải nộp thực tế theo quyết toán năm.
   - So sánh với tổng số thuế đã tạm khấu trừ hàng tháng $\rightarrow$ Cho biết người dùng **được hoàn thuế** hay **phải nộp thêm**.

