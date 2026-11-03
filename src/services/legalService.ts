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
    title: 'Chính Sách Bảo Mật (Privacy Policy)',
    version: '2.0.1',
    status: 'published',
    effectiveDate: '2026-01-01',
    lastUpdated: '2026-04-01',
    author: 'Data Protection Officer',
    summary: 'Cam kết Zero-Knowledge Architecture và quyền riêng tư tuyệt đối dữ liệu tài sản.',
    content: `
### 1. Nguyên tắc Zero-Access
Dữ liệu tài sản, số dư ngân hàng và danh mục cổ phiếu của bạn thuộc quyền sở hữu riêng của bạn. Đội ngũ quản trị Finora và Admin **không có quyền truy cập xem nội dung giao dịch riêng tư** của người dùng.

### 2. Mã hóa dữ liệu
Toàn bộ dữ liệu lưu trữ cục bộ và đồng bộ đám mây được mã hóa chuẩn AES-256 đầu cuối (End-to-End Encryption).

### 3. Quyền của chủ thể dữ liệu
Người dùng có quyền xuất toàn bộ dữ liệu ra tệp tin CSV/JSON bất kỳ lúc nào hoặc yêu cầu xóa vĩnh viễn toàn bộ tài khoản và lịch sử hệ thống.
    `.trim()
  },
  {
    id: 'doc-refund-v1',
    key: 'refund',
    title: 'Chính Sách Hoàn Tiền & Gói Cước Pro (Refund Policy)',
    version: '1.0.0',
    status: 'published',
    effectiveDate: '2026-01-01',
    lastUpdated: '2026-02-10',
    author: 'Finance & Billing',
    summary: 'Chính sách hoàn tiền trong vòng 7 ngày cho các gói cước Finora Pro trả phí.',
    content: `
### 1. Chính sách hoàn tiền 7 ngày
Người dùng nâng cấp gói cước Finora Pro được quyền yêu cầu hoàn tiền 100% trong vòng 7 ngày đầu tiên kể từ ngày thanh toán nếu cảm thấy không hài lòng với trải nghiệm sản phẩm.

### 2. Quy trình xử lý
Yêu cầu hoàn tiền được tiếp nhận qua email hỗ trợ hoặc mục Hỗ trợ khách hàng trong ứng dụng, xử lý qua chuyển khoản VietQR trong vòng 24-48 giờ làm việc.
    `.trim()
  },
  {
    id: 'doc-data-v1',
    key: 'data_protection',
    title: 'Chính Sách Lưu Trữ & Xử Lý Dữ Liệu',
    version: '1.1.0',
    status: 'published',
    effectiveDate: '2026-01-01',
    lastUpdated: '2026-03-20',
    author: 'Compliance Team',
    summary: 'Quy chuẩn tuân thủ bảo vệ dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP.',
    content: `
### 1. Tuân thủ Nghị định 13/2023/NĐ-CP
Hệ thống tuân thủ chặt chẽ các quy định pháp luật Việt Nam về bảo vệ dữ liệu cá nhân.

### 2. Lưu trữ tại Việt Nam
Dữ liệu người dùng được lưu trữ an toàn trên các hạ tầng máy chủ đặt tại lãnh thổ Việt Nam.
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

