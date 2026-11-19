import { describe, it, expect } from 'vitest';
import {
  detectDelimiter,
  parseCsvLine,
  analyzeCsvStructure,
  parseDateString,
  parseCleanAmount,
  stageImportData,
  commitImportBatch,
  rollbackImportBatch
} from './importEngine';
import type { Category, Transaction } from '../types';

describe('Finora Data Import & Migration Engine', () => {
  it('1. Correctly detects delimiters and handles quoted CSV lines', () => {
    const csvComma = 'Ngày,Nội dung,Số tiền\n2026-11-01,"Cà phê, trà đá",45000';
    expect(detectDelimiter(csvComma)).toBe(',');

    const parsedLine = parseCsvLine('"Cà phê, trà đá",45000', ',');
    expect(parsedLine).toEqual(['Cà phê, trà đá', '45000']);

    const csvSemicolon = 'Date;Description;Amount\n2026-11-01;Lunch;120000';
    expect(detectDelimiter(csvSemicolon)).toBe(';');
  });

  it('2. Analyzes CSV headers and auto-suggests column mappings', () => {
    const csvContent = `Ngày giao dịch,Diễn giải,Số tiền,Danh mục,Loại
15/11/2026,Ăn trưa văn phòng,85000,Ăn uống,Chi tiêu
16/11/2026,Tiền thưởng dự án,5000000,Thu nhập,Thu`;

    const analysis = analyzeCsvStructure(csvContent);
    expect(analysis.headers).toContain('Ngày giao dịch');
    expect(analysis.headers).toContain('Số tiền');
    expect(analysis.suggestedMapping.dateCol).toBe('Ngày giao dịch');
    expect(analysis.suggestedMapping.amountCol).toBe('Số tiền');
    expect(analysis.suggestedMapping.nameCol).toBe('Diễn giải');
    expect(analysis.totalRows).toBe(2);
  });

  it('3. Robust date parsing (dd/MM/yyyy and ISO)', () => {
    expect(parseDateString('25/12/2026')).toBe('2026-12-25');
    expect(parseDateString('2026-11-19')).toBe('2026-11-19');
    expect(parseDateString('05-08-2026 14:30:00')).toBe('2026-08-05');
  });

  it('4. Robust amount parsing with negative flags', () => {
    expect(parseCleanAmount('150.000 ₫')).toEqual({ amount: 150000, isNegative: false });
    expect(parseCleanAmount('-250.000')).toEqual({ amount: 250000, isNegative: true });
    expect(parseCleanAmount('(500.000)')).toEqual({ amount: 500000, isNegative: true });
    expect(parseCleanAmount('1tr5')).toEqual({ amount: 1500000, isNegative: false });
  });

  it('5. Stages data, detects duplicates, and executes batch rollback', () => {
    const existing: Transaction[] = [
      {
        id: 'tx-old-1',
        name: 'Ăn trưa Highlands',
        amount: 85000,
        type: 'expense',
        categoryId: 'food',
        accountId: 'bank',
        date: '2026-11-15',
        method: 'Tiền mặt',
        note: '',
        status: 'completed'
      }
    ];

    const categories: Category[] = [
      { id: 'food', name: 'Ăn uống', type: 'expense', icon: 'Utensils', color: '#10b981', hidden: false }
    ];

    const rows = [
      { 'Ngày': '15/11/2026', 'Nội dung': 'Ăn trưa Highlands', 'Số tiền': '85.000', 'Danh mục': 'Ăn uống' },
      { 'Ngày': '16/11/2026', 'Nội dung': 'Đổ xăng xe máy', 'Số tiền': '100.000', 'Danh mục': 'Di chuyển' }
    ];

    const staged = stageImportData(
      rows,
      { dateCol: 'Ngày', nameCol: 'Nội dung', amountCol: 'Số tiền', categoryCol: 'Danh mục' },
      { 'Ăn uống': 'food' },
      'bank',
      existing,
      categories
    );

    expect(staged.length).toBe(2);
    // Row 1 should be flagged duplicate
    expect(staged[0].isDuplicate).toBe(true);
    // Row 2 should be valid and not duplicate
    expect(staged[1].isDuplicate).toBe(false);
    expect(staged[1].amount).toBe(100000);

    // Commit import batch
    const { newTransactions, batchRecord } = commitImportBatch(staged, 'statement.csv', true);
    expect(newTransactions.length).toBe(1); // duplicate skipped
    expect(batchRecord.importedCount).toBe(1);

    // Rollback batch
    const ledger = [...existing, ...newTransactions];
    const { remainingTransactions, rolledBackCount } = rollbackImportBatch(ledger, batchRecord.batchId);
    expect(rolledBackCount).toBe(1);
    expect(remainingTransactions.length).toBe(existing.length);
  });
});
