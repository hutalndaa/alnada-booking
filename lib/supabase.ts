import { createClient } from "@supabase/supabase-js";

// عميل يُستخدم في الواجهة (المتصفح) - صلاحيات محدودة بسياسات RLS
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// عميل يُستخدم فقط في السيرفر (API Routes) - صلاحيات كاملة
// لا تستورد هذا الملف أبداً داخل مكوّن يعمل على المتصفح (Client Component)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
