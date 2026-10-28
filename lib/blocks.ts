import { supabaseAdmin } from "@/lib/supabaseAdmin";

/** يحوّل نص tstzrange القادم من Postgres إلى بداية ونهاية */
export function parseRange(r: string): { start: Date; end: Date } | null {
  const m = r?.match(/^[\[(]"?([^",]+)"?,\s*"?([^")\]]+)"?[\])]$/);
  if (!m) return null;
  const start = new Date(m[1]);
  const end = new Date(m[2]);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
  return { start, end };
}

export function rangeLiteral(start: Date, end: Date) {
  return `[${start.toISOString()},${end.toISOString()})`;
}

/** هل الفترة (مع فاصل التنظيف بعدها) تتداخل مع فترة مقفلة من الإدارة؟ */
export async function hasBlockConflict(unitId: string, start: Date, end: Date, bufferMinutes = 0) {
  const { data } = await supabaseAdmin.from("blocked_dates").select("block_range").eq("unit_id", unitId);
  const endB = end.getTime() + bufferMinutes * 60000;
  return (data ?? []).some((b) => {
    const r = parseRange(b.block_range as unknown as string);
    return r && start.getTime() < r.end.getTime() && endB > r.start.getTime();
  });
}
