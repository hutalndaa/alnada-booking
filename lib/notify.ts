/**
 * إشعارات المالك (مجاناً عبر تيليجرام). ما تعطّل الحجز لو فشلت أو لو ما انضبطت المفاتيح.
 * المتغيرات: TELEGRAM_BOT_TOKEN و TELEGRAM_CHAT_ID (في إعدادات Vercel).
 * لاحقاً يمكن إضافة مزوّد آخر (واتساب رسمي) من نفس المكان.
 */
export async function notifyOwner(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(4000),
    });
  } catch (e) {
    console.error("notifyOwner failed", e);
  }
}

export function describeDuration(start: string | Date, end: string | Date): string {
  const hours = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 3600000);
  if (hours === 1) return "ساعة";
  if (hours === 2) return "ساعتين";
  if (hours >= 3 && hours <= 10) return `${hours} ساعات`;
  return `${hours} ساعة`;
}

export function fmtWhen(iso: string | Date): string {
  return new Date(iso).toLocaleString("ar-SA", { timeZone: "Asia/Riyadh", dateStyle: "full", timeStyle: "short" });
}
