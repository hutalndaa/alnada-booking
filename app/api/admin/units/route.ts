import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/authGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  const auth = await requireStaff(req, ["owner", "operator"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data } = await supabaseAdmin.from("units").select("*").order("created_at");
  return NextResponse.json({ units: data ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await requireStaff(req, ["owner"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();
  const { data, error } = await supabaseAdmin.from("units").insert(body).select().single();
  if (error) return NextResponse.json({ error: "تعذر إنشاء الوحدة" }, { status: 500 });
  return NextResponse.json({ unit: data }, { status: 201 });
}
