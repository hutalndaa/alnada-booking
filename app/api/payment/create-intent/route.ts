import { NextRequest, NextResponse } from "next/server";
import { createPaymentIntent } from "@/lib/payment";

export async function POST(req: NextRequest) {
  const { booking_id, amount } = await req.json();
  if (!booking_id || !amount) {
    return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
  }
  const intent = await createPaymentIntent(booking_id, amount);
  return NextResponse.json(intent);
}
