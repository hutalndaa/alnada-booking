"use client";

import { useEffect, useState } from "react";
import { useStaffAuth, authHeaders } from "@/lib/useStaffAuth";

export default function AdminStaffPage() {
  const { session } = useStaffAuth();
  const [staff, setStaff] = useState<any[]>([]);
  const [form, setForm] = useState({ email: "", password: "", full_name: "", role: "operator" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function load() {
    if (!session) return;
    const res = await fetch("/api/admin/staff", { headers: authHeaders(session.token) });
    const data = await res.json();
    setStaff(data.staff ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [session]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    setError(null);
    setSuccess(null);
    const res = await fetch("/api/admin/staff", {
      method: "POST", headers: authHeaders(session.token), body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "حدث خطأ");
      return;
    }
    setSuccess("تم إنشاء الحساب");
    setForm({ email: "", password: "", full_name: "", role: "operator" });
    load();
  }

  if (loading) return <p className="text-neutral-500">جارٍ التحميل...</p>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-bold mb-3">إضافة موظف (مشغل)</h1>
        <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-4 space-y-3">
          <input required placeholder="الاسم الكامل" className="w-full border rounded-lg p-2"
            value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          <input required type="email" placeholder="البريد الإلكتروني" className="w-full border rounded-lg p-2"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input required type="password" placeholder="كلمة مرور مبدئية" className="w-full border rounded-lg p-2"
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <select className="w-full border rounded-lg p-2" value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="operator">مشغل</option>
            <option value="owner">مالك</option>
          </select>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {success && <div className="text-green-600 text-sm">{success}</div>}
          <button className="bg-neutral-900 text-white rounded-lg px-4 py-2 text-sm">إنشاء الحساب</button>
        </form>
      </div>

      <div>
        <h2 className="text-lg font-bold mb-3">الموظفين الحاليين</h2>
        <div className="space-y-2">
          {staff.map((s) => (
            <div key={s.id} className="bg-white border rounded-xl p-4">
              <div className="font-medium">{s.full_name}</div>
              <div className="text-sm text-neutral-500">{s.role === "owner" ? "مالك" : "مشغل"}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
