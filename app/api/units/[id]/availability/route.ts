import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

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
  return NextResponse.json({ busy: data ?? [] });
}
