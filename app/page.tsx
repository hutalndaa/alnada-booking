import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Unit } from "@/lib/types";

export const revalidate = 0;

export default async function HomePage() {
  const { data: units } = await supabase
    .from("units")
    .select("*")
    .eq("status", "active")
    .order("created_at");

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">أكواخ الندى</h1>
      <div className="grid gap-4">
        {(units as Unit[] | null)?.map((unit) => (
          <Link
            key={unit.id}
            href={`/units/${unit.id}/book`}
            className="block border rounded-xl p-4 bg-white hover:shadow-md transition"
          >
            <h2 className="text-lg font-semibold">{unit.name}</h2>
            <p className="text-neutral-600 text-sm mt-1">{unit.description}</p>
            <div className="mt-2 text-sm text-neutral-500">
              يتسع لـ {unit.capacity} أشخاص · {unit.base_hourly_price} ريال/ساعة
            </div>
          </Link>
        ))}
        {!units?.length && (
          <p className="text-neutral-500">لا توجد وحدات متاحة حالياً.</p>
        )}
      </div>
    </main>
  );
}
