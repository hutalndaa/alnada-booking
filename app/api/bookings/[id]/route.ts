import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// GET /api/bookings/[id] - بيانات محدودة لصفحة الدفع (المعرّف غير قابل للتخمين)
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { data } = await supabaseAdmin
    .from("bookings")
    .select("id, booking_no, total_price, payment_status, status, hold_expires_at, guest_name, start_time, end_time, units(name, location_url)")
    .eq("id", params.id)
    .single();
  if (!data) return NextResponse.json({ error: "الحجز غير موجود" }, { status: 404 });
  return NextResponse.json({ booking: data, server_now: new Date().toISOString() });
}
