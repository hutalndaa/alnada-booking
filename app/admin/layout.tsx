"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useStaffAuth } from "@/lib/useStaffAuth";
import { supabase } from "@/lib/supabase";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { session, loading } = useStaffAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (loading || !session) {
    return <main className="p-6 text-center text-neutral-500">جارٍ التحقق من الجلسة...</main>;
  }

  const navItems = [
    { href: "/admin", label: "الحجوزات" },
    { href: "/admin/calendar", label: "التقويم" },
    ...(session.role === "owner"
      ? [
          { href: "/admin/units", label: "الأكواخ" },
          { href: "/admin/pricing", label: "الأسعار والخصومات" },
          { href: "/admin/staff", label: "الموظفين" },
          { href: "/admin/settings", label: "الإعدادات" },
        ]
      : []),
  ];

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b p-4 flex items-center justify-between">
        <div>
          <div className="font-bold">أكواخ الندى</div>
          <div className="text-xs text-neutral-500">
            {session.full_name} · {session.role === "owner" ? "مالك" : "مشغل"}
          </div>
        </div>
        <button onClick={handleLogout} className="text-sm text-red-600">
          تسجيل خروج
        </button>
      </header>
      <nav className="bg-white border-b px-4 flex gap-4 overflow-x-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`py-3 text-sm whitespace-nowrap border-b-2 ${
              pathname === item.href
                ? "border-neutral-900 font-medium"
                : "border-transparent text-neutral-500"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-4">{children}</div>
    </div>
  );
}
