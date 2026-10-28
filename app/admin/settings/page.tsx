"use client";

import { useEffect, useState } from "react";
import { authHeaders, useStaffAuth } from "@/lib/useStaffAuth";
import { cleanPhoneInput } from "@/lib/validation";

export default function SettingsPage() {
  const { session } = useStaffAuth();
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((d) => setPhone(d.whatsapp ?? ""));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    setSaving(true); setMsg(null);
    const res = await fetch("/api/admin/settings", {
      method: "PUT", headers: authHeaders(session.token), body: JSON.stringify({ whatsapp: phone }),
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
      {msg && <div className={`text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</div>}
      <button disabled={saving} className="bg-neutral-900 text-white text-sm px-5 py-2.5 rounded-lg disabled:opacity-50">
        {saving ? "جارٍ الحفظ..." : "حفظ"}
      </button>
    </form>
  );
}
