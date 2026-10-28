import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type StaffRole = "owner" | "operator";

export interface StaffUser {
  id: string;
  email: string | null;
  role: StaffRole;
  full_name: string;
}

/**
 * يتحقق من هوية الموظف عبر التوكن المرسل بالهيدر Authorization: Bearer <token>
 * ويتأكد إن دوره ضمن الأدوار المسموحة. يُستخدم في كل API خاص بالإدارة.
 */
export async function requireStaff(
  req: NextRequest,
  allowedRoles: StaffRole[] = ["owner", "operator"]
): Promise<{ user: StaffUser } | { error: string; status: number }> {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return { error: "لم يتم تسجيل الدخول", status: 401 };
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !authData.user) {
    return { error: "جلسة غير صالحة", status: 401 };
  }

  const { data: staffRow, error: staffError } = await supabaseAdmin
    .from("staff")
    .select("id, full_name, role")
    .eq("id", authData.user.id)
    .single();

  if (staffError || !staffRow) {
    return { error: "هذا الحساب غير مصرّح له بالدخول للوحة التحكم", status: 403 };
  }

  if (!allowedRoles.includes(staffRow.role as StaffRole)) {
    return { error: "لا تملك صلاحية لهذا الإجراء", status: 403 };
  }

  return {
    user: {
      id: authData.user.id,
      email: authData.user.email ?? null,
      role: staffRow.role as StaffRole,
      full_name: staffRow.full_name,
    },
  };
}
