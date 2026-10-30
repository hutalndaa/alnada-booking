"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    params.get("error") === "unauthorized" ? "هذا الحساب غير مصرّح له بدخول لوحة التحكم" : null
  );
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (signInError) {
      setLoading(false);
      setError("بيانات الدخول غير صحيحة");
      return;
    }
    router.replace("/admin");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-ink-900 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-sadu-800 text-xl font-bold text-white">ن</div>
        <h1 className="text-xl font-extrabold text-center text-ink-900">دخول لوحة التحكم</h1>
        <p className="text-center text-sm text-stone-500 mb-5">أكواخ الندى</p>
        <form onSubmit={handleLogin} className="space-y-3">
          <input
            required type="email" dir="ltr" autoComplete="email" placeholder="البريد الإلكتروني"
            className="w-full rounded-xl border border-stone-300 px-4 py-3 outline-none focus:border-sadu-700 focus:ring-2 focus:ring-sadu-200"
            value={email} onChange={(e) => setEmail(e.target.value)} style={{ textAlign: "right" }}
          />
          <input
            required type="password" dir="ltr" autoComplete="current-password" placeholder="كلمة المرور"
            className="w-full rounded-xl border border-stone-300 px-4 py-3 outline-none focus:border-sadu-700 focus:ring-2 focus:ring-sadu-200"
            value={password} onChange={(e) => setPassword(e.target.value)} style={{ textAlign: "right" }}
          />
          {error && <div className="rounded-lg bg-red-50 text-red-700 text-sm p-3">{error}</div>}
          <button
            disabled={loading}
            className="w-full rounded-xl bg-sadu-800 py-3 font-bold text-white hover:bg-ink-900 disabled:opacity-50"
          >
            {loading ? "جارٍ الدخول..." : "دخول"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
