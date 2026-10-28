import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

// GET /api/settings - الإعدادات العامة فقط (رقم واتساب)
export async function GET() {
  const { data } = await supabaseAdmin.from("site_settings").select("value").eq("key", "whatsapp_number").maybeSingle();
  return NextResponse.json({ whatsapp: data?.value || null });
}
