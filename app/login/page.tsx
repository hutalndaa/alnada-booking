"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (signInError) {
      setError("بيانات الدخول غير صحيحة");
      return;
    }
    router.push("/admin");
  }

  return (
    <main className="max-w-sm mx-auto p-6 mt-12">
      <div className="bg-white border rounded-xl p-6">
        <h1 className="text-xl font-bold mb-4 text-center">دخول لوحة التحكم</h1>
        <form onSubmit={handleLogin} className="space-y-3">
          <input
            required
            type="email"
            placeholder="البريد الإلكتروني"
            className="w-full border rounded-lg p-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            required
            type="password"
            placeholder="كلمة المرور"
            className="w-full border rounded-lg p-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button
            disabled={loading}
            className="w-full bg-neutral-900 text-white rounded-lg p-3 font-medium disabled:opacity-50"
          >
            {loading ? "جارٍ الدخول..." : "دخول"}
          </button>
        </form>
      </div>
    </main>
  );
}
