import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/authGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { calculatePrice } from "@/lib/pricing";
import { getHolidays } from "@/lib/holidays";
import { hourlyFor, riyadhDate } from "@/lib/hours";
import { hasBlockConflict } from "@/lib/blocks";
import { isValidName, isValidPhone, cleanPhoneInput } from "@/lib/validation";

// GET /api/admin/bookings - قائمة الحجوزات (المالك والمشغل)
export async function GET(req: NextRequest) {
  const auth = await requireStaff(req, ["owner", "operator"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("*, units(name, location_url)")
    .order("start_time", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: "تعذر جلب الحجوزات" }, { status: 500 });
  return NextResponse.json({ bookings: data });
}

// POST /api/admin/bookings - حجز يدوي (اتصال/واتساب/زبون حاضر). يُسجَّل مؤكداً ومدفوعاً.
// نفس قيد قاعدة البيانات يمنع التعارض مع أي حجز آخر.
export async function POST(req: NextRequest) {
  const auth = await requireStaff(req, ["owner", "operator"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();
  const { unit_id, guest_name, guest_phone, num_guests, start_time, hours, payment_method, total_price, notes } = body;

  const phone = cleanPhoneInput(String(guest_phone ?? ""));
  const hoursNum = Number(hours);
  const start = new Date(start_time);
  if (!unit_id || isNaN(start.getTime())) return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
  if (!isValidName(String(guest_name ?? ""))) {
    return NextResponse.json({ error: "الاسم يجب أن يحتوي على حروف ومسافات فقط" }, { status: 400 });
  }
  if (!isValidPhone(phone)) {
    return NextResponse.json({ error: "رقم الجوال يجب أن يكون 10 أرقام ويبدأ بـ 05" }, { status: 400 });
  }
  if (!Number.isInteger(hoursNum) || hoursNum < 1 || hoursNum > 24) {
    return NextResponse.json({ error: "عدد الساعات غير صحيح" }, { status: 400 });
  }
  const method = ["cash", "transfer", "other"].includes(payment_method) ? payment_method : "cash";

  const { data: unit } = await supabaseAdmin.from("units").select("*").eq("id", unit_id).single();
  if (!unit) return NextResponse.json({ error: "الكوخ غير موجود" }, { status: 404 });
  const guests = Number(num_guests ?? 1);
  if (!Number.isInteger(guests) || guests < 1 || guests > unit.capacity) {
    return NextResponse.json({ error: `الكوخ يتسع لـ ${unit.capacity} أشخاص كحد أقصى` }, { status: 400 });
  }

  const { data: tiers } = await supabaseAdmin
    .from("pricing_tiers")
    .select("min_hours, discount_percent")
    .or(`unit_id.eq.${unit_id},unit_id.is.null`);
  const dayHourly = hourlyFor(unit.base_hourly_price, unit.weekend_hourly_price, riyadhDate(start), await getHolidays());
  const price = calculatePrice(
    dayHourly,
    hoursNum,
    (tiers ?? []).map((t) => ({ minHours: t.min_hours, discountPercent: t.discount_percent }))
  );
  const total = total_price !== undefined && total_price !== "" && !isNaN(Number(total_price)) && Number(total_price) >= 0
    ? Number(total_price)
    : price.total;

  const end = new Date(start.getTime() + hoursNum * 3600000);
  if (await hasBlockConflict(unit_id, start, end, unit.cleanup_buffer_minutes)) {
    return NextResponse.json({ error: "هذي الفترة مقفلة من الإدارة" }, { status: 409 });
  }

  const { data, error } = await supabaseAdmin
    .from("bookings")
    .insert({
      unit_id,
      guest_name: String(guest_name).trim().replace(/\s+/g, " "),
      guest_phone: phone,
      num_guests: guests,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      buffer_minutes: unit.cleanup_buffer_minutes,
      hourly_price: dayHourly,
      discount_percent: price.discountPercent,
      total_price: total,
      status: "confirmed",
      payment_status: "paid",
      paid_amount: total,
      payment_method: method,
      payment_ref: `MANUAL-${auth.user.id.slice(0, 8)}-${Date.now()}`,
      paid_at: new Date().toISOString(),
      notes: notes ? String(notes).trim().slice(0, 300) : null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23P01") {
      return NextResponse.json({ error: "الوقت متعارض مع حجز أو فترة مقفلة" }, { status: 409 });
    }
    console.error(error);
    return NextResponse.json({ error: "تعذر إنشاء الحجز" }, { status: 500 });
  }
  return NextResponse.json({ booking: data }, { status: 201 });
}
