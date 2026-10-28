import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/authGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// DELETE /api/admin/blocks/[id] - فتح فترة مقفلة
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireStaff(req, ["owner", "operator"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { error } = await supabaseAdmin.from("blocked_dates").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: "تعذر فتح الفترة" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
