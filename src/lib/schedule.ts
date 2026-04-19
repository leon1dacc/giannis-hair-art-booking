// Schedule per weekday (0 = Sunday ... 6 = Saturday)
// Each entry is an array of [startHour, startMin, endHour, endMin] ranges (inclusive start, exclusive end)
// Slots are generated every 30 minutes within each range.
export type Range = [number, number, number, number];

export const WEEKLY_RANGES: Record<number, Range[]> = {
  0: [], // Κυριακή — Κλειστά
  1: [], // Δευτέρα — Κλειστά
  2: [[9, 0, 14, 0], [17, 0, 20, 30]], // Τρίτη
  3: [[9, 0, 14, 0]], // Τετάρτη
  4: [[9, 0, 14, 0], [17, 0, 20, 30]], // Πέμπτη
  5: [[9, 0, 14, 0], [17, 0, 20, 30]], // Παρασκευή
  6: [[9, 0, 17, 0]], // Σάββατο
};

const pad = (n: number) => n.toString().padStart(2, "0");

export function generateSlots(dayOfWeek: number): string[] {
  const ranges = WEEKLY_RANGES[dayOfWeek] || [];
  const slots: string[] = [];
  for (const [sh, sm, eh, em] of ranges) {
    let h = sh;
    let m = sm;
    while (h < eh || (h === eh && m < em)) {
      slots.push(`${pad(h)}:${pad(m)}`);
      m += 30;
      if (m >= 60) {
        h += 1;
        m -= 60;
      }
    }
  }
  return slots;
}

export function isClosed(dayOfWeek: number): boolean {
  return (WEEKLY_RANGES[dayOfWeek] || []).length === 0;
}
