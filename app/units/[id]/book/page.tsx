import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Unit } from "@/lib/types";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import BookingForm from "@/components/BookingForm";

export const revalidate = 0;

export default async function BookUnitPage({ params }: { params: { id: string } }) {
  const { data: unit } = await supabaseAdmin
    .from("units")
    .select("*")
    .eq("id", params.id)
    .eq("status", "active")
    .single();
  if (!unit) notFound();

  const { data: tiers } = await supabaseAdmin
    .from("pricing_tiers")
    .select("min_hours, discount_percent")
    .or(`unit_id.eq.${params.id},unit_id.is.null`)
    .order("min_hours");

  const u = unit as Unit;
  const tierList = (tiers ?? []).map((t) => ({
    minHours: t.min_hours,
    discountPercent: Number(t.discount_percent),
  }));

  return (
    <>
      <SiteHeader />
      <main className="max-w-5xl mx-auto px-4 pt-6">
        <Link href="/#cabins" className="text-sm text-emerald-800 hover:underline">← كل الأكواخ</Link>

        <div className="mt-4 grid gap-8 lg:grid-cols-5">
          <section className="lg:col-span-2 lg:sticky lg:top-20 self-start">
            <div className="h-48 rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-900" />
            <h1 className="mt-5 text-2xl font-extrabold text-emerald-950">{u.name}</h1>
            <p className="mt-2 leading-8 text-stone-600">
              {u.description || "كوخ مريح ومجهّز لقضاء وقت ممتع."}
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-white border border-stone-200 p-3">
                <dt className="text-stone-500">السعة</dt>
                <dd className="font-bold text-emerald-900">{u.capacity} أشخاص</dd>
              </div>
              <div className="rounded-xl bg-white border border-stone-200 p-3">
                <dt className="text-stone-500">سعر الساعة</dt>
                <dd className="font-bold text-emerald-900">{Number(u.base_hourly_price)} ريال</dd>
              </div>
            </dl>
            {u.amenities?.length > 0 && (
              <>
                <h2 className="mt-5 font-bold text-emerald-950">المميزات</h2>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {u.amenities.map((a) => (
                    <li key={a} className="rounded-full bg-emerald-50 text-emerald-800 text-sm px-3 py-1">{a}</li>
                  ))}
                </ul>
              </>
            )}
            {tierList.length > 0 && (
              <>
                <h2 className="mt-5 font-bold text-emerald-950">خصومات المدد الأطول</h2>
                <ul className="mt-2 space-y-1 text-sm text-stone-600">
                  {tierList.map((t) => (
                    <li key={t.minHours}>من {t.minHours} ساعات: خصم {t.discountPercent}%</li>
                  ))}
                </ul>
              </>
            )}
          </section>

          <section className="lg:col-span-3">
            <h2 className="mb-4 text-xl font-extrabold text-emerald-950">احجز الآن</h2>
            <BookingForm
              unitId={u.id}
              hourlyPrice={Number(u.base_hourly_price)}
              capacity={u.capacity}
              bufferMinutes={u.cleanup_buffer_minutes}
              tiers={tierList}
            />
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
