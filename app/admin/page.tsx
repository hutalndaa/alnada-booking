"use client";

import { useEffect, useState } from "react";
import { useStaffAuth } from "@/lib/useStaffAuth";
import { authHeaders } from "@/lib/useStaffAuth";
import { waLink, fmtBookingTime } from "@/lib/whatsapp";

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

  if (loading) return <p className="text-neutral-500">جارٍ التحميل...</p>;

  return (
    <div className="space-y-3 max-w-3xl mx-auto">
      <h1 className="text-lg font-bold">الحجوزات</h1>
      {!bookings.length && <p className="text-neutral-500">لا توجد حجوزات بعد.</p>}
      {bookings.map((b) => (
        <div key={b.id} className="bg-white border rounded-xl p-4">
          <div className="flex justify-between items-start">
            <div>
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

          {(b.status === "pending" || b.status === "confirmed") && (
            <a
              href={waLink(
                b.guest_phone,
                b.status === "confirmed"
                  ? `السلام عليكم ${b.guest_name}، تم تأكيد حجزك في ${b.units?.name} بتاريخ ${fmtBookingTime(b.start_time)}.${b.units?.location_url ? ` الموقع: ${b.units.location_url}` : ""} نتشرف بزيارتك.`
                  : `السلام عليكم ${b.guest_name}، تم إنشاء حجزك في ${b.units?.name} بتاريخ ${fmtBookingTime(b.start_time)} بمبلغ ${b.total_price} ريال، وهو بانتظار الدفع. رابط الدفع: ${typeof window !== "undefined" ? window.location.origin : ""}/pay/${b.id}`
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
