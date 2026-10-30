"use client";

import { useEffect, useState } from "react";
import { authHeaders, useStaffAuth } from "@/lib/useStaffAuth";
import { cleanPhoneInput } from "@/lib/validation";

export default function SettingsPage() {
  const { session } = useStaffAuth();
  const [phone, setPhone] = useState("");
  const [holidays, setHolidays] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((d) => { setPhone(d.whatsapp ?? ""); setHolidays(d.holiday_dates ?? ""); });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    setSaving(true); setMsg(null);
    const res = await fetch("/api/admin/settings", {
      method: "PUT", headers: authHeaders(session.token), body: JSON.stringify({ whatsapp: phone, holiday_dates: holidays }),
    });
    const d = await res.json();
    setSaving(false);
    setMsg(res.ok ? { ok: true, text: "تم الحفظ" } : { ok: false, text: d.error ?? "تعذر الحفظ" });
  }

  if (session && session.role !== "owner") return <p className="text-neutral-500">هذه الصفحة للمالك فقط.</p>;

  return (
    <form onSubmit={save} className="max-w-md mx-auto bg-white border rounded-xl p-5 space-y-4">
      <h1 className="font-bold text-lg">الإعدادات</h1>
      <label className="block text-sm">
        <span className="text-neutral-600">رقم واتساب الأكواخ (يظهر للعملاء)</span>
        <input dir="ltr" inputMode="numeric" placeholder="05xxxxxxxx" value={phone}
          onChange={(e) => setPhone(cleanPhoneInput(e.target.value))}
          className="mt-1 w-full border rounded-lg p-2.5" />
        <span className="text-xs text-neutral-400">اتركه فاضي لإخفاء زر الواتساب من الموقع.</span>
      </label>
      <label className="block text-sm">
        <span className="text-neutral-600">أيام الإجازات (تُسعّر بسعر نهاية الأسبوع)</span>
        <textarea dir="ltr" rows={5} placeholder={"2026-12-25\n2027-02-22"} value={holidays}
          onChange={(e) => setHolidays(e.target.value)}
          className="mt-1 w-full border rounded-lg p-2.5 font-mono text-sm" />
        <span className="text-xs text-neutral-400">تاريخ في كل سطر بصيغة سنة-شهر-يوم. الجمعة والسبت بسعر نهاية الأسبوع تلقائياً.</span>
      </label>
      {msg && <div className={`text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</div>}
      <button disabled={saving} className="bg-neutral-900 text-white text-sm px-5 py-2.5 rounded-lg disabled:opacity-50">
        {saving ? "جارٍ الحفظ..." : "حفظ"}
      </button>
    </form>
  );
}
