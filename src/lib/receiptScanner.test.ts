import { describe, it, expect } from 'vitest';
import { validateReceiptFile, parseReceiptText } from './receiptScanner';

describe('Phase 2.2 — Receipt Scanner OCR Parser', () => {
  it('xác thực kích thước và định dạng tệp ảnh biên lai hợp lệ', () => {
    const validFile = new File(['mock content'], 'receipt.jpg', { type: 'image/jpeg' });
    const res = validateReceiptFile(validFile);
    expect(res.valid).toBe(true);

    const invalidFile = new File(['mock text'], 'doc.pdf', { type: 'application/pdf' });
    const resInvalid = validateReceiptFile(invalidFile);
    expect(resInvalid.valid).toBe(false);
    expect(resInvalid.error).toBeDefined();
  });

  it('trích xuất đúng số tiền tổng cộng và tên nhà bán lẻ từ văn bản hóa đơn', () => {
    const sampleReceipt = `
      HIGHLANDS COFFEE NGUYEN VAN CU
      Phiếu thanh toán số: #HD84920
      Ngày: 15/11/2026 09:30
      1. Freeze Trà Xanh (L): 65.000
      2. Bánh mì thịt nướng: 29.000
      --------------------------------
      TỔNG CỘNG: 94.000 đ
      Thanh toán thẻ: 94.000 đ
    `;

    const parsed = parseReceiptText(sampleReceipt);
    expect(parsed.amount).toBe(94000);
    expect(parsed.merchantName).toContain('HIGHLANDS COFFEE');
    expect(parsed.date).toBe('2026-11-15');
    expect(parsed.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('trích xuất hóa đơn siêu thị có nhiều mặt hàng và dòng thành tiền', () => {
    const supermarketReceipt = `
      WINMART LANDMARK 81
      HÓA ĐƠN BÁN LẺ
      Ngày 12/11/2026
      Sữa chua Vinamilk: 32.000
      Táo Envy Mỹ: 120.000
      Bánh quy Oreo: 25.000
      THÀNH TIỀN: 177.000 đ
      Cảm ơn quý khách!
    `;

    const parsed = parseReceiptText(supermarketReceipt);
    expect(parsed.amount).toBe(177000);
    expect(parsed.merchantName).toContain('WINMART');
    expect(parsed.date).toBe('2026-11-12');
  });

  it('fallback an toàn khi biên lai không có dòng tổng cộng', () => {
    const textWithoutTotal = `
      Cửa hàng tạp hóa cô Ba
      Mua rau củ 45.000
    `;

    const parsed = parseReceiptText(textWithoutTotal);
    expect(parsed.amount).toBe(45000);
    expect(parsed.merchantName).toContain('Cửa hàng tạp hóa cô Ba');
  });
});
