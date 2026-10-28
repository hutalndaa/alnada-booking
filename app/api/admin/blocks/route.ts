import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/authGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { rangeLiteral } from "@/lib/blocks";

// POST /api/admin/blocks - إغلاق فترة لكوخ (صيانة، استخدام شخصي...)
export async function POST(req: NextRequest) {
  const auth = await requireStaff(req, ["owner", "operator"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { unit_id, start_time, end_time, reason } = await req.json();
  const start = new Date(start_time);
  const end = new Date(end_time);
  if (!unit_id || isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
    return NextResponse.json({ error: "بيانات الإغلاق غير صحيحة" }, { status: 400 });
  }
  if (end.getTime() - start.getTime() > 31 * 24 * 3600 * 1000) {
    return NextResponse.json({ error: "أقصى مدة إغلاق 31 يوماً" }, { status: 400 });
  }

  // لا نقفل فترة فيها حجوزات قائمة - لازم تلغيها أولاً
  const { data: existing } = await supabaseAdmin
    .from("bookings")
    .select("guest_name, start_time, end_time, buffer_minutes")
    .eq("unit_id", unit_id)
    .in("status", ["pending", "confirmed"])
    .lt("start_time", end.toISOString())
    .gt("end_time", new Date(start.getTime() - 24 * 3600000).toISOString());
  const clash = (existing ?? []).find(
    (b) =>
      start.getTime() < new Date(b.end_time).getTime() + (b.buffer_minutes ?? 15) * 60000 &&
      end.getTime() > new Date(b.start_time).getTime()
  );
  if (clash) {
    return NextResponse.json(
      { error: `في حجز قائم على هذي الفترة (${clash.guest_name}). ألغِه أولاً ثم أغلق الفترة.` },
      { status: 409 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("blocked_dates")
    .insert({
      unit_id,
      block_range: rangeLiteral(start, end),
      reason: reason ? String(reason).trim().slice(0, 200) : null,
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: "تعذر إغلاق الفترة" }, { status: 500 });
  return NextResponse.json({ block: data }, { status: 201 });
}
