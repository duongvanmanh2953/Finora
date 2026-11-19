/**
 * FINORA BANK APP REGISTRY & PAYMENT HANDOFF ADAPTER
 *
 * Configurable registry of Vietnamese commercial banks & digital wallets:
 * - Distinguishes Destination Bank (encoded in QR) vs Paying Bank (selected by user).
 * - Maps official Android package IDs, iOS URL schemes, and Universal deep links.
 * - Provides graceful clipboard fallback when prefilled deep links are restricted.
 */

import type { PaymentIntent } from '../../types';

export interface BankAppAdapter {
  id: string; // Identifier: vcb, mb, tcb, ctg, bidv, vpb, tpb, acb, stb, vib, momo, zalopay, cake, timo
  name: string;
  shortName: string;
  bin?: string;
  brandColor: string;
  textColor: string;
  androidPackageId: string;
  iosUrlScheme: string;
  universalLink?: string;
  supportsDirectDeeplink: boolean;
  supportsQrImport: boolean;
  compatibilityStatus: 'SUPPORTED' | 'CLIPBOARD_FALLBACK' | 'EXPERIMENTAL';
  fallbackStrategy: 'CLIPBOARD_AND_OPEN' | 'VIETQR_UNIVERSAL_LINK';
}

export interface PaymentHandoffPlan {
  bank: BankAppAdapter;
  primaryDeeplink: string;
  fallbackUrl: string;
  clipboardText: string;
  instructions: string;
  canDirectLaunch: boolean;
}

export const BANK_APP_REGISTRY: BankAppAdapter[] = [
  {
    id: 'vcb',
    name: 'Vietcombank (VCB Digibank)',
    shortName: 'Vietcombank',
    bin: '970436',
    brandColor: '#005f37',
    textColor: '#ffffff',
    androidPackageId: 'com.vcbmobile',
    iosUrlScheme: 'vcb://',
    universalLink: 'https://vcbdigibank.vietcombank.com.vn',
    supportsDirectDeeplink: true,
    supportsQrImport: true,
    compatibilityStatus: 'SUPPORTED',
    fallbackStrategy: 'CLIPBOARD_AND_OPEN'
  },
  {
    id: 'mb',
    name: 'MBBank (Quân Đội)',
    shortName: 'MBBank',
    bin: '970422',
    brandColor: '#1039bb',
    textColor: '#ffffff',
    androidPackageId: 'com.mbmobile',
    iosUrlScheme: 'mbcustom://',
    universalLink: 'https://mbbank.com.vn',
    supportsDirectDeeplink: true,
    supportsQrImport: true,
    compatibilityStatus: 'SUPPORTED',
    fallbackStrategy: 'CLIPBOARD_AND_OPEN'
  },
  {
    id: 'tcb',
    name: 'Techcombank Mobile',
    shortName: 'Techcombank',
    bin: '970407',
    brandColor: '#e30613',
    textColor: '#ffffff',
    androidPackageId: 'vn.com.techcombank.bb.app',
    iosUrlScheme: 'tcb://',
    universalLink: 'https://techcombank.com',
    supportsDirectDeeplink: true,
    supportsQrImport: true,
    compatibilityStatus: 'SUPPORTED',
    fallbackStrategy: 'CLIPBOARD_AND_OPEN'
  },
  {
    id: 'ctg',
    name: 'VietinBank iPay',
    shortName: 'VietinBank',
    bin: '970415',
    brandColor: '#004f9e',
    textColor: '#ffffff',
    androidPackageId: 'com.vietinbank.ipay',
    iosUrlScheme: 'vietinbankipay://',
    universalLink: 'https://ipay.vietinbank.vn',
    supportsDirectDeeplink: true,
    supportsQrImport: true,
    compatibilityStatus: 'SUPPORTED',
    fallbackStrategy: 'CLIPBOARD_AND_OPEN'
  },
  {
    id: 'bidv',
    name: 'BIDV SmartBanking',
    shortName: 'BIDV',
    bin: '970418',
    brandColor: '#1d428a',
    textColor: '#ffffff',
    androidPackageId: 'com.vnpay.bidv',
    iosUrlScheme: 'bidvsmartbanking://',
    universalLink: 'https://bidv.com.vn',
    supportsDirectDeeplink: true,
    supportsQrImport: true,
    compatibilityStatus: 'SUPPORTED',
    fallbackStrategy: 'CLIPBOARD_AND_OPEN'
  },
  {
    id: 'vpb',
    name: 'VPBank NEO',
    shortName: 'VPBank',
    bin: '970432',
    brandColor: '#009a44',
    textColor: '#ffffff',
    androidPackageId: 'com.vnpay.vpbankonline',
    iosUrlScheme: 'vpbankneo://',
    universalLink: 'https://vpbank.com.vn',
    supportsDirectDeeplink: true,
    supportsQrImport: true,
    compatibilityStatus: 'SUPPORTED',
    fallbackStrategy: 'CLIPBOARD_AND_OPEN'
  },
  {
    id: 'tpb',
    name: 'TPBank Mobile',
    shortName: 'TPBank',
    bin: '970423',
    brandColor: '#842284',
    textColor: '#ffffff',
    androidPackageId: 'com.tpb.mb.gprsandroid',
    iosUrlScheme: 'tpbank://',
    universalLink: 'https://tpb.vn',
    supportsDirectDeeplink: true,
    supportsQrImport: true,
    compatibilityStatus: 'SUPPORTED',
    fallbackStrategy: 'CLIPBOARD_AND_OPEN'
  },
  {
    id: 'acb',
    name: 'ACB ONE',
    shortName: 'ACB',
    bin: '970416',
    brandColor: '#005baa',
    textColor: '#ffffff',
    androidPackageId: 'mobile.acb.com.vn',
    iosUrlScheme: 'acbone://',
    universalLink: 'https://acb.com.vn',
    supportsDirectDeeplink: true,
    supportsQrImport: true,
    compatibilityStatus: 'SUPPORTED',
    fallbackStrategy: 'CLIPBOARD_AND_OPEN'
  },
  {
    id: 'stb',
    name: 'Sacombank Pay',
    shortName: 'Sacombank',
    bin: '970403',
    brandColor: '#0054a6',
    textColor: '#ffffff',
    androidPackageId: 'com.vnpay.sacombank',
    iosUrlScheme: 'sacombank://',
    supportsDirectDeeplink: true,
    supportsQrImport: true,
    compatibilityStatus: 'SUPPORTED',
    fallbackStrategy: 'CLIPBOARD_AND_OPEN'
  },
  {
    id: 'vib',
    name: 'MyVIB 2.0',
    shortName: 'VIB',
    bin: '970441',
    brandColor: '#00529c',
    textColor: '#ffffff',
    androidPackageId: 'com.vib.myvib2',
    iosUrlScheme: 'myvib2://',
    supportsDirectDeeplink: true,
    supportsQrImport: true,
    compatibilityStatus: 'SUPPORTED',
    fallbackStrategy: 'CLIPBOARD_AND_OPEN'
  },
  {
    id: 'momo',
    name: 'Ví MoMo',
    shortName: 'MoMo',
    brandColor: '#a50064',
    textColor: '#ffffff',
    androidPackageId: 'com.mservice.momotransfer',
    iosUrlScheme: 'momo://',
    supportsDirectDeeplink: true,
    supportsQrImport: true,
    compatibilityStatus: 'SUPPORTED',
    fallbackStrategy: 'CLIPBOARD_AND_OPEN'
  },
  {
    id: 'zalopay',
    name: 'Ví ZaloPay',
    shortName: 'ZaloPay',
    brandColor: '#0068ff',
    textColor: '#ffffff',
    androidPackageId: 'vn.com.vng.zalopay',
    iosUrlScheme: 'zalopay://',
    supportsDirectDeeplink: true,
    supportsQrImport: true,
    compatibilityStatus: 'SUPPORTED',
    fallbackStrategy: 'CLIPBOARD_AND_OPEN'
  },
  {
    id: 'cake',
    name: 'Cake by VPBank',
    shortName: 'Cake',
    brandColor: '#e0006f',
    textColor: '#ffffff',
    androidPackageId: 'xyz.be.cake',
    iosUrlScheme: 'cake://',
    supportsDirectDeeplink: true,
    supportsQrImport: true,
    compatibilityStatus: 'SUPPORTED',
    fallbackStrategy: 'CLIPBOARD_AND_OPEN'
  },
  {
    id: 'timo',
    name: 'Timo Digital Bank',
    shortName: 'Timo',
    brandColor: '#7a3e9d',
    textColor: '#ffffff',
    androidPackageId: 'com.timo.bank',
    iosUrlScheme: 'timo://',
    supportsDirectDeeplink: true,
    supportsQrImport: true,
    compatibilityStatus: 'SUPPORTED',
    fallbackStrategy: 'CLIPBOARD_AND_OPEN'
  }
];

/**
 * Resolves a bank adapter by ID or BIN code
 */
export function getBankAppById(idOrBin: string): BankAppAdapter | undefined {
  if (!idOrBin) return undefined;
  const clean = idOrBin.toLowerCase().trim();
  return (
    BANK_APP_REGISTRY.find(b => b.id === clean) ||
    BANK_APP_REGISTRY.find(b => b.bin === clean) ||
    BANK_APP_REGISTRY.find(b => b.shortName.toLowerCase() === clean)
  );
}

/**
 * Creates structured handoff plan for transferring from Tích Sản to selected Bank Application
 */
export function createPaymentHandoffPlan(
  payingBankId: string,
  intent: PaymentIntent
): PaymentHandoffPlan {
  const bank = getBankAppById(payingBankId) || BANK_APP_REGISTRY[0];

  // 1. Prepare formatted clipboard copy text
  const amountStr = intent.amount ? `${intent.amount.toLocaleString('vi-VN')} ₫` : 'Tùy chọn';
  const clipboardText = [
    `Ngân hàng nhận: ${intent.destination_bank}`,
    `Số tài khoản: ${intent.destination_account}`,
    intent.beneficiary_name ? `Người nhận: ${intent.beneficiary_name}` : null,
    intent.amount ? `Số tiền: ${amountStr}` : null,
    intent.transfer_description ? `Nội dung: ${intent.transfer_description}` : null
  ]
    .filter(Boolean)
    .join('\n');

  // 2. Build deep links
  const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
  const isIos = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);

  let primaryDeeplink = bank.iosUrlScheme;
  if (isAndroid) {
    // Android Intent URI targeting specific bank package
    primaryDeeplink = `intent://#Intent;package=${bank.androidPackageId};scheme=${bank.iosUrlScheme.replace('://', '')};end;`;
  } else if (isIos) {
    primaryDeeplink = bank.iosUrlScheme;
  }

  // Fallback URL (Play Store / App Store or universal link)
  const fallbackUrl = isAndroid
    ? `https://play.google.com/store/apps/details?id=${bank.androidPackageId}`
    : bank.universalLink || 'https://vietqr.net';

  return {
    bank,
    primaryDeeplink,
    fallbackUrl,
    clipboardText,
    instructions: `Đã sao chép thông tin thanh toán. Chuyển sang ứng dụng ${bank.shortName} để xác nhận chuyển tiền. Tích Sản sẽ tự động bắt biến động số dư và hoàn tất giao dịch.`,
    canDirectLaunch: true
  };
}
