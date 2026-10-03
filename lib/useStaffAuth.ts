"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { StaffRole } from "@/lib/authGuard";

interface StaffSession {
  token: string;
  email: string | null;
  role: StaffRole;
  full_name: string;
}

/**
 * Hook يُستخدم داخل صفحات /admin - يتأكد إن فيه جلسة دخول صالحة
 * ويجيب دور الموظف (owner/operator)، ويحوّل لصفحة الدخول لو ما فيه جلسة.
 */
export function useStaffAuth() {
  const router = useRouter();
  const [session, setSession] = useState<StaffSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const user = data.session?.user;

      if (!token || !user) {
        router.replace("/login");
        return;
      }

      const { data: staffRow } = await supabase
        .from("staff")
        .select("full_name, role")
        .eq("id", user.id)
        .single();

      if (!staffRow) {
        router.replace("/login?error=unauthorized");
        return;
      }

      setSession({
        token,
        email: user.email ?? null,
        role: staffRow.role as StaffRole,
        full_name: staffRow.full_name,
      });
      setLoading(false);
    })();
  }, [router]);

  return { session, loading };
}

export function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}
