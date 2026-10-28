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

  const { data: existing } = await supabaseAdmin
    .from("bookings")
    .select("id, booking_no, status, payment_status, hold_expires_at, total_price, notes")
    .eq("id", id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "الحجز غير موجود" }, { status: 404 });
  }

  // تكرار نفس الإشعار (البوابات ترسل Webhook أكثر من مرة): لا نغيّر شيء
  if (existing.status === "confirmed" || existing.status === "completed") {
    return NextResponse.json({ booking: existing, already: true });
  }

  const paidAmount = amount ?? existing.total_price;
  const payFields = {
    payment_status: "paid",
    paid_amount: paidAmount,
    payment_method: payment_method ?? null,
    payment_ref: payment_ref ?? null,
    paid_at: new Date().toISOString(),
  };
  const holdElapsed =
    existing.status === "pending" && new Date(existing.hold_expires_at).getTime() < Date.now();
  const isLate = existing.status === "expired" || holdElapsed;

  // نحاول التأكيد. لو الحجز انتهى (expired) نحاول "إحياءه": قيد قاعدة البيانات (EXCLUDE)
  // يرفض التأكيد تلقائياً إذا الوقت انحجز لعميل آخر (23P01)، فلا يصير حجزان متعارضان أبداً.
  if (existing.status === "pending" || existing.status === "expired") {
    const { data: updated, error } = await supabaseAdmin
      .from("bookings")
      .update({
        status: "confirmed",
        ...payFields,
        ...(isLate ? { notes: [existing.notes, "دفع متأخر بعد انتهاء المهلة، الوقت كان متاحاً فتم التأكيد"].filter(Boolean).join(" | ") } : {}),
      })
      .eq("id", id)
      .in("status", ["pending", "expired"])
      .select("*, units(name)")
      .single();

    if (!error && updated) {
      await notifyOwner(
        `${isLate ? "⏱️ تم تأكيد حجز بعد دفع متأخر" : "✅ تم تأكيد حجز بعد الدفع"}\nرقم الحجز: ${updated.booking_no}\n${(updated as any).units?.name ?? ""}\nالعميل: ${updated.guest_name} - ${updated.guest_phone}\nالموعد: ${fmtWhen(updated.start_time)}\nالمدة: ${describeDuration(updated.start_time, updated.end_time)}\nالمبلغ: ${updated.total_price} ريال`
      );
      return NextResponse.json({ booking: updated, late: isLate });
    }

    if (error && error.code !== "23P01") {
      console.error(error);
      return NextResponse.json({ error: "تعذر تأكيد الحجز" }, { status: 500 });
    }
  }

  // وصلنا هنا = الدفع وصل لكن الوقت انحجز لغيره (تعارض) أو الحجز ملغى.
  // لا نؤكد حجزاً متعارضاً. نسجّل أن المبلغ مدفوع ومطلوب استرجاعه كاملاً ونبلّغ المالك.
  await supabaseAdmin
    .from("bookings")
    .update({
      ...payFields,
      notes: [existing.notes, "⚠️ دفع وصل بعد انتهاء المهلة والوقت محجوز لغيره: يلزم استرجاع المبلغ كاملاً"].filter(Boolean).join(" | "),
    })
    .eq("id", id)
    .in("status", ["expired", "cancelled"]);

  await notifyOwner(
    `⚠️ دفع متأخر يحتاج استرجاع\nرقم الحجز: ${existing.booking_no}\nالمبلغ المدفوع: ${paidAmount} ريال\nالمرجع: ${payment_ref ?? "-"}\nالوقت انحجز لعميل آخر، لازم يُسترجع المبلغ كاملاً.`
  );
  return NextResponse.json(
    {
      error: `وصل دفعك بعد انتهاء المهلة وتم حجز هذا الوقت لعميل آخر. سيُسترجع المبلغ كاملاً. رقم حجزك ${existing.booking_no}.`,
      refund_due: true,
    },
    { status: 409 }
  );
}
