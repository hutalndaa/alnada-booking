"use client";

import { useEffect, useState } from "react";
import { useStaffAuth, authHeaders } from "@/lib/useStaffAuth";

const empty = {
  name: "", description: "", amenitiesText: "", location_url: "", capacity: 2, base_hourly_price: 35,
  cleanup_buffer_minutes: 15, hold_minutes: 15, status: "active",
};

export default function AdminUnitsPage() {
  const { session } = useStaffAuth();
  const [units, setUnits] = useState<any[]>([]);
  const [form, setForm] = useState<any>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!session) return;
    const res = await fetch("/api/admin/units", { headers: authHeaders(session.token) });
    const data = await res.json();
    setUnits(data.units ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [session]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;

    const { amenitiesText, ...rest } = form;
    const payload = {
      ...rest,
      location_url: String(rest.location_url ?? "").trim() || null,
      amenities: String(amenitiesText ?? "").split(/[,،\n]/).map((x: string) => x.trim()).filter(Boolean),
    };
    if (editingId) {
      await fetch(`/api/admin/units/${editingId}`, {
        method: "PATCH", headers: authHeaders(session.token), body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/admin/units", {
        method: "POST", headers: authHeaders(session.token), body: JSON.stringify(payload),
      });
    }
    setForm(empty);
    setEditingId(null);
    load();
  }

  function startEdit(unit: any) {
    setForm({
      name: unit.name, description: unit.description ?? "", amenitiesText: (unit.amenities ?? []).join("، "), location_url: unit.location_url ?? "", capacity: unit.capacity,
      base_hourly_price: unit.base_hourly_price, cleanup_buffer_minutes: unit.cleanup_buffer_minutes,
      hold_minutes: unit.hold_minutes, status: unit.status,
    });
    setEditingId(unit.id);
  }

  if (loading) return <p className="text-neutral-500">جارٍ التحميل...</p>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-bold mb-3">{editingId ? "تعديل كوخ" : "إضافة كوخ جديد"}</h1>
        <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-4 space-y-3">
          <input required placeholder="الاسم" className="w-full border rounded-lg p-2"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <textarea placeholder="الوصف" className="w-full border rounded-lg p-2"
            value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div>
            <label className="text-xs text-neutral-500">المميزات (افصل بينها بفاصلة)</label>
            <input placeholder="مكيف، واي فاي، مواقف" className="w-full border rounded-lg p-2"
              value={form.amenitiesText} onChange={(e) => setForm({ ...form, amenitiesText: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-neutral-500">رابط الموقع على خرائط قوقل</label>
            <input type="url" dir="ltr" placeholder="https://maps.app.goo.gl/..." className="w-full border rounded-lg p-2"
              value={form.location_url} onChange={(e) => setForm({ ...form, location_url: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-neutral-500">السعة</label>
              <input type="number" min={1} className="w-full border rounded-lg p-2"
                value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs text-neutral-500">سعر الساعة (ريال)</label>
              <input type="number" min={0} step="0.01" className="w-full border rounded-lg p-2"
                value={form.base_hourly_price} onChange={(e) => setForm({ ...form, base_hourly_price: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs text-neutral-500">فاصل التنظيف (دقيقة)</label>
              <input type="number" min={0} className="w-full border rounded-lg p-2"
                value={form.cleanup_buffer_minutes} onChange={(e) => setForm({ ...form, cleanup_buffer_minutes: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs text-neutral-500">مهلة الحجز المؤقت (دقيقة)</label>
              <input type="number" min={1} className="w-full border rounded-lg p-2"
                value={form.hold_minutes} onChange={(e) => setForm({ ...form, hold_minutes: Number(e.target.value) })} />
            </div>
          </div>
          <select className="w-full border rounded-lg p-2" value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="active">نشط</option>
            <option value="maintenance">صيانة</option>
            <option value="inactive">غير نشط</option>
          </select>
          <div className="flex gap-2">
            <button className="bg-neutral-900 text-white rounded-lg px-4 py-2 text-sm">
              {editingId ? "حفظ التعديل" : "إضافة"}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setForm(empty); setEditingId(null); }}
                className="text-sm text-neutral-500">إلغاء</button>
            )}
          </div>
        </form>
      </div>

      <div>
        <h2 className="text-lg font-bold mb-3">الأكواخ الحالية</h2>
        <div className="space-y-2">
          {units.map((u) => (
            <div key={u.id} className="bg-white border rounded-xl p-4 flex justify-between items-center">
              <div>
                <div className="font-medium">{u.name}</div>
                <div className="text-sm text-neutral-500">
                  {u.base_hourly_price} ريال/ساعة · {u.status}
                </div>
              </div>
              <button onClick={() => startEdit(u)} className="text-sm text-blue-600">تعديل</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
