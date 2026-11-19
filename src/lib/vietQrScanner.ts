/**
 * FINORA VIETQR & EMVCO QR PAYMENT PARSER
 *
 * Implements standard EMVCo QR Code specification adopted by NAPAS / VietQR:
 * - Decodes TLV (Tag-Length-Value) blocks.
 * - Extracts Beneficiary Bank BIN, Account Number, Recipient Name, Amount, and Payment Note.
 * - Maps Bank BIN to Vietnamese commercial banks.
 * - Generates banking app transfer intent deep links.
 */

export type QrPayloadType =
  | 'VIETQR_STATIC'
  | 'VIETQR_DYNAMIC'
  | 'INVOICE_RECEIPT'
  | 'URL_SAFE'
  | 'UNKNOWN';

export interface ParsedVietQrData {
  raw: string;
  isValidVietQr: boolean;
  qrType: QrPayloadType;
  bankBin?: string;
  bankName?: string;
  bankShortName?: string;
  accountNumber?: string;
  accountName?: string;
  amount?: number;
  currency?: string;
  content?: string;
  deepLink?: string;
  crcValid?: boolean;
  crcExpected?: string;
  crcActual?: string;
  merchantCity?: string;
  merchantPostalCode?: string;
  merchantInfo?: string;
  error?: string;
}

export const VIETNAM_BANK_BINS: Record<string, { shortName: string; name: string }> = {
  '970436': { shortName: 'VCB', name: 'Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)' },
  '970422': { shortName: 'MB', name: 'Ngân hàng TMCP Quân đội (MBBank)' },
  '970407': { shortName: 'TCB', name: 'Ngân hàng TMCP Kỹ thương Việt Nam (Techcombank)' },
  '970415': { shortName: 'CTG', name: 'Ngân hàng TMCP Công thương Việt Nam (VietinBank)' },
  '970418': { shortName: 'BIDV', name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam (BIDV)' },
  '970405': { shortName: 'Agribank', name: 'Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam' },
  '970423': { shortName: 'TPB', name: 'Ngân hàng TMCP Tiên Phong (TPBank)' },
  '970432': { shortName: 'VPB', name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank)' },
  '970403': { shortName: 'STB', name: 'Ngân hàng TMCP Sài Gòn Thương Tín (Sacombank)' },
  '970416': { shortName: 'ACB', name: 'Ngân hàng TMCP Á Châu (ACB)' },
  '970441': { shortName: 'VIB', name: 'Ngân hàng TMCP Quốc tế Việt Nam (VIB)' },
  '970454': { shortName: 'VietCapital', name: 'Ngân hàng TMCP Bản Việt (BVBank)' },
  '970425': { shortName: 'ABB', name: 'Ngân hàng TMCP An Bình (ABBANK)' },
  '970412': { shortName: 'PVcomBank', name: 'Ngân hàng TMCP Đại Chúng Việt Nam' },
  '970429': { shortName: 'SCB', name: 'Ngân hàng TMCP Sài Gòn' },
  '970443': { shortName: 'SHB', name: 'Ngân hàng TMCP Sài Gòn - Hà Nội' },
  '970437': { shortName: 'HDB', name: 'Ngân hàng TMCP Phát triển TP.HCM (HDBank)' },
  '970426': { shortName: 'MSB', name: 'Ngân hàng TMCP Hàng Hải Việt Nam (MSB)' },
  '970431': { shortName: 'Eximbank', name: 'Ngân hàng TMCP Xuất Nhập khẩu Việt Nam' },
  '970448': { shortName: 'OCB', name: 'Ngân hàng TMCP Phương Đông (OCB)' },
  '970438': { shortName: 'BaoViet', name: 'Ngân hàng TMCP Bảo Việt' },
  '970428': { shortName: 'NamABank', name: 'Ngân hàng TMCP Nam Á' }
};

/**
 * Computes CRC16-CCITT checksum according to EMVCo standard (polynomial 0x1021, init 0xFFFF)
 */
export function computeCrc16Ccitt(str: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    crc ^= (c << 8);
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * In-memory scan cache to prevent duplicate scanning within a session
 */
const sessionScanTimestamps = new Map<string, number>();

export function isDuplicateSessionScan(payload: string, windowMs = 3000): boolean {
  if (!payload) return false;
  const now = Date.now();
  const lastScanned = sessionScanTimestamps.get(payload);
  if (lastScanned && now - lastScanned < windowMs) {
    return true;
  }
  sessionScanTimestamps.set(payload, now);
  // Cleanup old entries
  if (sessionScanTimestamps.size > 200) {
    for (const [k, v] of sessionScanTimestamps.entries()) {
      if (now - v > 60000) sessionScanTimestamps.delete(k);
    }
  }
  return false;
}

/**
 * Parses raw EMVCo TLV string into nested key-value tags
 */
export function parseEmvcoTlv(qrString: string): Record<string, string> {
  const result: Record<string, string> = {};
  let index = 0;
  const len = qrString.length;

  while (index + 4 <= len) {
    const tag = qrString.substring(index, index + 2);
    const lengthStr = qrString.substring(index + 2, index + 4);
    const length = parseInt(lengthStr, 10);

    if (isNaN(length) || length < 0) {
      break;
    }

    const valueStart = index + 4;
    const valueEnd = valueStart + length;

    if (valueEnd > len) {
      break;
    }

    const value = qrString.substring(valueStart, valueEnd);
    result[tag] = value;
    index = valueEnd;
  }

  return result;
}

/**
 * Parses VietQR / EMVCo string into structured payment payload
 */
export function parseVietQr(qrText: string): ParsedVietQrData {
  if (!qrText || !qrText.trim()) {
    return { raw: qrText, isValidVietQr: false, qrType: 'UNKNOWN', error: 'Mã QR trống.' };
  }

  const clean = qrText.trim();

  // Check if it's an invoice / receipt QR (Vietnamese e-invoice format)
  if (
    clean.toUpperCase().includes('MST:') ||
    clean.toLowerCase().includes('hoadon') ||
    clean.toLowerCase().includes('hdon') ||
    clean.toLowerCase().includes('invoice') ||
    (clean.startsWith('{') && clean.includes('invoice'))
  ) {
    return {
      raw: clean,
      isValidVietQr: false,
      qrType: 'INVOICE_RECEIPT',
      content: 'Mã QR hóa đơn điện tử / biên lai',
      error: undefined
    };
  }

  // 1. Check if payload begins with EMVCo tag 000201
  if (!clean.startsWith('000201')) {
    // Check if it is a VietQR URL format like https://img.vietqr.io/image/970436-0011002345678-compact2.jpg?amount=150000&addInfo=An%20trua
    if (clean.includes('vietqr.io') || clean.includes('vietqr.net')) {
      return parseVietQrUrl(clean);
    }

    return {
      raw: clean,
      isValidVietQr: false,
      qrType: 'UNKNOWN',
      error: 'Không phải mã VietQR chuẩn EMVCo.'
    };
  }

  try {
    const rootTags = parseEmvcoTlv(clean);

    // Tag 01: Initiation method: 11 = Static, 12 = Dynamic
    const initMethod = rootTags['01'];
    const qrType: QrPayloadType = initMethod === '12' ? 'VIETQR_DYNAMIC' : 'VIETQR_STATIC';

    // Tag 38: Merchant Account Information (Consumer account for NAPAS)
    let bankBin: string | undefined;
    let accountNumber: string | undefined;
    let merchantInfo: string | undefined;

    if (rootTags['38']) {
      const tag38Sub = parseEmvcoTlv(rootTags['38']);
      merchantInfo = tag38Sub['00']; // e.g. A000000727 (NAPAS)
      if (tag38Sub['01']) {
        const bankInfoSub = parseEmvcoTlv(tag38Sub['01']);
        bankBin = bankInfoSub['00'];
        accountNumber = bankInfoSub['01'];
      }
    }

    // Tag 53: Transaction Currency (704 = VND)
    const currency = rootTags['53'] === '704' ? 'VND' : rootTags['53'] || 'VND';

    // Tag 54: Transaction Amount (Do not invent missing fields; if not present, undefined)
    let amount: number | undefined;
    if (rootTags['54']) {
      const num = parseFloat(rootTags['54']);
      if (!isNaN(num) && num > 0) amount = num;
    }

    // Tag 59: Merchant Name
    const accountName = rootTags['59'] || undefined;

    // Tag 60: Merchant City
    const merchantCity = rootTags['60'] || undefined;

    // Tag 62: Additional Data Field (Tag 08: Purpose of transaction, Tag 01: Bill number)
    let content: string | undefined;
    if (rootTags['62']) {
      const tag62Sub = parseEmvcoTlv(rootTags['62']);
      content = tag62Sub['08'] || tag62Sub['01'] || undefined;
    }

    // Tag 63: CRC16 Validation
    let crcValid: boolean | undefined;
    let crcExpected: string | undefined;
    let crcActual: string | undefined;

    const crcTagIndex = clean.lastIndexOf('6304');
    if (crcTagIndex !== -1 && crcTagIndex + 8 <= clean.length) {
      crcActual = clean.substring(crcTagIndex + 4, crcTagIndex + 8).toUpperCase();
      const stringToVerify = clean.substring(0, crcTagIndex + 4);
      crcExpected = computeCrc16Ccitt(stringToVerify);
      crcValid = crcActual === crcExpected;
    }

    // Look up Bank Name
    const bankMeta = bankBin ? VIETNAM_BANK_BINS[bankBin] : undefined;

    // Build Deep Link
    let deepLink: string | undefined;
    if (bankBin && accountNumber) {
      deepLink = generateVietQrDeepLink(bankBin, accountNumber, amount, content);
    }

    const isValidVietQr = !!(bankBin && accountNumber);

    return {
      raw: clean,
      isValidVietQr,
      qrType,
      bankBin,
      bankName: bankMeta?.name || (bankBin ? `Ngân hàng mã BIN ${bankBin}` : undefined),
      bankShortName: bankMeta?.shortName || bankBin,
      accountNumber,
      accountName,
      amount,
      currency,
      content,
      deepLink,
      merchantCity,
      merchantInfo,
      crcValid,
      crcExpected,
      crcActual
    };
  } catch (err: any) {
    return {
      raw: clean,
      isValidVietQr: false,
      qrType: 'UNKNOWN',
      error: `Lỗi phân tích cú pháp VietQR: ${err?.message || 'Định dạng không hợp lệ'}`
    };
  }
}

/**
 * Parses VietQR HTTP URLs (e.g. from generated QR stickers)
 */
function parseVietQrUrl(urlStr: string): ParsedVietQrData {
  try {
    const url = new URL(urlStr);
    const pathParts = url.pathname.split('/');
    const lastPart = pathParts[pathParts.length - 1]; // e.g. "970436-0011002345678-compact2.jpg"
    const infoPart = lastPart.replace(/\.(jpg|png|webp)$/i, '');
    const tokens = infoPart.split('-');

    const bankBin = tokens[0] || undefined;
    const accountNumber = tokens[1] || undefined;
    const bankMeta = bankBin ? VIETNAM_BANK_BINS[bankBin] : undefined;

    const amountStr = url.searchParams.get('amount');
    const amount = amountStr ? parseFloat(amountStr) : undefined;
    const content = url.searchParams.get('addInfo') || url.searchParams.get('memo') || undefined;

    return {
      raw: urlStr,
      isValidVietQr: !!(bankBin && accountNumber),
      qrType: 'VIETQR_STATIC',
      bankBin,
      bankName: bankMeta?.name,
      bankShortName: bankMeta?.shortName || bankBin,
      accountNumber,
      amount: amount && !isNaN(amount) ? amount : undefined,
      currency: 'VND',
      content,
      deepLink: generateVietQrDeepLink(bankBin || '', accountNumber || '', amount, content)
    };
  } catch {
    return { raw: urlStr, isValidVietQr: false, qrType: 'UNKNOWN', error: 'Đường dẫn VietQR không hợp lệ.' };
  }
}

/**
 * Generates universal VietQR quick transfer deep link
 */
export function generateVietQrDeepLink(
  bankBin: string,
  accountNumber: string,
  amount?: number,
  content?: string
): string {
  const bankCode = VIETNAM_BANK_BINS[bankBin]?.shortName?.toLowerCase() || bankBin;
  const baseUrl = `https://img.vietqr.io/image/${bankCode}-${accountNumber}-compact2.png`;
  const params = new URLSearchParams();

  if (amount && amount > 0) {
    params.set('amount', String(amount));
  }
  if (content) {
    params.set('addInfo', content);
  }

  const query = params.toString();
  return query ? `${baseUrl}?${query}` : baseUrl;
}
