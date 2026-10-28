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
