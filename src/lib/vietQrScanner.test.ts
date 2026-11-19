import { describe, it, expect } from 'vitest';
import { parseEmvcoTlv, parseVietQr, generateVietQrDeepLink } from './vietQrScanner';

describe('Finora VietQR & EMVCo Payment Scanner Engine', () => {
  it('1. Correctly decodes nested EMVCo TLV blocks', () => {
    // Tag 00 length 02 value 01, Tag 01 length 02 value 12
    const tlv = '000201010212';
    const result = parseEmvcoTlv(tlv);
    expect(result['00']).toBe('01');
    expect(result['01']).toBe('12');
  });

  it('2. Parses real standard VietQR payload with Bank BIN, Account, Amount, Note', () => {
    // Construct valid EMVCo VietQR sample:
    // 000201: Payload format
    // 010212: Dynamic QR
    // 3854: Subtag (0010A000000727: NAPAS GUID, 0124(0006970436: VCB BIN, 01100011002345: Acc), 0208QRIBFTTC)
    // 5303704: Currency VND
    // 5406150000: Amount 150000
    // 5802VN: Country VN
    // 5912NGUYEN VAN A: Recipient (length 12)
    // 62160812Tien an trua: Note (subtag 08 length 12, total length 16)
    const samplePayload =
      '000201010212' +
      '38540010A00000072701240006970436011000110023450208QRIBFTTC' +
      '5303704' +
      '5406150000' +
      '5802VN' +
      '5912NGUYEN VAN A' +
      '62160812Tien an trua';

    const parsed = parseVietQr(samplePayload);
    expect(parsed.isValidVietQr).toBe(true);
    expect(parsed.bankBin).toBe('970436');
    expect(parsed.bankShortName).toBe('VCB');
    expect(parsed.accountNumber).toBe('0011002345');
    expect(parsed.amount).toBe(150000);
    expect(parsed.accountName).toBe('NGUYEN VAN A');
    expect(parsed.content).toBe('Tien an trua');
    expect(parsed.deepLink).toContain('vietqr.io');
  });

  it('3. Parses VietQR web URL format', () => {
    const url = 'https://img.vietqr.io/image/970422-123456789-compact2.jpg?amount=500000&addInfo=Thanh%20toan%20hoa%20don';
    const parsed = parseVietQr(url);

    expect(parsed.isValidVietQr).toBe(true);
    expect(parsed.bankBin).toBe('970422');
    expect(parsed.bankShortName).toBe('MB');
    expect(parsed.accountNumber).toBe('123456789');
    expect(parsed.amount).toBe(500000);
    expect(parsed.content).toBe('Thanh toan hoa don');
  });

  it('4. Generates standard transfer deep links', () => {
    const deepLink = generateVietQrDeepLink('970436', '0011002345', 250000, 'Cafe');
    expect(deepLink).toContain('vcb-0011002345-compact2.png');
    expect(deepLink).toContain('amount=250000');
    expect(deepLink).toContain('addInfo=Cafe');
  });
});
