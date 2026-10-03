import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/authGuard";
import { supabaseAdmin } from "@/lib/supabase";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireStaff(req, ["owner"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { error } = await supabaseAdmin.from("pricing_tiers").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: "تعذر الحذف" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
