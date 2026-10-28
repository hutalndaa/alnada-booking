import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { hasBlockConflict } from "@/lib/blocks";
import { notifyOwner, describeDuration, fmtWhen } from "@/lib/notify";
import { calculatePrice } from "@/lib/pricing";
import { isValidName, isValidPhone, isValidEmail, cleanPhoneInput } from "@/lib/validation";

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

    const phone = cleanPhoneInput(String(guest_phone));
    if (!isValidName(String(guest_name))) {
      return NextResponse.json({ error: "الاسم يجب أن يحتوي على حروف ومسافات فقط" }, { status: 400 });
    }
    if (!isValidPhone(phone)) {
      return NextResponse.json({ error: "رقم الجوال يجب أن يكون 10 أرقام ويبدأ بـ 05" }, { status: 400 });
    }
    if (guest_email && !isValidEmail(String(guest_email))) {
      return NextResponse.json({ error: "البريد الإلكتروني غير صحيح" }, { status: 400 });
    }
    const hoursNum = Number(hours);
    if (!Number.isInteger(hoursNum) || hoursNum < 1 || hoursNum > 24) {
      return NextResponse.json({ error: "عدد الساعات غير صحيح" }, { status: 400 });
    }
    if (isNaN(new Date(start_time).getTime()) || new Date(start_time).getTime() < Date.now() - 5 * 60 * 1000) {
      return NextResponse.json({ error: "وقت البداية يجب أن يكون في المستقبل" }, { status: 400 });
    }

    // حماية من التخريب: منع حجز عشرات الأوقات الوهمية
    const clientIp = (req.headers.get("x-forwarded-for")?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "").trim() || null;
    const nowIso = new Date().toISOString();
    if (clientIp) {
      const { count: hourly } = await supabaseAdmin
        .from("bookings").select("id", { count: "exact", head: true })
        .eq("client_ip", clientIp).gt("created_at", new Date(Date.now() - 3600000).toISOString());
      if ((hourly ?? 0) >= 8) {
        return NextResponse.json({ error: "محاولات كثيرة، جرّب بعد قليل." }, { status: 429 });
      }
    }
    const pendingMatch = clientIp ? `client_ip.eq.${clientIp},guest_phone.eq.${phone}` : `guest_phone.eq.${phone}`;
    const { count: openHolds } = await supabaseAdmin
      .from("bookings").select("id", { count: "exact", head: true })
      .eq("status", "pending").gt("hold_expires_at", nowIso).or(pendingMatch);
    if ((openHolds ?? 0) >= 2) {
      return NextResponse.json(
        { error: "عندك حجز بانتظار الدفع. أكمل دفعه أو انتظر دقائق قبل حجز جديد." },
        { status: 429 }
      );
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

    if (Number(num_guests ?? 1) > unit.capacity) {
      return NextResponse.json({ error: `الكوخ يتسع لـ ${unit.capacity} أشخاص كحد أقصى` }, { status: 400 });
    }

    const startTime = new Date(start_time);
    const endTime = new Date(startTime.getTime() + Number(hours) * 60 * 60 * 1000);

    if (await hasBlockConflict(unit_id, startTime, endTime, unit.cleanup_buffer_minutes)) {
      return NextResponse.json({ error: "هذا الوقت غير متاح للحجز. جرّب وقت ثاني." }, { status: 409 });
    }

    // 3) محاولة الإدراج - قاعدة البيانات هي اللي تفصل في التعارض
    const { data: booking, error: insertError } = await supabaseAdmin
      .from("bookings")
      .insert({
        unit_id,
        guest_name: String(guest_name).trim().replace(/\s+/g, " "),
        guest_phone: phone,
        guest_email: guest_email ?? null,
        num_guests: num_guests ?? 1,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        client_ip: clientIp,
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

    await notifyOwner(
      `🔔 حجز جديد بانتظار الدفع\n${unit.name}\nالعميل: ${booking.guest_name} - ${booking.guest_phone}\nالموعد: ${fmtWhen(booking.start_time)}\nالمدة: ${describeDuration(booking.start_time, booking.end_time)}\nالمبلغ: ${booking.total_price} ريال`
    );

    // 4) الخطوة التالية: توجيه الضيف لبوابة الدفع مع ربط booking.id
    //    راجع app/api/bookings/[id]/confirm/route.ts (Webhook)
    return NextResponse.json({ booking, price }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "خطأ غير متوقع" }, { status: 500 });
  }
}
