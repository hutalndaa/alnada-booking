import { createClient } from "@supabase/supabase-js";

// عميل المتصفح فقط - صلاحيات محدودة بسياسات RLS
// (لا تضع هنا أي مفتاح سري - هذا الملف يُحمَّل في المتصفح)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
