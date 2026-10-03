"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

/**
 * صفحة دفع تجريبية (Mock) - تحاكي شكل الدفع بدون بوابة حقيقية.
 * لما تربط بوابة فعلية، هذي الصفحة تُستبدل بتوجيه مباشر لرابط البوابة
 * (createPaymentIntent في lib/payment.ts)، ونقطة الاستقبال بعد الدفع
 * تبقى نفسها: app/api/bookings/[id]/confirm/route.ts
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
    (async () => {
      const { data } = await supabase
        .from("bookings")
        .select("id, total_price, status, hold_expires_at, guest_name")
        .eq("id", bookingId)
        .single();
      setBooking(data);
      setLoading(false);
    })();
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
    if (!res.ok) {
      setError(data.error ?? "تعذر إتمام الدفع");
      return;
    }
    router.push("/pay/success");
  }

  if (loading) return <main className="p-6 text-center">جارٍ التحميل...</main>;
  if (!booking) return <main className="p-6 text-center">الحجز غير موجود</main>;
  if (booking.status !== "pending")
    return <main className="p-6 text-center">هذا الحجز لم يعد قابلاً للدفع (الحالة: {booking.status})</main>;

  return (
    <main className="max-w-sm mx-auto p-6">
      <div className="bg-white border rounded-xl p-5 text-center">
        <div className="text-xs text-amber-600 bg-amber-50 rounded-lg p-2 mb-4">
          بوابة دفع تجريبية - للتطوير فقط
        </div>
        <h1 className="font-bold text-lg mb-1">إتمام الدفع</h1>
        <p className="text-neutral-500 text-sm mb-4">{booking.guest_name}</p>
        <div className="text-3xl font-bold mb-6">{booking.total_price} ريال</div>
        {error && <div className="text-red-600 text-sm mb-3">{error}</div>}
        <button
          onClick={handlePay}
          disabled={paying}
          className="w-full bg-green-600 text-white rounded-lg p-3 font-medium disabled:opacity-50"
        >
          {paying ? "جارٍ الدفع..." : "ادفع الآن (تجريبي)"}
        </button>
      </div>
    </main>
  );
}
