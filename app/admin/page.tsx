"use client";

import { useEffect, useState } from "react";
import { useStaffAuth } from "@/lib/useStaffAuth";
import { authHeaders } from "@/lib/useStaffAuth";
import { waLink, bookingNotice } from "@/lib/whatsapp";

const STATUS_LABELS: Record<string, string> = {
  pending: "بانتظار الدفع",
  confirmed: "مؤكد",
  cancelled: "ملغى",
  completed: "منتهي",
  expired: "منتهي المهلة",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-neutral-200 text-neutral-600",
  completed: "bg-blue-100 text-blue-800",
  expired: "bg-red-100 text-red-700",
};

export default function AdminBookingsPage() {
  const { session } = useStaffAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [q, setQ] = useState("");

  async function load() {
    if (!session) return;
    const res = await fetch("/api/admin/bookings", { headers: authHeaders(session.token) });
    const data = await res.json();
    setBookings(data.bookings ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [session]);

  async function download(type: "customers" | "bookings") {
    if (!session) return;
    const res = await fetch(`/api/admin/export?type=${type}`, { headers: authHeaders(session.token) });
    if (!res.ok) { alert("تعذر تنزيل الملف"); return; }
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement("a");
    a.href = url;
    a.download = `alnada-${type}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function markPaid(id: string) {
    if (!session) return;
    setBusyId(id);
    await fetch(`/api/admin/bookings/${id}/mark-paid`, {
      method: "POST",
      headers: authHeaders(session.token),
    });
    setBusyId(null);
    load();
  }

  async function updateStatus(id: string, status: string) {
    if (!session) return;
    setBusyId(id);
    await fetch(`/api/admin/bookings/${id}`, {
      method: "PATCH",
      headers: authHeaders(session.token),
      body: JSON.stringify({ status }),
    });
    setBusyId(null);
    load();
  }

  async function markRefunded(id: string) {
    if (!session || !confirm("تأكد إنك استرجعت المبلغ للعميل فعلياً؟")) return;
    setBusyId(id);
    await fetch(`/api/admin/bookings/${id}`, {
      method: "PATCH",
      headers: authHeaders(session.token),
      body: JSON.stringify({ payment_status: "refunded" }),
    });
    setBusyId(null);
    load();
  }

  const needle = q.trim();
  const digits = needle.replace(/\D/g, "").replace(/^(00)?966/, "0").replace(/^5/, "05");
  const shown = needle
    ? bookings.filter(
        (b) =>
          String(b.booking_no ?? "") === needle.replace(/^#/, "") ||
          String(b.guest_name ?? "").includes(needle) ||
          (digits.length >= 3 && String(b.guest_phone ?? "").includes(digits))
      )
    : bookings;

  if (loading) return <p className="text-neutral-500">جارٍ التحميل...</p>;

  return (
    <div className="space-y-3 max-w-3xl mx-auto">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-lg font-bold ml-auto">الحجوزات</h1>
        {session?.role === "owner" && (
          <>
            <button onClick={() => download("customers")} className="text-xs bg-white border px-3 py-1.5 rounded-lg">تنزيل العملاء (Excel)</button>
            <button onClick={() => download("bookings")} className="text-xs bg-white border px-3 py-1.5 rounded-lg">تنزيل كل الحجوزات (Excel)</button>
          </>
        )}
      </div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="ابحث برقم الجوال أو رقم الحجز أو الاسم"
        className="w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-700"
      />
      {!bookings.length && <p className="text-neutral-500">لا توجد حجوزات بعد.</p>}
      {!!bookings.length && !shown.length && <p className="text-neutral-500">ما فيه نتيجة للبحث.</p>}
      {shown.map((b) => (
        <div key={b.id} className="bg-white border rounded-xl p-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-xs text-neutral-400">رقم الحجز <b className="text-neutral-700">{b.booking_no}</b></div>
              <div className="font-medium">{b.guest_name} · {b.guest_phone}</div>
              <div className="text-sm text-neutral-500">{b.units?.name}</div>
              <div className="text-sm text-neutral-500">
                {new Date(b.start_time).toLocaleString("ar-SA")} → {new Date(b.end_time).toLocaleString("ar-SA")}
              </div>
              <div className="text-sm mt-1">
                {b.total_price} ريال
                {b.discount_percent > 0 && <span className="text-green-600"> (خصم {b.discount_percent}%)</span>}
              </div>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[b.status]}`}>
              {STATUS_LABELS[b.status]}
            </span>
          </div>

          {["expired", "cancelled"].includes(b.status) && b.payment_status === "paid" && (
            <div className="mt-3 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              ⚠️ دفع متأخر: العميل دفع {b.paid_amount} ريال والوقت انحجز لغيره. لازم يُسترجع المبلغ كاملاً.
              <button
                disabled={busyId === b.id}
                onClick={() => markRefunded(b.id)}
                className="mr-2 text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg disabled:opacity-50"
              >
                تم الاسترجاع
              </button>
            </div>
          )}
          {(b.status === "pending" || b.status === "confirmed") && (
            <a
              href={waLink(
                b.guest_phone,
                bookingNotice(b, b.status === "confirmed" ? "confirmed" : "pending", typeof window !== "undefined" ? window.location.origin : "")
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 ml-2 text-xs bg-[#25D366] text-white px-3 py-1.5 rounded-lg"
            >
              واتساب للعميل
            </a>
          )}
          {(b.status === "pending" || b.status === "confirmed") && (
            <div className="flex gap-2 mt-3">
              {b.payment_status !== "paid" && (
                <button
                  disabled={busyId === b.id}
                  onClick={() => markPaid(b.id)}
                  className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg disabled:opacity-50"
                >
                  تأكيد دفع يدوي (كاش)
                </button>
              )}
              <button
                disabled={busyId === b.id}
                onClick={() => updateStatus(b.id, "cancelled")}
                className="text-xs bg-neutral-100 text-neutral-700 px-3 py-1.5 rounded-lg disabled:opacity-50"
              >
                إلغاء
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
