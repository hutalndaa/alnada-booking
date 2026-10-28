import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/authGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { cleanPhoneInput, isValidPhone } from "@/lib/validation";

// PUT /api/admin/settings - تعديل رقم واتساب (المالك فقط). رقم فاضي = إخفاء الزر.
export async function PUT(req: NextRequest) {
  const auth = await requireStaff(req, ["owner"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();
  const raw = String(body.whatsapp ?? "").trim();
  const phone = raw ? cleanPhoneInput(raw) : "";
  if (phone && !isValidPhone(phone)) {
    return NextResponse.json({ error: "الرقم يجب أن يكون 10 أرقام ويبدأ بـ 05" }, { status: 400 });
  }
  const { error } = await supabaseAdmin
    .from("site_settings")
    .upsert({ key: "whatsapp_number", value: phone, updated_at: new Date().toISOString() });
  if (error) return NextResponse.json({ error: "تعذر الحفظ" }, { status: 500 });
  return NextResponse.json({ whatsapp: phone || null });
}
