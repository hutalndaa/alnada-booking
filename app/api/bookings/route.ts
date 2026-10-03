import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { calculatePrice } from "@/lib/pricing";

/**
 * POST /api/bookings
 * ينشئ حجز مؤقت (pending) للساعة المطلوبة.
 *
 * الحماية من التعارض لا تعتمد على فحص "هل الساعة متاحة" قبل الإدراج -
 * هذا الفحص عرضة لـ Race Condition لو دخل طلبان بنفس اللحظة.
 * بدل كذا: نحاول الإدراج مباشرة ونترك قيد EXCLUDE في قاعدة البيانات
 * (btree_gist) يفصل بينهما بشكل ذري (Atomic). أول طلب يصل فعلياً
 * لقاعدة البيانات ينجح، والثاني يفشل برمز الخطأ 23P01 فوراً.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { unit_id, guest_name, guest_phone, guest_email, num_guests, start_time, hours } = body;

    if (!unit_id || !guest_name || !guest_phone || !start_time || !hours) {
      return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
    }

    // 1) جلب بيانات الوحدة (السعر + إعدادات الفاصل والمهلة)
    const { data: unit, error: unitError } = await supabaseAdmin
      .from("units")
      .select("*")
      .eq("id", unit_id)
      .single();

    if (unitError || !unit) {
      return NextResponse.json({ error: "الوحدة غير موجودة" }, { status: 404 });
    }
    if (unit.status !== "active") {
      return NextResponse.json({ error: "الوحدة غير متاحة للحجز حالياً" }, { status: 400 });
    }

    // 2) جلب شرائح الخصم (الخاصة بالوحدة + العامة) وحساب السعر
    const { data: tiers } = await supabaseAdmin
      .from("pricing_tiers")
      .select("min_hours, discount_percent")
      .or(`unit_id.eq.${unit_id},unit_id.is.null`);

    const price = calculatePrice(
      Number(unit.base_hourly_price),
      Number(hours),
      (tiers ?? []).map((t) => ({ minHours: t.min_hours, discountPercent: t.discount_percent }))
    );

    const startTime = new Date(start_time);
    const endTime = new Date(startTime.getTime() + Number(hours) * 60 * 60 * 1000);

    // 3) محاولة الإدراج - قاعدة البيانات هي اللي تفصل في التعارض
    const { data: booking, error: insertError } = await supabaseAdmin
      .from("bookings")
      .insert({
        unit_id,
        guest_name,
        guest_phone,
        guest_email: guest_email ?? null,
        num_guests: num_guests ?? 1,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        buffer_minutes: unit.cleanup_buffer_minutes,
        hourly_price: unit.base_hourly_price,
        discount_percent: price.discountPercent,
        total_price: price.total,
        status: "pending",
        payment_status: "unpaid",
      })
      .select()
      .single();

    if (insertError) {
      // 23P01 = exclusion_violation -> تعارض حقيقي بمكان آخر حجز الساعة قبله
      if (insertError.code === "23P01") {
        return NextResponse.json(
          { error: "عذراً، هذه الساعة انحجزت للتو. جرّب وقت ثاني." },
          { status: 409 }
        );
      }
      console.error(insertError);
      return NextResponse.json({ error: "تعذر إنشاء الحجز" }, { status: 500 });
    }

    // 4) الخطوة التالية: توجيه الضيف لبوابة الدفع مع ربط booking.id
    //    راجع app/api/bookings/[id]/confirm/route.ts (Webhook)
    return NextResponse.json({ booking, price }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "خطأ غير متوقع" }, { status: 500 });
  }
}
