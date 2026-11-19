export interface LegalDocument {
  id: string;
  key: 'terms' | 'privacy' | 'refund' | 'data_protection';
  title: string;
  version: string;
  status: 'published' | 'draft' | 'archived';
  effectiveDate: string;
  lastUpdated: string;
  author: string;
  content: string; // Markdown / Plain text formatted
  summary: string;
}

export interface UserConsentRecord {
  userId: string;
  documentKey: string;
  version: string;
  acceptedAt: string;
  channel: 'web' | 'mobile';
}

const DEFAULT_LEGAL_DOCS: LegalDocument[] = [
  {
    id: 'doc-terms-v1',
    key: 'terms',
    title: 'Điều Khoản Dịch Vụ (Terms of Service)',
    version: '1.2.0',
    status: 'published',
    effectiveDate: '2026-01-01',
    lastUpdated: '2026-03-15',
    author: 'Legal Dept (Finora VN)',
    summary: 'Quy định quyền, nghĩa vụ và phạm vi cung cấp dịch vụ quản lý tài sản cá nhân Finora.',
    content: `
### 1. Giới thiệu dịch vụ
Finora là ứng dụng hỗ trợ người dùng theo dõi tài chính cá nhân, quản trị dòng tiền, phân bổ danh mục đầu tư và mô phỏng kế hoạch tài sản. Ứng dụng **không phải tổ chức tín dụng**, không lưu ký tiền gửi và không thực hiện tư vấn đầu tư tài chính được cấp phép.

### 2. Trách nhiệm người dùng
- Người dùng chịu trách nhiệm về tính chính xác của số liệu tự nhập.
- Bảo mật thông tin tài khoản cá nhân, mã PIN và mật khẩu truy cập.
- Không sử dụng ứng dụng vào các mục đích rửa tiền hoặc gian lận tài chính.

### 3. Tuyên bố miễn trừ trách nhiệm
- Mọi số liệu dự phóng tương lai và điểm số rủi ro tốc kế đều dựa trên thuật toán mô phỏng toán học và giả định người dùng tự thiết lập.
- Finora không cam kết bất kỳ mức tỷ suất lợi nhuận nào trong thực tế.
    `.trim()
  },
  {
    id: 'doc-privacy-v1',
    key: 'privacy',
    title: 'Chính Sách Bảo Mật & Dữ Liệu Cá Nhân (Privacy Policy)',
    version: '3.0.0',
    status: 'published',
    effectiveDate: '2026-01-01',
    lastUpdated: '2026-11-10',
    author: 'Bộ phận Pháp chế & DPO Tích Sản',
    summary: 'Cam kết bảo vệ dữ liệu cá nhân theo Luật 91/2025/QH15, Nghị định 356/2025/NĐ-CP và kiến trúc Zero-Knowledge.',
    content: `
### 1. Căn cứ Pháp lý & Nguyên tắc Thu thập
Chính sách này được xây dựng tuân thủ nghiêm ngặt **Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15** và **Nghị định số 356/2025/NĐ-CP**. Hệ thống cam kết chỉ thu thập dữ liệu khi có sự đồng ý tự nguyện, rõ ràng và có thể kiểm chứng được từ người dùng.

### 2. Phân loại Dữ liệu Thu thập
- **Dữ liệu cá nhân cơ bản**: Họ và tên, địa chỉ email, thông tin thiết bị truy cập, nhật ký phiên đăng nhập.
- **Dữ liệu cá nhân nhạy cảm** *(theo điểm i, k khoản 1 Điều 4 Nghị định 356/2025/NĐ-CP)*:
  + Dữ liệu định danh tài khoản, mật khẩu băm bảo mật (scrypt).
  + Dữ liệu số dư tài khoản ngân hàng, dòng tiền thu chi, danh mục tài sản và cổ phiếu do người dùng tự nhập hoặc đồng bộ.
  + *Cam kết*: Mọi dữ liệu tài chính nhạy cảm chỉ phục vụ mục đích duy nhất là hiển thị biểu đồ và tính toán số liệu cho chính bạn, tuyệt đối không chia sẻ cho bên thứ ba vì mục đích thương mại hay quảng cáo hành vi.

### 3. Cam kết Kiến trúc Zero-Access & Mã hóa
- Toàn bộ dữ liệu số dư, sổ giao dịch và danh mục đầu tư được mã hóa chuẩn **AES-256-GCM** đầu cuối.
- Quản trị viên và nhân sự kỹ thuật **không có quyền truy cập xem nội dung giao dịch riêng tư** của người dùng.

### 4. Thời hạn Giải quyết Yêu cầu của Chủ thể Dữ liệu (Điều 5 NĐ 356/2025/NĐ-CP)
Người dùng có đầy đủ các quyền được biết, đồng ý, xem, chỉnh sửa, rút lại đồng ý và xóa dữ liệu:
- **Phản hồi và hướng dẫn thủ tục ban đầu**: Tối đa **02 ngày làm việc** kể từ khi nhận được yêu cầu.
- **Cung cấp bản sao / Trích xuất dữ liệu (CSV/JSON)**: Tối đa **10 ngày**.
- **Tiếp nhận rút lại đồng ý hoặc hạn chế xử lý**: Tối đa **15 ngày**.
- **Xóa vĩnh viễn dữ liệu tài khoản và lịch sử**: Tối đa **20 ngày**.

### 5. Kênh Liên hệ Tiếp nhận Yêu cầu DPO
- Email phụ trách bảo vệ dữ liệu: **hotro@tichsan.site** hoặc **dpo@tichsan.site**
- Kênh trực tuyến: Mục "Cài đặt tài khoản -> Xóa tài khoản vĩnh viễn" tích hợp sẵn trong ứng dụng.
    `.trim()
  },
  {
    id: 'doc-refund-v1',
    key: 'refund',
    title: 'Chính Sách Hoàn Tiền & Bảo Vệ Người Tiêu Dùng (Refund Policy)',
    version: '2.0.0',
    status: 'published',
    effectiveDate: '2026-01-01',
    lastUpdated: '2026-11-10',
    author: 'Bộ phận Chăm sóc Khách hàng & Tài chính',
    summary: 'Quy định bảo vệ quyền lợi người tiêu dùng theo Luật số 19/2023/QH15 và chính sách hoàn tiền 100% trong 7 ngày.',
    content: `
### 1. Căn cứ Bảo vệ Quyền lợi Người tiêu dùng
Tuân thủ **Luật Bảo vệ quyền lợi người tiêu dùng số 19/2023/QH15**, Tích Sản bảo đảm quyền được cung cấp thông tin minh bạch về giá trị, tính năng và quyền hoàn hủy dịch vụ số.

### 2. Chính sách Hoàn tiền 100% trong 7 Ngày
Người dùng đăng ký các gói cước trả phí (VIP Gold / Pro) được quyền yêu cầu hoàn tiền 100% trong vòng **7 ngày** đầu tiên kể từ thời điểm giao dịch kích hoạt nếu cảm thấy dịch vụ không đáp ứng nhu cầu.

### 3. Quy trình Tiếp nhận & Xử lý
- Tiếp nhận yêu cầu: Gửi email tới **hotro@tichsan.site** kèm mã đơn hàng hoặc địa chỉ email đăng ký.
- Thời gian xử lý: Chuyển khoản hoàn tiền qua mã VietQR hoặc số tài khoản ngân hàng trong vòng **24 - 48 giờ làm việc**.
    `.trim()
  },
  {
    id: 'doc-data-v1',
    key: 'data_protection',
    title: 'Quy Chuẩn Lưu Trữ Dữ Liệu & Minh Bạch Trí Tuệ Nhân Tạo',
    version: '2.0.0',
    status: 'published',
    effectiveDate: '2026-01-01',
    lastUpdated: '2026-11-10',
    author: 'Hội đồng Pháp lý & Kỹ thuật Tích Sản',
    summary: 'Tuân thủ quy định lưu trữ dữ liệu tại Việt Nam và tính minh bạch của Trợ lý AI theo Luật 134/2025/QH15.',
    content: `
### 1. Tuân thủ Khung Pháp lý Việt Nam 2026
Hệ thống tuân thủ toàn diện:
- **Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15** và **Nghị định số 356/2025/NĐ-CP** (thay thế Nghị định 13/2023/NĐ-CP).
- **Luật An ninh mạng số 24/2018/QH14** và **Nghị định số 53/2022/NĐ-CP**.
- **Luật Trí tuệ nhân tạo số 134/2025/QH15** (Điều 11 về minh bạch hệ thống tương tác AI).

### 2. Hạ tầng Lưu trữ Dữ liệu
Dữ liệu người dùng Việt Nam được ưu tiên lưu trữ an toàn trên các cụm máy chủ và bộ nhớ đệm đặt tại lãnh thổ Việt Nam. Khi sử dụng tính năng ngoại tuyến (Local-first Offline Mode), dữ liệu được bảo vệ an toàn ngay trong bộ nhớ IndexedDB thiết bị người dùng.

### 3. Minh bạch Trí tuệ Nhân tạo (AI Transparency)
- Trợ lý **Tích Sản AI** là hệ thống trí tuệ nhân tạo tương tác tự động. Khi trò chuyện hoặc xem phân tích, người dùng luôn được thông báo rõ ràng đang tương tác với AI.
- Các mô phỏng dòng tiền, biểu đồ kế hoạch tài sản hay kế hoạch phân bổ (Action Plan) do AI tạo ra chỉ mang tính chất tham khảo, hỗ trợ tính toán; **không phải là khuyến nghị đầu tư chứng khoán, bảo hiểm hay tư vấn tài chính ủy thác**.
    `.trim()
  }
];

export const legalService = {
  getDocuments: (): LegalDocument[] => {
    const saved = localStorage.getItem('finora:legal:docs');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return DEFAULT_LEGAL_DOCS;
  },

  getDocumentByKey: (key: string): LegalDocument | undefined => {
    const docs = legalService.getDocuments();
    return docs.find(d => d.key === key);
  },

  saveDocument: (doc: LegalDocument): void => {
    const docs = legalService.getDocuments();
    const idx = docs.findIndex(d => d.id === doc.id);
    let updated: LegalDocument[];
    if (idx >= 0) {
      updated = [...docs];
      updated[idx] = { ...doc, lastUpdated: new Date().toISOString().split('T')[0] };
    } else {
      updated = [doc, ...docs];
    }
    localStorage.setItem('finora:legal:docs', JSON.stringify(updated));
  }
};

