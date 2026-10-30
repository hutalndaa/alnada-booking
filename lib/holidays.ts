import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { parseHolidays } from "@/lib/hours";

/** قائمة الإجازات (تواريخ بسعر نهاية الأسبوع) من الإعدادات - للخادم فقط */
export async function getHolidays(): Promise<string[]> {
  const { data } = await supabaseAdmin.from("site_settings").select("value").eq("key", "holiday_dates").maybeSingle();
  return parseHolidays(data?.value);
}
