import { createClient } from "@supabase/supabase-js";

// عميل السيرفر فقط (API Routes و Server Components) - صلاحيات كاملة.
// لا تستورد هذا الملف أبداً داخل مكوّن "use client".
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);
