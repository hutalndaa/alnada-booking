import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/authGuard";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const auth = await requireStaff(req, ["owner", "operator"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data } = await supabaseAdmin.from("pricing_tiers").select("*, units(name)").order("min_hours");
  return NextResponse.json({ tiers: data ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await requireStaff(req, ["owner"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();
  const { data, error } = await supabaseAdmin.from("pricing_tiers").insert(body).select().single();
  if (error) return NextResponse.json({ error: "تعذر الإضافة" }, { status: 500 });
  return NextResponse.json({ tier: data }, { status: 201 });
}
