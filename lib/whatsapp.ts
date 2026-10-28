/** 05xxxxxxxx -> 9665xxxxxxxx (صيغة wa.me الدولية بدون +) */
export function toIntlPhone(local: string): string {
  const d = String(local).replace(/\D/g, "");
  if (d.startsWith("966")) return d;
  if (d.startsWith("0")) return "966" + d.slice(1);
  return "966" + d;
}

export function waLink(phone: string, text: string): string {
  return `https://wa.me/${toIntlPhone(phone)}?text=${encodeURIComponent(text)}`;
}

export function fmtBookingTime(iso: string): string {
  return new Date(iso).toLocaleString("ar-SA", {
    timeZone: "Asia/Riyadh",
    dateStyle: "full",
    timeStyle: "short",
  });
}

const riyadh = (iso: string, o: Intl.DateTimeFormatOptions) =>
  new Date(iso).toLocaleString("ar-SA", { timeZone: "Asia/Riyadh", ...o });

export interface NoticeBooking {
  id: string;
  booking_no?: number | string | null;
  guest_name: string;
  start_time: string;
  end_time: string;
  total_price: number | string;
  units?: { name?: string; location_url?: string | null } | null;
}

/** رسالة من المشغّل للعميل (تُفتح في واتساب ويب/بزنس من حساب المنشأة) */
export function bookingNotice(b: NoticeBooking, kind: "confirmed" | "pending", origin = ""): string {
  const lines = [
    `عزيزنا العميل ${b.guest_name}،`,
    kind === "confirmed" ? "تم تأكيد حجزك ✅" : "تم إنشاء حجزك وهو بانتظار الدفع ⏳",
    "",
    `رقم الحجز: ${b.booking_no ?? ""}`,
    `الكوخ: ${b.units?.name ?? ""}`,
    `التاريخ: ${riyadh(b.start_time, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`,
    `الدخول: ${riyadh(b.start_time, { hour: "numeric", minute: "2-digit" })}`,
    `الخروج: ${riyadh(b.end_time, { hour: "numeric", minute: "2-digit" })}`,
    `${kind === "confirmed" ? "المبلغ المدفوع" : "المبلغ المطلوب"}: ${b.total_price} ريال (شامل الضريبة)`,
  ];
  if (kind === "confirmed" && b.units?.location_url) lines.push(`الموقع: ${b.units.location_url}`);
  if (kind === "pending") lines.push(`رابط الدفع: ${origin}/pay/${b.id}`);
  lines.push("", kind === "confirmed" ? "نتشرف بزيارتك، أكواخ الندى 🌿" : "أكواخ الندى 🌿");
  return lines.join("\n");
}
