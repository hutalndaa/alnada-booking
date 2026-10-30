"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { calculatePrice, PricingTier } from "@/lib/pricing";
import { VAT_NOTE } from "@/lib/config";
import { OPEN_HOUR, CLOSE_HOUR, HOURS_TEXT, hourlyFor, isPeakDay } from "@/lib/hours";
import {
  cleanNameInput, cleanPhoneInput, isValidName, isValidPhone, isValidEmail,
} from "@/lib/validation";

interface Props {
  unitId: string;
  hourlyPrice: number;
  weekendPrice: number | null;
  holidays: string[];
  capacity: number;
  bufferMinutes: number;
  tiers: PricingTier[];
}
interface Busy { start_time: string; end_time: string; buffer_minutes: number }

const inputCls =
  "w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base outline-none focus:border-sadu-700 focus:ring-2 focus:ring-sadu-200 transition";
const labelCls = "block text-sm font-medium text-stone-700 mb-1.5";
const errCls = "mt-1 text-xs text-red-600";

function pad(n: number) { return String(n).padStart(2, "0"); }
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function hourLabel(h: number) {
  const suffix = h < 12 ? "ص" : "م";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:00 ${suffix}`;
}

export default function BookingForm({ unitId, hourlyPrice, weekendPrice, holidays, capacity, bufferMinutes, tiers }: Props) {
  const router = useRouter();
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [guests, setGuests] = useState(1);
  const [date, setDate] = useState(todayStr());
  const [hour, setHour] = useState<number | null>(null);
  const [hours, setHours] = useState(1);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<Busy[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setHour(null);
    fetch(`/api/units/${unitId}/availability?date=${date}&tz=${-new Date().getTimezoneOffset()}`)
      .then((r) => r.json())
      .then((d) => !cancelled && setBusy(d.busy ?? []))
      .catch(() => !cancelled && setBusy([]));
    return () => { cancelled = true; };
  }, [unitId, date]);

  function slotConflicts(h: number, len: number) {
    const start = new Date(`${date}T${pad(h)}:00:00`).getTime();
    const end = start + len * 3600000;
    return busy.some((b) => {
      const bs = new Date(b.start_time).getTime();
      const be = new Date(b.end_time).getTime() + (b.buffer_minutes ?? bufferMinutes) * 60000;
      // نفس منطق قاعدة البيانات: الحجز الجديد + فاصل التنظيف يجب ألا يتداخل
      return start < be && end + bufferMinutes * 60000 > bs;
    });
  }
  function isPast(h: number) {
    return new Date(`${date}T${pad(h)}:00:00`).getTime() < Date.now();
  }

  const OPEN_HOURS = Array.from({ length: CLOSE_HOUR - OPEN_HOUR }, (_, i) => OPEN_HOUR + i);
  const tooLate = (h: number) => h + hours > CLOSE_HOUR; // الحجز يجب أن ينتهي قبل الإغلاق
  const availableCount = OPEN_HOURS.filter((h) => !isPast(h) && !tooLate(h) && !slotConflicts(h, hours)).length;

  const dayPrice = hourlyFor(hourlyPrice, weekendPrice, date, holidays);
  const peak = isPeakDay(date, holidays) && dayPrice !== hourlyPrice;
  const price = useMemo(() => calculatePrice(dayPrice, hours, tiers), [dayPrice, hours, tiers]);
  const nextTier = useMemo(
    () => tiers.filter((t) => t.minHours > hours).sort((a, b) => a.minHours - b.minHours)[0],
    [tiers, hours]
  );

  const errors = {
    first: isValidName(first) ? "" : "الاسم الأول: حروف ومسافات فقط (حرفان على الأقل)",
    last: isValidName(last) ? "" : "اسم العائلة: حروف ومسافات فقط (حرفان على الأقل)",
    phone: isValidPhone(phone) ? "" : "رقم الجوال 10 أرقام ويبدأ بـ 05 (مثال: 0551234567)",
    email: !email || isValidEmail(email) ? "" : "البريد الإلكتروني غير صحيح",
    slot: hour === null ? "اختر وقت البداية" : "",
  };
  const valid = Object.values(errors).every((e) => !e);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ first: true, last: true, phone: true, email: true, slot: true });
    if (!valid || hour === null) return;
    setSubmitting(true);
    setError(null);
    try {
      const start_time = new Date(`${date}T${pad(hour)}:00:00`).toISOString();
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unit_id: unitId,
          guest_name: `${first.trim()} ${last.trim()}`,
          guest_phone: phone,
          guest_email: email || undefined,
          num_guests: guests,
          start_time,
          hours,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "حدث خطأ، حاول مرة أخرى");
        setSubmitting(false);
        return;
      }
      const pay = await fetch("/api/payment/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: data.booking.id, amount: data.price.total }),
      });
      const payData = await pay.json();
      if (pay.ok) router.push(payData.checkoutUrl);
      else { setError("تعذر تجهيز الدفع، حاول مرة أخرى"); setSubmitting(false); }
    } catch {
      setError("تعذر الاتصال، تأكد من الإنترنت وحاول مرة أخرى");
      setSubmitting(false);
    }
  }

  const show = (k: keyof typeof errors) => touched[k] && errors[k];

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* الموعد */}
      <fieldset className="rounded-2xl bg-white border border-stone-200 p-5 shadow-sm space-y-4">
        <legend className="px-2 font-extrabold text-ink-900">الموعد</legend>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>التاريخ</label>
            <input type="date" className={inputCls} min={todayStr()} value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>عدد الساعات</label>
            <select className={inputCls} value={hours} onChange={(e) => setHours(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                <option key={h} value={h}>{h === 1 ? "ساعة واحدة" : h === 2 ? "ساعتان" : `${h} ساعات`}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls}>وقت البداية</label>
          <div
            className={`mb-3 rounded-xl px-3 py-2 text-sm font-medium ${
              availableCount > 0 ? "bg-pine-50 text-ink-700" : "bg-red-50 text-red-700"
            }`}
          >
            {availableCount > 0
              ? `متاح ${availableCount} وقت بداية في هذا اليوم`
              : "لا توجد أوقات متاحة في هذا اليوم، جرّب يوماً آخر"}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {OPEN_HOURS.map((h) => {
              const disabled = isPast(h) || tooLate(h) || slotConflicts(h, hours);
              const active = hour === h;
              return (
                <button
                  key={h} type="button" disabled={disabled} onClick={() => setHour(h)}
                  className={`rounded-xl border px-2 py-2.5 text-sm font-medium transition ${
                    active
                      ? "border-sadu-800 bg-sadu-800 text-white"
                      : disabled
                      ? "border-stone-200 bg-stone-100 text-stone-300 line-through cursor-not-allowed"
                      : "border-stone-300 bg-white text-stone-700 hover:border-sadu-700"
                  }`}
                >
                  {hourLabel(h)}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-stone-500">
            ساعات العمل {HOURS_TEXT}. الأوقات المشطوبة محجوزة أو غير متاحة. يُضاف {bufferMinutes} دقيقة تنظيف بعد كل حجز.
          </p>
          {show("slot") && <p className={errCls}>{errors.slot}</p>}
        </div>
        <div>
          <label className={labelCls}>عدد الأشخاص</label>
          <select className={inputCls} value={guests} onChange={(e) => setGuests(Number(e.target.value))}>
            {Array.from({ length: capacity }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </fieldset>

      {/* بياناتك */}
      <fieldset className="rounded-2xl bg-white border border-stone-200 p-5 shadow-sm space-y-4">
        <legend className="px-2 font-extrabold text-ink-900">بياناتك</legend>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>الاسم الأول</label>
            <input
              className={inputCls} autoComplete="given-name" value={first}
              onChange={(e) => setFirst(cleanNameInput(e.target.value))}
              onBlur={() => setTouched((t) => ({ ...t, first: true }))}
            />
            {show("first") && <p className={errCls}>{errors.first}</p>}
          </div>
          <div>
            <label className={labelCls}>اسم العائلة</label>
            <input
              className={inputCls} autoComplete="family-name" value={last}
              onChange={(e) => setLast(cleanNameInput(e.target.value))}
              onBlur={() => setTouched((t) => ({ ...t, last: true }))}
            />
            {show("last") && <p className={errCls}>{errors.last}</p>}
          </div>
        </div>
        <div>
          <label className={labelCls}>رقم الجوال</label>
          <input
            className={inputCls} dir="ltr" inputMode="numeric" autoComplete="tel" placeholder="05XXXXXXXX"
            maxLength={10} value={phone} style={{ textAlign: "right" }}
            onChange={(e) => setPhone(cleanPhoneInput(e.target.value))}
            onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
          />
          {show("phone") && <p className={errCls}>{errors.phone}</p>}
        </div>
        <div>
          <label className={labelCls}>البريد الإلكتروني <span className="text-stone-400">(اختياري)</span></label>
          <input
            className={inputCls} type="email" dir="ltr" autoComplete="email" value={email} style={{ textAlign: "right" }}
            onChange={(e) => setEmail(e.target.value.trim())}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          />
          {show("email") && <p className={errCls}>{errors.email}</p>}
        </div>
      </fieldset>

      {/* الملخص */}
      <div className="rounded-2xl bg-ink-900 text-white p-5 shadow-sm">
        <div className="flex justify-between text-sm text-mist-200">
          <span>
            {dayPrice} ريال × {hours} {hours === 1 ? "ساعة" : "ساعات"}
            {peak && <span className="mr-1 text-pine-300">(سعر نهاية الأسبوع/الإجازات)</span>}
          </span>
          <span>{price.subtotal} ريال</span>
        </div>
        {price.discountPercent > 0 && (
          <div className="flex justify-between text-sm text-pine-300 mt-1">
            <span>خصم {price.discountPercent}%</span>
            <span>- {price.discountAmount} ريال</span>
          </div>
        )}
        <div className="mt-3 pt-3 border-t border-white/15 flex justify-between items-end">
          <span className="font-medium">الإجمالي</span>
          <span className="text-3xl font-extrabold">{price.total} <span className="text-base font-medium">ريال</span></span>
        </div>
        <p className="mt-2 text-xs text-pine-200">{VAT_NOTE}</p>
        {nextTier && (
          <p className="mt-3 text-xs text-pine-200">
            احجز {nextTier.minHours} ساعات أو أكثر واحصل على خصم {nextTier.discountPercent}%
          </p>
        )}
      </div>

      {error && <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm p-4">{error}</div>}

      <button
        disabled={submitting}
        className="w-full rounded-xl bg-pine-400 py-4 text-lg font-extrabold text-ink-900 hover:bg-pine-300 transition disabled:opacity-50"
      >
        {submitting ? "جارٍ الحجز..." : "تأكيد الحجز والانتقال للدفع"}
      </button>
      <p className="text-center text-xs text-stone-500">
        يُحجز الوقت لك مؤقتاً لمدة 5 دقائق لإتمام الدفع، وبعدها يتأكد الحجز.
      </p>
      <p className="text-center text-xs text-stone-500">
        بإتمام الحجز أنت توافق على{" "}
        <a href="/terms" target="_blank" className="text-sadu-800 underline">الشروط والأحكام</a>،{" "}
        <a href="/refund" target="_blank" className="text-sadu-800 underline">سياسة الاسترجاع</a>{" "}و{" "}
        <a href="/privacy" target="_blank" className="text-sadu-800 underline">الخصوصية</a>.
      </p>
    </form>
  );
}
