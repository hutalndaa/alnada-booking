import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { parseRange } from "@/lib/blocks";

// GET /api/units/[id]/availability?date=YYYY-MM-DD&tz=180
// يرجّع الفترات المحجوزة (بدون أي بيانات شخصية) ليوم معيّن
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const date = req.nextUrl.searchParams.get("date");
  const tz = Number(req.nextUrl.searchParams.get("tz") ?? 180); // دقائق أمام UTC
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "تاريخ غير صحيح" }, { status: 400 });
  }
  const dayStart = new Date(new Date(`${date}T00:00:00Z`).getTime() - tz * 60000);
  const dayEnd = new Date(dayStart.getTime() + 24 * 3600 * 1000);

  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("start_time, end_time, buffer_minutes")
    .eq("unit_id", params.id)
    .in("status", ["pending", "confirmed"])
    .lt("start_time", dayEnd.toISOString())
    .gt("end_time", dayStart.toISOString());

  if (error) return NextResponse.json({ error: "تعذر جلب المواعيد" }, { status: 500 });
  const { data: blocks } = await supabaseAdmin.from("blocked_dates").select("block_range").eq("unit_id", params.id);
  const blockBusy = (blocks ?? [])
    .map((b) => parseRange(b.block_range as unknown as string))
    .filter((r): r is { start: Date; end: Date } => !!r && r.start < dayEnd && r.end > dayStart)
    .map((r) => ({ start_time: r.start.toISOString(), end_time: r.end.toISOString(), buffer_minutes: 0 }));

  return NextResponse.json({ busy: [...(data ?? []), ...blockBusy] });
}
