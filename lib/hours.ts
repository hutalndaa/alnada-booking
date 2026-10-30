/**
 * ساعات العمل والتسعير حسب نوع اليوم (بتوقيت الرياض).
 * - الحجز فقط بين OPEN_HOUR و CLOSE_HOUR (الحجز ينتهي قبل الإغلاق).
 * - الجمعة والسبت + الإجازات المسجّلة من الإعدادات = سعر "نهاية الأسبوع والإجازات".
 */
export const OPEN_HOUR = 6;
export const CLOSE_HOUR = 23;
export const WEEKEND_DAYS = [5, 6]; // 5=الجمعة، 6=السبت

export const HOURS_TEXT = "من 6 صباحاً حتى 11 مساءً يومياً";
export const INQUIRY_TEXT = "من 3 مساءً حتى 10 مساءً";

const RIYADH_MS = 3 * 3600000;

/** تاريخ الرياض YYYY-MM-DD لوقت معيّن */
export function riyadhDate(iso: string | Date): string {
  return new Date(new Date(iso).getTime() + RIYADH_MS).toISOString().slice(0, 10);
}
/** ساعة ودقيقة بتوقيت الرياض */
export function riyadhHM(iso: string | Date): { h: number; m: number } {
  const d = new Date(new Date(iso).getTime() + RIYADH_MS);
  return { h: d.getUTCHours(), m: d.getUTCMinutes() };
}

export function parseHolidays(text: string | null | undefined): string[] {
  return String(text ?? "")
    .split(/[\s,،;]+/)
    .map((s) => s.trim())
    .filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s));
}

export function isPeakDay(dateStr: string, holidays: string[]): boolean {
  const dow = new Date(`${dateStr}T12:00:00Z`).getUTCDay();
  return WEEKEND_DAYS.includes(dow) || holidays.includes(dateStr);
}

export function hourlyFor(
  base: number | string,
  weekend: number | string | null | undefined,
  dateStr: string,
  holidays: string[]
): number {
  const w = weekend === null || weekend === undefined || weekend === "" ? NaN : Number(weekend);
  return isPeakDay(dateStr, holidays) && !isNaN(w) && w > 0 ? w : Number(base);
}

/** هل الحجز كله ضمن ساعات العمل؟ (يبدأ >= الفتح وينتهي <= الإغلاق، في نفس اليوم) */
export function withinOpeningHours(startIso: string | Date, endIso: string | Date): boolean {
  if (riyadhDate(startIso) !== riyadhDate(new Date(new Date(endIso).getTime() - 1))) return false;
  const s = riyadhHM(startIso);
  const e = riyadhHM(endIso);
  const endMinutes = e.h === 0 && e.m === 0 ? 24 * 60 : e.h * 60 + e.m;
  return s.h >= OPEN_HOUR && endMinutes <= CLOSE_HOUR * 60;
}
