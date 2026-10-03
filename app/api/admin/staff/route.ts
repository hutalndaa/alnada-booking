import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/authGuard";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/admin/staff - المالك فقط يشوف قائمة الموظفين
export async function GET(req: NextRequest) {
  const auth = await requireStaff(req, ["owner"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data } = await supabaseAdmin.from("staff").select("*").order("created_at");
  return NextResponse.json({ staff: data ?? [] });
}

// POST /api/admin/staff - المالك ينشئ حساب مشغل جديد (بريد + كلمة مرور)
export async function POST(req: NextRequest) {
  const auth = await requireStaff(req, ["owner"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { email, password, full_name, role } = await req.json();
  if (!email || !password || !full_name || !role) {
    return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
  }
  if (!["owner", "operator"].includes(role)) {
    return NextResponse.json({ error: "دور غير صالح" }, { status: 400 });
  }

  // ننشئ حساب الدخول عبر Admin API - بدون تفعيل بريد (email_confirm: true)
  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError || !created.user) {
    return NextResponse.json({ error: createError?.message ?? "تعذر إنشاء الحساب" }, { status: 400 });
  }

  const { error: staffError } = await supabaseAdmin
    .from("staff")
    .insert({ id: created.user.id, full_name, role });

  if (staffError) {
    // تراجع: احذف حساب الدخول لو فشل إدراج صف الموظف
    await supabaseAdmin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: "تعذر إنشاء الموظف" }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
