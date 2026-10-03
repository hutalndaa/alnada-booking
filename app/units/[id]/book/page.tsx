"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function BookUnitPage() {
  const params = useParams();
  const router = useRouter();
  const unitId = params.id as string;

  const [form, setForm] = useState({
    guest_name: "",
    guest_phone: "",
    guest_email: "",
    num_guests: 1,
    date: "",
    time: "",
    hours: 1,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const start_time = new Date(`${form.date}T${form.time}:00`).toISOString();

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        unit_id: unitId,
        guest_name: form.guest_name,
        guest_phone: form.guest_phone,
        guest_email: form.guest_email || undefined,
        num_guests: form.num_guests,
        start_time,
        hours: form.hours,
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      // 409 = تعارض: شخص ثاني حجز نفس الساعة قبلك بجزء من الثانية
      setError(data.error ?? "حدث خطأ، حاول مرة أخرى");
      return;
    }

    setResult(data);
    // التوجيه لصفحة الدفع - راجع lib/payment.ts لاستبدالها ببوابة حقيقية
    const paymentRes = await fetch("/api/payment/create-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ booking_id: data.booking.id, amount: data.price.total }),
    });
    const paymentData = await paymentRes.json();
    if (paymentRes.ok) {
      router.push(paymentData.checkoutUrl);
    }
  }

  if (result) {
    return <main className="p-6 text-center">جارٍ تحويلك لصفحة الدفع...</main>;
  }

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">تفاصيل الحجز</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          required
          placeholder="الاسم"
          className="w-full border rounded-lg p-2"
          value={form.guest_name}
          onChange={(e) => setForm({ ...form, guest_name: e.target.value })}
        />
        <input
          required
          placeholder="رقم الجوال"
          className="w-full border rounded-lg p-2"
          value={form.guest_phone}
          onChange={(e) => setForm({ ...form, guest_phone: e.target.value })}
        />
        <input
          type="email"
          placeholder="الإيميل (اختياري)"
          className="w-full border rounded-lg p-2"
          value={form.guest_email}
          onChange={(e) => setForm({ ...form, guest_email: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            required
            type="date"
            className="border rounded-lg p-2"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
          <input
            required
            type="time"
            className="border rounded-lg p-2"
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm text-neutral-600">عدد الساعات</label>
          <input
            required
            type="number"
            min={1}
            className="w-full border rounded-lg p-2"
            value={form.hours}
            onChange={(e) => setForm({ ...form, hours: Number(e.target.value) })}
          />
        </div>
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>
        )}
        <button
          disabled={submitting}
          className="w-full bg-neutral-900 text-white rounded-lg p-3 font-medium disabled:opacity-50"
        >
          {submitting ? "جارٍ الحجز..." : "احجز الآن"}
        </button>
      </form>
    </main>
  );
}
