import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { notifyOwner, describeDuration, fmtWhen } from "@/lib/notify";

/**
 * POST /api/bookings/[id]/confirm
 * هذا المسار يُستدعى من Webhook بوابة الدفع (Moyasar أو غيرها) بعد نجاح
 * الدفع فعلياً - وليس من واجهة العميل مباشرة، عشان محد يقدر "يزوّر"
 * تأكيد الدفع بدون ما يدفع فعلاً.
 *
 * ⚠️ قبل التشغيل الفعلي: لازم تتحقق من توقيع/مصداقية الطلب القادم من
 * بوابة الدفع (كل بوابة عندها طريقتها - راجع توثيق البوابة المختارة).
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await req.json();
  const { payment_status, payment_ref, payment_method, amount } = body;

  if (payment_status !== "paid") {
    return NextResponse.json({ error: "حالة دفع غير صالحة" }, { status: 400 });
  }

  // نتأكد إن الحجز لسه صالح (لم تنتهِ مهلته) قبل ما نأكده
  const { data: existing } = await supabaseAdmin
    .from("bookings")
    .select("id, status, hold_expires_at, total_price")
    .eq("id", id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "الحجز غير موجود" }, { status: 404 });
  }
  if (existing.status === "expired" || existing.status === "cancelled") {
    return NextResponse.json(
      { error: "انتهت مهلة هذا الحجز قبل إتمام الدفع، الرجاء إعادة المحاولة" },
      { status: 410 }
    );
  }

  if (existing.status === "pending" && new Date(existing.hold_expires_at).getTime() < Date.now()) {
    return NextResponse.json(
      { error: "انتهت مهلة هذا الحجز قبل إتمام الدفع، الرجاء إعادة المحاولة" },
      { status: 410 }
    );
  }

  const { data: updated, error } = await supabaseAdmin
    .from("bookings")
    .update({
      status: "confirmed",
      payment_status: "paid",
      paid_amount: amount ?? existing.total_price,
      payment_method: payment_method ?? null,
      payment_ref: payment_ref ?? null,
      paid_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*, units(name)")
    .single();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "تعذر تأكيد الحجز" }, { status: 500 });
  }

  if (existing.status === "pending") {
    await notifyOwner(
      `✅ تم تأكيد حجز بعد الدفع\n${(updated as any).units?.name ?? ""}\nالعميل: ${updated.guest_name} - ${updated.guest_phone}\nالموعد: ${fmtWhen(updated.start_time)}\nالمدة: ${describeDuration(updated.start_time, updated.end_time)}\nالمبلغ: ${updated.total_price} ريال`
    );
  }

  return NextResponse.json({ booking: updated });
}
