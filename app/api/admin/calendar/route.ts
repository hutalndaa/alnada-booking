import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/authGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { parseRange } from "@/lib/blocks";

// GET /api/admin/calendar?date=YYYY-MM-DD&tz=180
// حجوزات وفترات إغلاق كل الأكواخ ليوم معيّن (للمالك والمشغل)
export async function GET(req: NextRequest) {
  const auth = await requireStaff(req, ["owner", "operator"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const date = req.nextUrl.searchParams.get("date");
  const tz = Number(req.nextUrl.searchParams.get("tz") ?? 180);
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "تاريخ غير صحيح" }, { status: 400 });
  }
  const dayStart = new Date(new Date(`${date}T00:00:00Z`).getTime() - tz * 60000);
  const dayEnd = new Date(dayStart.getTime() + 24 * 3600 * 1000);

  const [units, bookings, blocks] = await Promise.all([
    supabaseAdmin.from("units").select("id, name, status, base_hourly_price, capacity").order("created_at"),
    supabaseAdmin
      .from("bookings")
      .select("id, unit_id, guest_name, guest_phone, num_guests, start_time, end_time, buffer_minutes, status, payment_status, payment_method, total_price, notes")
      .in("status", ["pending", "confirmed"])
      .lt("start_time", dayEnd.toISOString())
      .gt("end_time", new Date(dayStart.getTime() - 3600000).toISOString()),
    supabaseAdmin.from("blocked_dates").select("id, unit_id, block_range, reason").limit(1000),
  ]);

  if (units.error || bookings.error || blocks.error) {
    return NextResponse.json({ error: "تعذر جلب بيانات التقويم" }, { status: 500 });
  }

  const dayBlocks = (blocks.data ?? [])
    .map((b) => {
      const r = parseRange(b.block_range as unknown as string);
      return r ? { id: b.id, unit_id: b.unit_id, reason: b.reason, start_time: r.start.toISOString(), end_time: r.end.toISOString() } : null;
    })
    .filter((b): b is NonNullable<typeof b> => !!b && new Date(b.start_time) < dayEnd && new Date(b.end_time) > dayStart);

  return NextResponse.json({ units: units.data, bookings: bookings.data, blocks: dayBlocks });
}
