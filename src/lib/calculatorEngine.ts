/**
 * FINORA SAFE CALCULATOR ENGINE
 *
 * Deterministic mathematical expression evaluator without eval().
 * Supports: +, -, *, /, parentheses (), decimal points, unary signs.
 * Safely parses and evaluates arithmetic expressions with standard operator precedence.
 */

export interface CalculationResult {
  isValid: boolean;
  value: number | null;
  formatted: string;
  error?: string;
}

type TokenType = 'NUMBER' | 'OP' | 'LPAREN' | 'RPAREN';

interface Token {
  type: TokenType;
  value: string | number;
}

/**
 * Tokenizes raw input string into mathematical tokens.
 */
function tokenize(input: string): Token[] {
  const clean = input.replace(/\s+/g, '').replace(/,/g, '');
  const tokens: Token[] = [];
  let i = 0;

  while (i < clean.length) {
    const ch = clean[i];

    if (ch === '(') {
      tokens.push({ type: 'LPAREN', value: '(' });
      i++;
    } else if (ch === ')') {
      tokens.push({ type: 'RPAREN', value: ')' });
      i++;
    } else if (ch === '+' || ch === '-' || ch === '*' || ch === 'x' || ch === 'X' || ch === '/' || ch === ':') {
      const normalizedOp = ch === 'x' || ch === 'X' ? '*' : ch === ':' ? '/' : ch;
      tokens.push({ type: 'OP', value: normalizedOp });
      i++;
    } else if (/\d|\./.test(ch)) {
      let numStr = '';
      let hasDot = false;
      while (i < clean.length && (/\d/.test(clean[i]) || clean[i] === '.')) {
        if (clean[i] === '.') {
          if (hasDot) break;
          hasDot = true;
        }
        numStr += clean[i];
        i++;
      }
      tokens.push({ type: 'NUMBER', value: parseFloat(numStr) });
    } else {
      // Unknown character encountered
      throw new Error(`Ký tự không hợp lệ: "${ch}"`);
    }
  }

  return tokens;
}

/**
 * Evaluates tokens using Recursive Descent Parsing:
 * Grammar:
 * Expression := Term (('+' | '-') Term)*
 * Term       := Factor (('*' | '/') Factor)*
 * Factor     := ('+' | '-')? Primary
 * Primary    := NUMBER | '(' Expression ')'
 */
class ExpressionParser {
  private tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private consume(): Token {
    return this.tokens[this.pos++];
  }

  public parse(): number {
    if (this.tokens.length === 0) return 0;
    const result = this.parseExpression();
    if (this.pos < this.tokens.length) {
      throw new Error('Cú pháp biểu thức không hoàn chỉnh');
    }
    return result;
  }

  private parseExpression(): number {
    let left = this.parseTerm();

    while (this.pos < this.tokens.length) {
      const tok = this.peek();
      if (tok && tok.type === 'OP' && (tok.value === '+' || tok.value === '-')) {
        this.consume();
        const right = this.parseTerm();
        if (tok.value === '+') {
          left += right;
        } else {
          left -= right;
        }
      } else {
        break;
      }
    }

    return left;
  }

  private parseTerm(): number {
    let left = this.parseFactor();

    while (this.pos < this.tokens.length) {
      const tok = this.peek();
      if (tok && tok.type === 'OP' && (tok.value === '*' || tok.value === '/')) {
        this.consume();
        const right = this.parseFactor();
        if (tok.value === '*') {
          left *= right;
        } else {
          if (right === 0) {
            throw new Error('Lỗi chia cho số 0');
          }
          left /= right;
        }
      } else {
        break;
      }
    }

    return left;
  }

  private parseFactor(): number {
    const tok = this.peek();
    if (!tok) {
      throw new Error('Thiếu toán hạng');
    }

    // Unary plus or minus
    if (tok.type === 'OP' && (tok.value === '+' || tok.value === '-')) {
      this.consume();
      const factor = this.parseFactor();
      return tok.value === '-' ? -factor : factor;
    }

    if (tok.type === 'NUMBER') {
      this.consume();
      return tok.value as number;
    }

    if (tok.type === 'LPAREN') {
      this.consume(); // '('
      const val = this.parseExpression();
      const next = this.peek();
      if (!next || next.type !== 'RPAREN') {
        throw new Error('Thiếu dấu đóng ngoặc ")"');
      }
      this.consume(); // ')'
      return val;
    }

    throw new Error(`Cú pháp không mong đợi gần "${tok.value}"`);
  }
}

/**
 * Safely evaluates any mathematical expression string without using eval.
 */
export function safeEvaluate(expression: string): number {
  if (!expression || !expression.trim()) return 0;
  const tokens = tokenize(expression);
  const parser = new ExpressionParser(tokens);
  const result = parser.parse();
  if (!Number.isFinite(result)) {
    throw new Error('Kết quả tính toán không hợp lệ');
  }
  return result;
}

/**
 * Formats a currency amount into Vietnamese locale standard.
 */
export function formatMoney(val: number): string {
  return new Intl.NumberFormat('vi-VN').format(Math.round(val)) + ' ₫';
}

/**
 * Evaluates an expression and returns preview data for real-time UI display.
 */
export function evaluatePreview(expression: string): CalculationResult {
  const trimmed = expression?.trim() || '';
  if (!trimmed) {
    return { isValid: true, value: 0, formatted: '0 ₫' };
  }

  // If it's a simple number without operators
  if (/^\d+$/.test(trimmed.replace(/[\s,.]/g, ''))) {
    const cleanNum = parseFloat(trimmed.replace(/[\s,.]/g, ''));
    if (!isNaN(cleanNum)) {
      return { isValid: true, value: cleanNum, formatted: formatMoney(cleanNum) };
    }
  }

  try {
    const val = safeEvaluate(trimmed);
    return {
      isValid: true,
      value: val,
      formatted: formatMoney(val)
    };
  } catch (err: any) {
    return {
      isValid: false,
      value: null,
      formatted: '—',
      error: err?.message || 'Biểu thức chưa hoàn chỉnh'
    };
  }
}
