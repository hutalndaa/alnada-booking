"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";

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

  useEffect(() => {
    fetch(`/api/bookings/${bookingId}`)
      .then((r) => r.json())
      .then((d) => setBooking(d.booking ?? null))
      .finally(() => setLoading(false));
  }, [bookingId]);

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
    router.push("/pay/success");
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
            <p className="text-stone-500 text-sm mt-1">{booking.guest_name}</p>
            <div className="mt-4 rounded-xl bg-stone-50 p-4 text-sm text-stone-600 space-y-1">
              <div className="font-bold text-emerald-900">{booking.units?.name}</div>
              <div>{fmt(booking.start_time)}</div>
            </div>
            <div className="text-4xl font-extrabold text-emerald-900 my-6">
              {booking.total_price} <span className="text-lg font-medium">ريال</span>
            </div>
            {error && <div className="text-red-600 text-sm mb-3">{error}</div>}
            <button
              onClick={handlePay} disabled={paying}
              className="w-full rounded-xl bg-emerald-800 py-3.5 font-bold text-white hover:bg-emerald-900 disabled:opacity-50"
            >
              {paying ? "جارٍ الدفع..." : "ادفع الآن (تجريبي)"}
            </button>
          </div>
        )}
      </main>
    </>
  );
}
