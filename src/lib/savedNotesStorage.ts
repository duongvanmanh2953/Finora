import type { Transaction } from '../types';

const STORAGE_KEY = 'finora_saved_quick_notes';

// Default starter notes if user has no prior history
export const DEFAULT_QUICK_NOTES = [
  'Cà phê sáng',
  'Ăn trưa',
  'Đổ xăng xe',
  'Đi chợ siêu thị',
  'Trà sữa',
  'Cơm tối',
  'Tiền điện nước',
  'Tiền phòng trọ',
  'Tiền mạng internet',
  'Mua sắm đồ dùng'
];

/**
 * Get the list of saved / recent notes, merging localStorage with recent transactions
 */
export function getSavedQuickNotes(transactions: Transaction[] = []): string[] {
  let localList: string[] = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      localList = JSON.parse(raw);
    }
  } catch {
    localList = [];
  }

  // Extract frequent/recent notes from actual transactions
  const txNotes: string[] = [];
  for (const t of transactions.slice(0, 50)) {
    const cleanName = (t.name || '').trim();
    const cleanNote = (t.note || '').trim();

    // Prefer name first, then note (avoid generic AI prefixes)
    const candidate = cleanName && !cleanName.startsWith('Nhập nhanh:') ? cleanName : cleanNote;
    if (
      candidate &&
      candidate.length >= 2 &&
      candidate.length <= 40 &&
      !candidate.startsWith('Nhập nhanh:') &&
      !candidate.startsWith('AI Command') &&
      !candidate.startsWith('Chuyển khoản từ')
    ) {
      // Remove any trailing amount if present like "Cơm trưa 45k" -> "Cơm trưa"
      const noteWithoutAmount = candidate.replace(/\s+(\d+(?:[.,]\d+)?\s*(k|tr|triệu|nghìn|đ|vnd)?)$/i, '').trim();
      const finalNote = noteWithoutAmount || candidate;
      if (!txNotes.includes(finalNote)) {
        txNotes.push(finalNote);
      }
    }
  }

  // Merge unique notes: localList first, then txNotes, then defaults
  const merged = Array.from(new Set([...localList, ...txNotes, ...DEFAULT_QUICK_NOTES]));
  return merged.slice(0, 25);
}

/**
 * Save a new note into local storage
 */
export function saveQuickNote(note: string): string[] {
  const clean = note.trim();
  if (!clean || clean.length < 2) return [];

  // Strip trailing amounts to keep note clean
  const noteWithoutAmount = clean.replace(/\s+(\d+(?:[.,]\d+)?\s*(k|tr|triệu|nghìn|đ|vnd)?)$/i, '').trim();
  const target = noteWithoutAmount || clean;

  try {
    let current: string[] = [];
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      current = JSON.parse(raw);
    }
    const updated = [target, ...current.filter(n => n.toLowerCase() !== target.toLowerCase())].slice(0, 30);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [target];
  }
}

/**
 * Remove a specific note from local storage
 */
export function removeQuickNote(noteToRemove: string): string[] {
  try {
    let current: string[] = [];
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      current = JSON.parse(raw);
    }
    const updated = current.filter(n => n.toLowerCase() !== noteToRemove.toLowerCase());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

/**
 * Find the most recent transaction matching this note
 */
export function findRecentTxByNote(note: string, transactions: Transaction[] = []): Transaction | undefined {
  const lower = note.toLowerCase().trim();
  return transactions.find(t => {
    const nameMatch = (t.name || '').toLowerCase().includes(lower);
    const noteMatch = (t.note || '').toLowerCase().includes(lower);
    return nameMatch || noteMatch;
  });
}
