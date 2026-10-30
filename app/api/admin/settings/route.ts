import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/authGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { cleanPhoneInput, isValidPhone } from "@/lib/validation";
import { parseHolidays } from "@/lib/hours";

// PUT /api/admin/settings - تعديل الإعدادات (المالك فقط)
// whatsapp: رقم فاضي = إخفاء الزر. holiday_dates: تواريخ YYYY-MM-DD تُسعّر بسعر نهاية الأسبوع.
export async function PUT(req: NextRequest) {
  const auth = await requireStaff(req, ["owner"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();
  const now = new Date().toISOString();
  const rows: { key: string; value: string; updated_at: string }[] = [];

  if (body.whatsapp !== undefined) {
    const raw = String(body.whatsapp ?? "").trim();
    const phone = raw ? cleanPhoneInput(raw) : "";
    if (phone && !isValidPhone(phone)) {
      return NextResponse.json({ error: "الرقم يجب أن يكون 10 أرقام ويبدأ بـ 05" }, { status: 400 });
    }
    rows.push({ key: "whatsapp_number", value: phone, updated_at: now });
  }
  if (body.holiday_dates !== undefined) {
    const text = String(body.holiday_dates ?? "");
    const dates = parseHolidays(text);
    const leftover = text.split(/[\s,،;]+/).filter(Boolean).length;
    if (dates.length !== leftover) {
      return NextResponse.json({ error: "صيغة التاريخ: 2026-12-25 (سنة-شهر-يوم)، تاريخ في كل سطر" }, { status: 400 });
    }
    rows.push({ key: "holiday_dates", value: [...new Set(dates)].sort().join("\n"), updated_at: now });
  }
  if (!rows.length) return NextResponse.json({ error: "لا توجد بيانات" }, { status: 400 });

  const { error } = await supabaseAdmin.from("site_settings").upsert(rows);
  if (error) return NextResponse.json({ error: "تعذر الحفظ" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
