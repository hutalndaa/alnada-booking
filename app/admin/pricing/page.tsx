"use client";

import { useEffect, useState } from "react";
import { useStaffAuth, authHeaders } from "@/lib/useStaffAuth";

export default function AdminPricingPage() {
  const { session } = useStaffAuth();
  const [tiers, setTiers] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [form, setForm] = useState({ unit_id: "", min_hours: 4, discount_percent: 10 });
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!session) return;
    const [tiersRes, unitsRes] = await Promise.all([
      fetch("/api/admin/pricing-tiers", { headers: authHeaders(session.token) }),
      fetch("/api/admin/units", { headers: authHeaders(session.token) }),
    ]);
    setTiers((await tiersRes.json()).tiers ?? []);
    setUnits((await unitsRes.json()).units ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [session]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    await fetch("/api/admin/pricing-tiers", {
      method: "POST",
      headers: authHeaders(session.token),
      body: JSON.stringify({ ...form, unit_id: form.unit_id || null }),
    });
    setForm({ unit_id: "", min_hours: 4, discount_percent: 10 });
    load();
  }

  async function handleDelete(id: string) {
    if (!session) return;
    await fetch(`/api/admin/pricing-tiers/${id}`, { method: "DELETE", headers: authHeaders(session.token) });
    load();
  }

  if (loading) return <p className="text-neutral-500">جارٍ التحميل...</p>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-bold mb-3">إضافة شريحة خصم</h1>
        <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-4 space-y-3">
          <select className="w-full border rounded-lg p-2" value={form.unit_id}
            onChange={(e) => setForm({ ...form, unit_id: e.target.value })}>
            <option value="">كل الأكواخ (عام)</option>
            {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-neutral-500">من كم ساعة</label>
              <input type="number" min={1} className="w-full border rounded-lg p-2"
                value={form.min_hours} onChange={(e) => setForm({ ...form, min_hours: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs text-neutral-500">نسبة الخصم %</label>
              <input type="number" min={0} max={100} className="w-full border rounded-lg p-2"
                value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: Number(e.target.value) })} />
            </div>
          </div>
          <button className="bg-neutral-900 text-white rounded-lg px-4 py-2 text-sm">إضافة</button>
        </form>
      </div>

      <div>
        <h2 className="text-lg font-bold mb-3">الشرائح الحالية</h2>
        <div className="space-y-2">
          {tiers.map((t) => (
            <div key={t.id} className="bg-white border rounded-xl p-4 flex justify-between items-center">
              <div className="text-sm">
                <b>{t.units?.name ?? "كل الأكواخ"}</b> — من {t.min_hours} ساعات: خصم {t.discount_percent}%
              </div>
              <button onClick={() => handleDelete(t.id)} className="text-sm text-red-600">حذف</button>
            </div>
          ))}
          {!tiers.length && <p className="text-neutral-500 text-sm">لا توجد شرائح خصم بعد.</p>}
        </div>
      </div>
    </div>
  );
}
