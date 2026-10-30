import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

// GET /api/settings - الإعدادات العامة فقط (رقم واتساب + تواريخ الإجازات)
export async function GET() {
  const { data } = await supabaseAdmin
    .from("site_settings").select("key, value").in("key", ["whatsapp_number", "holiday_dates"]);
  const m = Object.fromEntries((data ?? []).map((r: any) => [r.key, r.value]));
  return NextResponse.json({ whatsapp: m.whatsapp_number || null, holiday_dates: m.holiday_dates || "" });
}
