import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/authGuard";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * POST /api/admin/bookings/[id]/mark-paid
 * تأكيد دفع يدوي (كاش عند الاستلام مثلاً) - يقوم به موظف من لوحة التحكم.
 * هذا بديل مؤقت لحين ربط بوابة دفع فعلية؛ يستخدم نفس منطق التأكيد.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireStaff(req, ["owner", "operator"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data: existing } = await supabaseAdmin
    .from("bookings")
    .select("id, status, total_price")
    .eq("id", params.id)
    .single();

  if (!existing) return NextResponse.json({ error: "الحجز غير موجود" }, { status: 404 });
  if (!["pending", "confirmed"].includes(existing.status)) {
    return NextResponse.json({ error: "لا يمكن تأكيد دفع لهذا الحجز" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("bookings")
    .update({
      status: "confirmed",
      payment_status: "paid",
      paid_amount: existing.total_price,
      payment_method: "manual",
      payment_ref: `MANUAL-${auth.user.id.slice(0, 8)}-${Date.now()}`,
      paid_at: new Date().toISOString(),
    })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: "تعذر تأكيد الدفع" }, { status: 500 });
  return NextResponse.json({ booking: data });
}
