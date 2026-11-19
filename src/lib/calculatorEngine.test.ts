import { describe, it, expect } from 'vitest';
import { safeEvaluate, evaluatePreview } from './calculatorEngine';

describe('Finora Safe Calculator Engine', () => {
  it('evaluates simple addition and subtraction correctly', () => {
    expect(safeEvaluate('150000 + 35000 - 20000')).toBe(165000);
    expect(safeEvaluate('100 + 200')).toBe(300);
    expect(safeEvaluate('500 - 150')).toBe(350);
  });

  it('respects operator precedence (* and / before + and -)', () => {
    expect(safeEvaluate('10 + 20 * 3')).toBe(70);
    expect(safeEvaluate('100 - 50 / 2')).toBe(75);
    expect(safeEvaluate('4 * 5 + 6 * 7')).toBe(62);
  });

  it('handles parentheses correctly', () => {
    expect(safeEvaluate('(10 + 20) * 3')).toBe(90);
    expect(safeEvaluate('100 / (2 + 3)')).toBe(20);
    expect(safeEvaluate('((2 + 3) * 4) - 5')).toBe(15);
  });

  it('supports alternative operators like x, X, and :', () => {
    expect(safeEvaluate('50000 x 3')).toBe(150000);
    expect(safeEvaluate('100000 : 2')).toBe(50000);
    expect(safeEvaluate('25000 X 4')).toBe(100000);
  });

  it('handles decimals and unary signs', () => {
    expect(safeEvaluate('12.5 + 7.5')).toBe(20);
    expect(safeEvaluate('-50000 + 100000')).toBe(50000);
    expect(safeEvaluate('+25000 * 2')).toBe(50000);
  });

  it('throws error on division by zero', () => {
    expect(() => safeEvaluate('100 / 0')).toThrow(/chia cho số 0/i);
    expect(() => safeEvaluate('100 / (5 - 5)')).toThrow(/chia cho số 0/i);
  });

  it('throws error on unmatched parentheses', () => {
    expect(() => safeEvaluate('(10 + 20')).toThrow(/đóng ngoặc/i);
  });

  it('provides real-time calculation preview for UI', () => {
    const preview1 = evaluatePreview('150000 + 35000 - 20000');
    expect(preview1.isValid).toBe(true);
    expect(preview1.value).toBe(165000);
    expect(preview1.formatted).toContain('165');

    const previewIncomplete = evaluatePreview('150000 +');
    expect(previewIncomplete.isValid).toBe(false);
    expect(previewIncomplete.error).toBeDefined();

    const previewEmpty = evaluatePreview('');
    expect(previewEmpty.isValid).toBe(true);
    expect(previewEmpty.value).toBe(0);
  });
});
