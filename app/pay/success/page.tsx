"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import { useWhatsAppNumber } from "@/lib/useWhatsAppNumber";
import { waLink, fmtBookingTime } from "@/lib/whatsapp";

function Success() {
  const params = useSearchParams();
  const bookingId = params.get("b");
  const [booking, setBooking] = useState<any>(null);
  const wa = useWhatsAppNumber();

  useEffect(() => {
    if (!bookingId) return;
    fetch(`/api/bookings/${bookingId}`)
      .then((r) => r.json())
      .then((d) => setBooking(d.booking ?? null))
      .catch(() => {});
  }, [bookingId]);

  const fmt = (s: string) =>
    new Date(s).toLocaleString("ar-SA", { dateStyle: "full", timeStyle: "short" });

  return (
    <main className="max-w-md mx-auto px-4 pt-10">
      <div className="rounded-2xl bg-white border border-stone-200 p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-800">✓</div>
        <h1 className="font-extrabold text-xl text-emerald-950 mb-2">تم تأكيد حجزك</h1>
        {booking && (
          <div className="mt-3 rounded-xl bg-stone-50 p-4 text-sm text-stone-600 space-y-1">
            <div className="font-bold text-emerald-900">{booking.units?.name}</div>
            <div>{fmt(booking.start_time)}</div>
          </div>
        )}
        <p className="text-stone-500 text-sm leading-7 mt-3">شكراً لك! سيتم التواصل معك قبل الموعد على رقم جوالك.</p>
        {booking?.units?.location_url && (
          <a
            href={booking.units.location_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 font-bold text-emerald-950 hover:bg-amber-300"
          >
            <span aria-hidden>📍</span> افتح الموقع في خرائط قوقل
          </a>
        )}
        {wa && booking && (
          <a
            href={waLink(
              wa,
              `السلام عليكم، أنا ${booking.guest_name}. تم تأكيد حجزي في ${booking.units?.name} بتاريخ ${fmtBookingTime(booking.start_time)}.`
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block rounded-xl border border-emerald-800 px-4 py-3 text-sm font-bold text-emerald-900 hover:bg-emerald-50"
          >
            تواصل معنا على واتساب
          </a>
        )}
        <Link href="/" className="inline-block mt-5 rounded-xl bg-emerald-800 px-6 py-2.5 text-sm font-bold text-white">
          الرجوع للرئيسية
        </Link>
      </div>
    </main>
  );
}

export default function PaySuccessPage() {
  return (
    <>
      <SiteHeader />
      <Suspense fallback={null}>
        <Success />
      </Suspense>
    </>
  );
}
