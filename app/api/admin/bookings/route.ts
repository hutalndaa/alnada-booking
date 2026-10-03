import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/authGuard";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/admin/bookings - قائمة الحجوزات (المالك والمشغل)
export async function GET(req: NextRequest) {
  const auth = await requireStaff(req, ["owner", "operator"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("*, units(name)")
    .order("start_time", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: "تعذر جلب الحجوزات" }, { status: 500 });
  return NextResponse.json({ bookings: data });
}
