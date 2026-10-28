"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { authHeaders, useStaffAuth } from "@/lib/useStaffAuth";
import { cleanNameInput, cleanPhoneInput, isValidName, isValidPhone } from "@/lib/validation";

const TZ = "+03:00"; // توقيت الرياض
const HOUR_PX = 56;
const LABEL_PX = 96;

interface CUnit { id: string; name: string; status: string; base_hourly_price: string; capacity: number }
interface CBooking {
  id: string; unit_id: string; guest_name: string; guest_phone: string; num_guests: number;
  start_time: string; end_time: string; buffer_minutes: number; status: string; payment_status: string;
  payment_method: string | null; total_price: string; notes: string | null;
}
interface CBlock { id: string; unit_id: string; reason: string | null; start_time: string; end_time: string }

const pad = (n: number) => String(n).padStart(2, "0");
const todayRiyadh = () => new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 10);
const addDays = (d: string, n: number) =>
  new Date(new Date(`${d}T00:00:00Z`).getTime() + n * 86400000).toISOString().slice(0, 10);
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("ar-SA", { timeZone: "Asia/Riyadh", hour: "numeric", minute: "2-digit" });
const fmtDay = (d: string) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString("ar-SA", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" });
const METHOD: Record<string, string> = { cash: "نقداً", transfer: "تحويل", other: "أخرى", manual: "يدوي", mock: "تجريبي" };

type Panel =
  | { kind: "booking"; unitId: string; hour: number }
  | { kind: "block"; unitId: string; hour: number }
  | null;

export default function CalendarPage() {
  const { session } = useStaffAuth();
  const [date, setDate] = useState(todayRiyadh());
  const [units, setUnits] = useState<CUnit[]>([]);
  const [bookings, setBookings] = useState<CBooking[]>([]);
  const [blocks, setBlocks] = useState<CBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<{ type: "booking" | "block"; id: string } | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const dayStartMs = useMemo(() => new Date(`${date}T00:00:00${TZ}`).getTime(), [date]);

  const load = useCallback(async () => {
    if (!session) return;
    const res = await fetch(`/api/admin/calendar?date=${date}&tz=180`, { headers: authHeaders(session.token) });
    const d = await res.json();
    if (!res.ok) { setMsg(d.error ?? "تعذر التحميل"); setLoading(false); return; }
    setUnits(d.units ?? []);
    setBookings(d.bookings ?? []);
    setBlocks(d.blocks ?? []);
    setLoading(false);
  }, [session, date]);

  useEffect(() => { setSelected(null); load(); }, [load]);

  function pos(startIso: string, endIso: string) {
    const s = Math.max(new Date(startIso).getTime(), dayStartMs);
    const e = Math.min(new Date(endIso).getTime(), dayStartMs + 86400000);
    return { left: ((s - dayStartMs) / 3600000) * HOUR_PX, width: Math.max(((e - s) / 3600000) * HOUR_PX, 4) };
  }

  async function call(url: string, method: string, body?: unknown) {
    if (!session) return false;
    setBusy(true); setMsg(null);
    const res = await fetch(url, { method, headers: authHeaders(session.token), body: body ? JSON.stringify(body) : undefined });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setMsg(d.error ?? "تعذر تنفيذ العملية"); return false; }
    await load();
    return true;
  }

  const sel =
    selected?.type === "booking" ? bookings.find((b) => b.id === selected.id)
    : selected?.type === "block" ? blocks.find((b) => b.id === selected.id)
    : undefined;
  const unitName = (id: string) => units.find((u) => u.id === id)?.name ?? "";

  if (loading) return <p className="text-neutral-500">جارٍ التحميل...</p>;

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-lg font-bold ml-3">التقويم</h1>
        <button onClick={() => setDate(addDays(date, -1))} className="px-3 py-1.5 rounded-lg bg-white border text-sm">→ السابق</button>
        <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm bg-white" />
        <button onClick={() => setDate(addDays(date, 1))} className="px-3 py-1.5 rounded-lg bg-white border text-sm">التالي ←</button>
        <button onClick={() => setDate(todayRiyadh())} className="px-3 py-1.5 rounded-lg bg-neutral-900 text-white text-sm">اليوم</button>
        <div className="flex-1" />
        <button onClick={() => setPanel({ kind: "booking", unitId: units[0]?.id ?? "", hour: 16 })} className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm">+ حجز يدوي</button>
        <button onClick={() => setPanel({ kind: "block", unitId: units[0]?.id ?? "", hour: 0 })} className="px-3 py-1.5 rounded-lg bg-neutral-200 text-sm">إغلاق فترة</button>
      </div>
      <div className="text-sm text-neutral-600">{fmtDay(date)}</div>

      {msg && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-3">{msg}</div>}

      <div className="flex flex-wrap gap-3 text-xs text-neutral-600">
        <span className="flex items-center gap-1"><i className="inline-block w-3 h-3 rounded bg-green-500" /> مؤكد</span>
        <span className="flex items-center gap-1"><i className="inline-block w-3 h-3 rounded bg-amber-400" /> بانتظار الدفع</span>
        <span className="flex items-center gap-1"><i className="inline-block w-3 h-3 rounded bg-neutral-500" /> مقفل</span>
        <span className="flex items-center gap-1"><i className="inline-block w-3 h-3 rounded bg-green-200" /> فاصل التنظيف</span>
        <span>اضغط على فراغ في الصف لإضافة حجز</span>
      </div>

      {/* الجدول: اتجاه الزمن من اليسار لليمين */}
      <div dir="ltr" className="bg-white border rounded-xl overflow-x-auto">
        <div style={{ width: LABEL_PX + 24 * HOUR_PX }}>
          <div className="flex border-b bg-neutral-50 text-[11px] text-neutral-500">
            <div style={{ width: LABEL_PX }} className="shrink-0 px-2 py-2 sticky left-0 bg-neutral-50 z-20 border-r" />
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} style={{ width: HOUR_PX }} className="shrink-0 py-2 text-center border-r last:border-r-0">
                {pad(h)}:00
              </div>
            ))}
          </div>

          {units.map((u) => (
            <div key={u.id} className="flex border-b last:border-b-0">
              <div style={{ width: LABEL_PX }} className="shrink-0 px-2 py-3 text-xs font-medium sticky left-0 bg-white z-20 border-r" dir="rtl">
                {u.name}
              </div>
              <div
                className="relative h-14 cursor-pointer"
                style={{
                  width: 24 * HOUR_PX,
                  backgroundImage: `repeating-linear-gradient(to right, #e5e5e5 0, #e5e5e5 1px, transparent 1px, transparent ${HOUR_PX}px)`,
                }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const h = Math.min(23, Math.max(0, Math.floor((e.clientX - rect.left) / HOUR_PX)));
                  setSelected(null);
                  setPanel({ kind: "booking", unitId: u.id, hour: h });
                }}
              >
                {blocks.filter((b) => b.unit_id === u.id).map((b) => {
                  const p = pos(b.start_time, b.end_time);
                  return (
                    <div key={b.id} onClick={(e) => { e.stopPropagation(); setPanel(null); setSelected({ type: "block", id: b.id }); }}
                      className="absolute top-1 bottom-1 rounded bg-neutral-500 text-white text-[11px] px-1.5 overflow-hidden whitespace-nowrap"
                      style={{ left: p.left, width: p.width, backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,.15) 0 6px, transparent 6px 12px)" }}>
                      {b.reason || "مقفل"}
                    </div>
                  );
                })}
                {bookings.filter((b) => b.unit_id === u.id).map((b) => {
                  const p = pos(b.start_time, b.end_time);
                  const bufEnd = new Date(new Date(b.end_time).getTime() + (b.buffer_minutes ?? 15) * 60000).toISOString();
                  const pb = pos(b.end_time, bufEnd);
                  const color = b.status === "confirmed" ? "bg-green-500" : "bg-amber-400 text-neutral-900";
                  return (
                    <div key={b.id}>
                      <div className="absolute top-1 bottom-1 rounded-r bg-green-200 pointer-events-none" style={{ left: pb.left, width: pb.width }} />
                      <div onClick={(e) => { e.stopPropagation(); setPanel(null); setSelected({ type: "booking", id: b.id }); }}
                        className={`absolute top-1 bottom-1 rounded ${color} text-white text-[11px] px-1.5 overflow-hidden whitespace-nowrap ring-offset-1 ${selected?.id === b.id ? "ring-2 ring-neutral-900" : ""}`}
                        style={{ left: p.left, width: p.width }}>
                        {b.guest_name}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {sel && selected?.type === "booking" && (() => {
        const b = sel as CBooking;
        return (
          <div className="bg-white border rounded-xl p-4 space-y-2">
            <div className="flex justify-between">
              <div className="font-bold">{b.guest_name} · <span dir="ltr">{b.guest_phone}</span></div>
              <button onClick={() => setSelected(null)} className="text-neutral-400 text-sm">إغلاق ✕</button>
            </div>
            <div className="text-sm text-neutral-600">{unitName(b.unit_id)} · من {fmtTime(b.start_time)} إلى {fmtTime(b.end_time)} · {b.num_guests} أشخاص</div>
            <div className="text-sm">
              {b.total_price} ريال ·{" "}
              {b.status === "confirmed" ? "مؤكد" : "بانتظار الدفع"}
              {b.payment_method ? ` · ${METHOD[b.payment_method] ?? b.payment_method}` : ""}
            </div>
            {b.notes && <div className="text-sm text-neutral-500">ملاحظة: {b.notes}</div>}
            <div className="flex gap-2 pt-1">
              {b.payment_status !== "paid" && (
                <button disabled={busy} onClick={async () => { if (await call(`/api/admin/bookings/${b.id}/mark-paid`, "POST")) setSelected(null); }}
                  className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg disabled:opacity-50">تأكيد دفع يدوي</button>
              )}
              <button disabled={busy} onClick={async () => { if (confirm("إلغاء هذا الحجز؟") && (await call(`/api/admin/bookings/${b.id}`, "PATCH", { status: "cancelled" }))) setSelected(null); }}
                className="text-xs bg-red-50 text-red-700 px-3 py-1.5 rounded-lg disabled:opacity-50">إلغاء الحجز</button>
            </div>
          </div>
        );
      })()}

      {sel && selected?.type === "block" && (() => {
        const b = sel as CBlock;
        return (
          <div className="bg-white border rounded-xl p-4 space-y-2">
            <div className="flex justify-between">
              <div className="font-bold">فترة مقفلة · {unitName(b.unit_id)}</div>
              <button onClick={() => setSelected(null)} className="text-neutral-400 text-sm">إغلاق ✕</button>
            </div>
            <div className="text-sm text-neutral-600">من {fmtTime(b.start_time)} إلى {fmtTime(b.end_time)}{b.reason ? ` · ${b.reason}` : ""}</div>
            <button disabled={busy} onClick={async () => { if (await call(`/api/admin/blocks/${b.id}`, "DELETE")) setSelected(null); }}
              className="text-xs bg-neutral-900 text-white px-3 py-1.5 rounded-lg disabled:opacity-50">فتح الفترة</button>
          </div>
        );
      })()}

      {panel?.kind === "booking" && (
        <ManualBookingForm key={`${panel.unitId}-${panel.hour}`} units={units} date={date} initial={panel} busy={busy}
          onCancel={() => setPanel(null)}
          onSubmit={async (body) => { if (await call("/api/admin/bookings", "POST", body)) setPanel(null); }} />
      )}
      {panel?.kind === "block" && (
        <BlockForm key={panel.unitId} units={units} date={date} initial={panel} busy={busy}
          onCancel={() => setPanel(null)}
          onSubmit={async (body) => { if (await call("/api/admin/blocks", "POST", body)) setPanel(null); }} />
      )}
    </div>
  );
}

function ManualBookingForm({ units, date, initial, busy, onCancel, onSubmit }: {
  units: CUnit[]; date: string; initial: { unitId: string; hour: number }; busy: boolean;
  onCancel: () => void; onSubmit: (body: Record<string, unknown>) => void;
}) {
  const [unitId, setUnitId] = useState(initial.unitId);
  const [d, setD] = useState(date);
  const [hour, setHour] = useState(initial.hour);
  const [hours, setHours] = useState(2);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [guests, setGuests] = useState(2);
  const [method, setMethod] = useState("cash");
  const [total, setTotal] = useState("");
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const unit = units.find((u) => u.id === unitId);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidName(name)) return setErr("الاسم حروف ومسافات فقط");
    if (!isValidPhone(phone)) return setErr("الجوال 10 أرقام ويبدأ بـ 05");
    setErr(null);
    onSubmit({
      unit_id: unitId, guest_name: name, guest_phone: phone, num_guests: guests,
      start_time: new Date(`${d}T${pad(hour)}:00:00${TZ}`).toISOString(), hours,
      payment_method: method, total_price: total, notes,
    });
  }

  return (
    <form onSubmit={submit} className="bg-white border rounded-xl p-4 space-y-3">
      <div className="font-bold">حجز يدوي (يُسجَّل مؤكداً ومدفوعاً)</div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-neutral-500">الكوخ
          <select value={unitId} onChange={(e) => setUnitId(e.target.value)} className="w-full border rounded-lg p-2 text-sm text-black mt-1">
            {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </label>
        <label className="text-xs text-neutral-500">التاريخ
          <input type="date" value={d} onChange={(e) => setD(e.target.value)} className="w-full border rounded-lg p-2 text-sm text-black mt-1" />
        </label>
        <label className="text-xs text-neutral-500">ساعة البداية
          <select value={hour} onChange={(e) => setHour(Number(e.target.value))} className="w-full border rounded-lg p-2 text-sm text-black mt-1">
            {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{pad(h)}:00</option>)}
          </select>
        </label>
        <label className="text-xs text-neutral-500">عدد الساعات
          <select value={hours} onChange={(e) => setHours(Number(e.target.value))} className="w-full border rounded-lg p-2 text-sm text-black mt-1">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
        </label>
        <label className="text-xs text-neutral-500">اسم الضيف
          <input value={name} onChange={(e) => setName(cleanNameInput(e.target.value))} className="w-full border rounded-lg p-2 text-sm text-black mt-1" />
        </label>
        <label className="text-xs text-neutral-500">الجوال
          <input value={phone} dir="ltr" inputMode="numeric" placeholder="05xxxxxxxx" onChange={(e) => setPhone(cleanPhoneInput(e.target.value))} className="w-full border rounded-lg p-2 text-sm text-black mt-1" />
        </label>
        <label className="text-xs text-neutral-500">عدد الأشخاص
          <input type="number" min={1} max={unit?.capacity ?? 10} value={guests} onChange={(e) => setGuests(Number(e.target.value))} className="w-full border rounded-lg p-2 text-sm text-black mt-1" />
        </label>
        <label className="text-xs text-neutral-500">طريقة الدفع
          <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full border rounded-lg p-2 text-sm text-black mt-1">
            <option value="cash">نقداً</option><option value="transfer">تحويل</option><option value="other">أخرى</option>
          </select>
        </label>
        <label className="text-xs text-neutral-500">المبلغ (اتركه فاضي ليُحسب تلقائياً بالخصومات)
          <input type="number" min={0} value={total} onChange={(e) => setTotal(e.target.value)} placeholder="تلقائي" className="w-full border rounded-lg p-2 text-sm text-black mt-1" />
        </label>
        <label className="text-xs text-neutral-500">ملاحظة (اختياري)
          <input value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border rounded-lg p-2 text-sm text-black mt-1" />
        </label>
      </div>
      {err && <div className="text-sm text-red-600">{err}</div>}
      <div className="flex gap-2">
        <button disabled={busy} className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50">{busy ? "جارٍ الحفظ..." : "حفظ الحجز"}</button>
        <button type="button" onClick={onCancel} className="text-sm px-4 py-2 rounded-lg bg-neutral-100">إلغاء</button>
      </div>
    </form>
  );
}

function BlockForm({ units, date, initial, busy, onCancel, onSubmit }: {
  units: CUnit[]; date: string; initial: { unitId: string }; busy: boolean;
  onCancel: () => void; onSubmit: (body: Record<string, unknown>) => void;
}) {
  const [unitId, setUnitId] = useState(initial.unitId);
  const [from, setFrom] = useState(`${date}T00:00`);
  const [to, setTo] = useState(`${date}T23:59`);
  const [reason, setReason] = useState("");
  const [err, setErr] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const s = new Date(`${from}:00${TZ}`);
    const en = new Date(`${to}:00${TZ}`);
    if (isNaN(s.getTime()) || isNaN(en.getTime()) || en <= s) return setErr("وقت النهاية لازم يكون بعد البداية");
    setErr(null);
    onSubmit({ unit_id: unitId, start_time: s.toISOString(), end_time: en.toISOString(), reason });
  }

  return (
    <form onSubmit={submit} className="bg-white border rounded-xl p-4 space-y-3">
      <div className="font-bold">إغلاق فترة (صيانة / استخدام شخصي)</div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-neutral-500">الكوخ
          <select value={unitId} onChange={(e) => setUnitId(e.target.value)} className="w-full border rounded-lg p-2 text-sm text-black mt-1">
            {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </label>
        <label className="text-xs text-neutral-500">السبب (اختياري)
          <input value={reason} onChange={(e) => setReason(e.target.value)} className="w-full border rounded-lg p-2 text-sm text-black mt-1" />
        </label>
        <label className="text-xs text-neutral-500">من
          <input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full border rounded-lg p-2 text-sm text-black mt-1" />
        </label>
        <label className="text-xs text-neutral-500">إلى
          <input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} className="w-full border rounded-lg p-2 text-sm text-black mt-1" />
        </label>
      </div>
      {err && <div className="text-sm text-red-600">{err}</div>}
      <div className="flex gap-2">
        <button disabled={busy} className="bg-neutral-900 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50">{busy ? "جارٍ الحفظ..." : "إغلاق الفترة"}</button>
        <button type="button" onClick={onCancel} className="text-sm px-4 py-2 rounded-lg bg-neutral-100">إلغاء</button>
      </div>
    </form>
  );
}
