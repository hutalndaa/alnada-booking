import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/authGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// PATCH /api/admin/bookings/[id] - تحديث الحالة (تأكيد يدوي / إلغاء)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireStaff(req, ["owner", "operator"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { status, payment_status } = await req.json();

  // تسجيل استرجاع مبلغ دفع متأخر (للمالك فقط، وفقط على حجز منتهي/ملغى ومدفوع)
  if (payment_status === "refunded") {
    if (auth.user.role !== "owner") {
      return NextResponse.json({ error: "للمالك فقط" }, { status: 403 });
    }
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .update({ payment_status: "refunded" })
      .eq("id", params.id)
      .eq("payment_status", "paid")
      .in("status", ["expired", "cancelled"])
      .select()
      .single();
    if (error || !data) return NextResponse.json({ error: "تعذر التحديث" }, { status: 400 });
    return NextResponse.json({ booking: data });
  }

  if (!["cancelled", "completed"].includes(status)) {
    return NextResponse.json({ error: "حالة غير مسموحة من هذا المسار" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("bookings")
    .update({ status })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: "تعذر التحديث" }, { status: 500 });
  return NextResponse.json({ booking: data });
}
