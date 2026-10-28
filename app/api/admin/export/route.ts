import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/authGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = {
  pending: "بانتظار الدفع", confirmed: "مؤكد", cancelled: "ملغى", completed: "منتهي", expired: "منتهي المهلة",
};
const PAY: Record<string, string> = { unpaid: "غير مدفوع", paid: "مدفوع", refunded: "مُسترجع" };
const METHOD: Record<string, string> = { cash: "نقداً", transfer: "تحويل", other: "أخرى", manual: "يدوي", mock: "تجريبي" };

function when(iso: string) {
  return new Date(new Date(iso).getTime() + 3 * 3600000).toISOString().replace("T", " ").slice(0, 16);
}
function cell(v: unknown): string {
  let s = v === null || v === undefined ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // حماية من حقن الصيغ في Excel
  return `"${s.replace(/"/g, '""')}"`;
}
// الجوال كنص عشان Excel ما يحذف الصفر من البداية
const phoneCell = (p: string) => (/^\d+$/.test(p) ? `="${p}"` : cell(p));
function csv(headers: string[], rows: string[][]) {
  return "﻿" + [headers.map(cell).join(","), ...rows.map((r) => r.join(","))].join("\r\n");
}

// GET /api/admin/export?type=customers|bookings  (المالك فقط) - ملف CSV يفتح في Excel
export async function GET(req: NextRequest) {
  const auth = await requireStaff(req, ["owner"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const type = req.nextUrl.searchParams.get("type") === "customers" ? "customers" : "bookings";
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("*, units(name)")
    .order("start_time", { ascending: false })
    .limit(20000);
  if (error) return NextResponse.json({ error: "تعذر جلب البيانات" }, { status: 500 });
  const bookings = data ?? [];

  let body: string;
  if (type === "bookings") {
    body = csv(
      ["الكوخ", "اسم العميل", "الجوال", "البريد", "عدد الأشخاص", "البداية", "النهاية", "الساعات", "الحالة", "حالة الدفع", "طريقة الدفع", "المبلغ (ريال)", "الخصم %", "ملاحظات", "تاريخ الإنشاء"],
      bookings.map((b: any) => [
        cell(b.units?.name), cell(b.guest_name), phoneCell(b.guest_phone), cell(b.guest_email), cell(b.num_guests),
        cell(when(b.start_time)), cell(when(b.end_time)),
        cell(Math.round((new Date(b.end_time).getTime() - new Date(b.start_time).getTime()) / 3600000)),
        cell(STATUS[b.status] ?? b.status), cell(PAY[b.payment_status] ?? b.payment_status),
        cell(b.payment_method ? METHOD[b.payment_method] ?? b.payment_method : ""),
        cell(b.total_price), cell(b.discount_percent), cell(b.notes), cell(when(b.created_at)),
      ])
    );
  } else {
    // عملاء فعليين فقط (حجوزات مؤكدة أو منتهية)، مجمّعين برقم الجوال
    const map = new Map<string, { name: string; email: string; count: number; total: number; first: string; last: string }>();
    for (const b of bookings as any[]) {
      if (!["confirmed", "completed"].includes(b.status)) continue;
      const k = b.guest_phone;
      const cur = map.get(k);
      if (!cur) {
        map.set(k, { name: b.guest_name, email: b.guest_email ?? "", count: 1, total: Number(b.total_price), first: b.start_time, last: b.start_time });
      } else {
        cur.count++; cur.total += Number(b.total_price);
        if (b.start_time < cur.first) cur.first = b.start_time;
        if (b.start_time > cur.last) { cur.last = b.start_time; cur.name = b.guest_name; }
        if (!cur.email && b.guest_email) cur.email = b.guest_email;
      }
    }
    body = csv(
      ["الاسم", "الجوال", "البريد", "عدد الحجوزات", "إجمالي المدفوع (ريال)", "أول حجز", "آخر حجز"],
      [...map.entries()].sort((a, b) => b[1].last.localeCompare(a[1].last)).map(([phone, c]) => [
        cell(c.name), phoneCell(phone), cell(c.email), cell(c.count), cell(c.total.toFixed(2)), cell(when(c.first)), cell(when(c.last)),
      ])
    );
  }

  const day = new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 10);
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="alnada-${type}-${day}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
