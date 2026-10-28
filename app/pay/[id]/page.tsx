"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import { useWhatsAppNumber } from "@/lib/useWhatsAppNumber";
import { waLink, fmtBookingTime } from "@/lib/whatsapp";
import { VAT_NOTE } from "@/lib/config";

/**
 * صفحة دفع تجريبية (Mock). عند ربط بوابة حقيقية تُستبدل بتوجيه مباشر
 * لرابط البوابة (lib/payment.ts)، ونقطة التأكيد تبقى:
 * app/api/bookings/[id]/confirm/route.ts
 */
export default function MockPayPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wa = useWhatsAppNumber();
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/bookings/${bookingId}`)
      .then((r) => r.json())
      .then((d) => {
        setBooking(d.booking ?? null);
        // نعتمد وقت الخادم عشان ساعة جوال العميل ما تغيّر العداد
        const skew = d.server_now ? Date.now() - new Date(d.server_now).getTime() : 0;
        if (d.booking?.hold_expires_at) {
          const expiry = new Date(d.booking.hold_expires_at).getTime() + skew;
          const tick = () => setRemaining(Math.max(0, Math.ceil((expiry - Date.now()) / 1000)));
          tick();
          const t = setInterval(tick, 1000);
          timerRef.current = t;
        }
      })
      .finally(() => setLoading(false));
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [bookingId]);

  useEffect(() => {
    if (remaining === 0 && timerRef.current) clearInterval(timerRef.current);
  }, [remaining]);

  const timeUp = remaining === 0;
  const mmss = remaining === null ? "" : `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;

  async function handlePay() {
    setPaying(true);
    setError(null);
    const res = await fetch(`/api/bookings/${bookingId}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payment_status: "paid",
        payment_method: "mock",
        payment_ref: `MOCK-${Date.now()}`,
        amount: booking?.total_price,
      }),
    });
    const data = await res.json();
    setPaying(false);
    if (!res.ok) { setError(data.error ?? "تعذر إتمام الدفع"); return; }
    if (data.late) { router.push(`/pay/success?b=${bookingId}`); return; }
    router.push(`/pay/success?b=${bookingId}`);
  }

  const fmt = (s: string) =>
    new Date(s).toLocaleString("ar-SA", { dateStyle: "full", timeStyle: "short" });

  return (
    <>
      <SiteHeader />
      <main className="max-w-md mx-auto px-4 pt-8">
        {loading ? (
          <p className="text-center text-stone-500">جارٍ التحميل...</p>
        ) : !booking ? (
          <p className="text-center text-stone-500">الحجز غير موجود</p>
        ) : booking.status !== "pending" ? (
          <div className="rounded-2xl bg-white border border-stone-200 p-6 text-center">
            {booking.status === "confirmed" ? "هذا الحجز مؤكد وتم دفعه." : "انتهت مهلة هذا الحجز. ارجع واحجز من جديد."}
            <a href="/" className="block mt-4 text-emerald-800 font-bold">الرجوع للرئيسية</a>
          </div>
        ) : (
          <div className="rounded-2xl bg-white border border-stone-200 p-6 shadow-sm text-center">
            <div className="text-xs text-amber-700 bg-amber-50 rounded-lg p-2 mb-5">
              بوابة دفع تجريبية - لن يُسحب أي مبلغ
            </div>
            <h1 className="font-extrabold text-xl text-emerald-950">إتمام الدفع</h1>
            <p className="text-xs text-stone-500 mt-1">رقم الحجز: <b className="text-emerald-900">{booking.booking_no}</b></p>
            {remaining !== null && (
              <div
                role="timer"
                className={`mt-4 rounded-xl p-3 ${timeUp ? "bg-red-50 text-red-700" : remaining <= 60 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}`}
              >
                <div className="text-xs">{timeUp ? "انتهت مهلة الحجز المؤقت" : "ينتهي الحجز المؤقت خلال"}</div>
                <div className="text-3xl font-extrabold tabular-nums" dir="ltr">{mmss}</div>
                {timeUp && <a href="/" className="mt-1 inline-block text-sm font-bold underline">احجز من جديد</a>}
              </div>
            )}
            <p className="text-stone-500 text-sm mt-1">{booking.guest_name}</p>
            <div className="mt-4 rounded-xl bg-stone-50 p-4 text-sm text-stone-600 space-y-1">
              <div className="font-bold text-emerald-900">{booking.units?.name}</div>
              <div>{fmt(booking.start_time)}</div>
            </div>
            <div className="text-4xl font-extrabold text-emerald-900 my-6">
              {booking.total_price} <span className="text-lg font-medium">ريال</span>
            </div>
            <p className="-mt-4 mb-5 text-xs text-stone-500">{VAT_NOTE}</p>
            {error && <div className="text-red-600 text-sm mb-3">{error}</div>}
            <button
              onClick={handlePay} disabled={paying || timeUp}
              className="w-full rounded-xl bg-emerald-800 py-3.5 font-bold text-white hover:bg-emerald-900 disabled:opacity-50"
            >
              {paying ? "جارٍ الدفع..." : "ادفع الآن (تجريبي)"}
            </button>
            {wa && (
              <a
                href={waLink(
                  wa,
                  `السلام عليكم، أنا ${booking.guest_name}. أنشأت حجز رقم ${booking.booking_no} في ${booking.units?.name} بتاريخ ${fmtBookingTime(booking.start_time)} بمبلغ ${booking.total_price} ريال، وبانتظار الدفع. رابط الدفع: ${typeof window !== "undefined" ? window.location.href : ""}`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block rounded-xl border border-emerald-800 py-3 text-sm font-bold text-emerald-900 hover:bg-emerald-50"
              >
                أرسل تفاصيل الحجز على واتساب
              </a>
            )}
          </div>
        )}
      </main>
    </>
  );
}
