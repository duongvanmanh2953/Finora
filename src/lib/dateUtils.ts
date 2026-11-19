/**
 * Finora / Tích Sản — Tiện ích định dạng ngày tháng chuẩn Việt Nam (dd/mm/yyyy)
 */

export function formatVnDate(dateInput?: string | Date | number | null): string {
  if (!dateInput) return '—';

  try {
    // Nếu là string dạng YYYY-MM-DD hoặc ISO string: 2026-11-13...
    if (typeof dateInput === 'string') {
      const trimmed = dateInput.trim();
      const match = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
      if (match) {
        const year = match[1];
        const month = match[2].padStart(2, '0');
        const day = match[3].padStart(2, '0');
        return `${day}/${month}/${year}`;
      }
    }

    const d = typeof dateInput === 'object' && dateInput instanceof Date
      ? dateInput
      : new Date(dateInput);

    if (isNaN(d.getTime())) {
      return String(dateInput);
    }

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
  } catch {
    return String(dateInput);
  }
}

export function formatVnDateTime(dateInput?: string | Date | number | null): string {
  if (!dateInput) return '—';

  try {
    const d = typeof dateInput === 'object' && dateInput instanceof Date
      ? dateInput
      : new Date(dateInput);

    if (isNaN(d.getTime())) {
      return String(dateInput);
    }

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${hours}:${minutes} ${day}/${month}/${year}`;
  } catch {
    return String(dateInput);
  }
}

export function formatVnMonth(monthInput?: string | Date | null): string {
  if (!monthInput) return '—';
  try {
    if (typeof monthInput === 'string') {
      const trimmed = monthInput.trim();
      const match = trimmed.match(/^(\d{4})-(\d{1,2})/);
      if (match) {
        return `${match[2].padStart(2, '0')}/${match[1]}`;
      }
    }
    const d = typeof monthInput === 'object' && monthInput instanceof Date ? monthInput : new Date(monthInput);
    if (!isNaN(d.getTime())) {
      const month = String(d.getMonth() + 1).padStart(2, '0');
      return `${month}/${d.getFullYear()}`;
    }
    return String(monthInput);
  } catch {
    return String(monthInput);
  }
}
