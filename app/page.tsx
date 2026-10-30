import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Unit } from "@/lib/types";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { CABIN_PHOTOS } from "@/lib/photos";
import InfoBar from "@/components/InfoBar";

export const revalidate = 0;

const FEATURES = [
  { title: "حجز بالساعة", text: "اختر الوقت اللي يناسبك وادفع على قد استخدامك." },
  { title: "خصم للمدد الأطول", text: "كل ما زادت ساعاتك زاد الخصم تلقائياً." },
  { title: "تأكيد فوري", text: "يتأكد حجزك مباشرة بعد الدفع." },
];

export default async function HomePage() {
  const { data } = await supabase.from("units").select("*").eq("status", "active").order("created_at");
  const units = (data ?? []) as Unit[];

  return (
    <>
      <SiteHeader />
      <section className="bg-gradient-to-b from-emerald-900 to-emerald-800 text-white">
        <div className="max-w-5xl mx-auto px-4 py-14 sm:py-20 text-center">
          <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight">أكواخ الندى</h1>
          <p className="mt-4 text-emerald-100 text-base sm:text-lg max-w-xl mx-auto">
            مرحباً بكم في عالم من الهدوء والجمال… حيث تلتقي الراحة بالفخامة وتُصنع الذكريات التي لا تُنسى ✨
            <br />احجز كوخك بالساعة بخطوات بسيطة.
          </p>
          <a
            href="#cabins"
            className="inline-block mt-8 rounded-xl bg-amber-400 px-8 py-3 font-bold text-emerald-950 hover:bg-amber-300 transition"
          >
            تصفّح الأكواخ
          </a>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4">
        <section className="grid gap-4 sm:grid-cols-3 -mt-8 relative">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl bg-white border border-stone-200 p-5 shadow-sm text-center">
              <div className="font-bold text-emerald-900">{f.title}</div>
              <div className="text-sm text-stone-500 mt-1">{f.text}</div>
            </div>
          ))}
        </section>

        <div className="mt-6">
          <InfoBar weekday={Number(units[0]?.base_hourly_price ?? 35)} weekend={Number(units[0]?.weekend_hourly_price ?? units[0]?.base_hourly_price ?? 45)} />
        </div>

        <section id="cabins" className="pt-14 scroll-mt-16">
          <h2 className="text-2xl font-extrabold text-emerald-950 mb-1">اختر كوخك</h2>
          <p className="text-stone-500 mb-6">كل كوخ بمميزاته وسعره الواضح للساعة.</p>

          <div className="grid gap-5 sm:grid-cols-2">
            {units.map((unit, i) => (
              <article
                key={unit.id}
                className="group flex flex-col rounded-2xl bg-white border border-stone-200 overflow-hidden shadow-sm hover:shadow-lg transition"
              >
                <div className="relative h-48 bg-emerald-900 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={CABIN_PHOTOS[i % CABIN_PHOTOS.length].src}
                    alt={CABIN_PHOTOS[i % CABIN_PHOTOS.length].alt}
                    loading="lazy"
                    className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <span className="absolute bottom-3 right-3 rounded-full bg-black/50 backdrop-blur px-3 py-1 text-xs text-white">
                    كوخ رقم {i + 1}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-lg font-extrabold text-emerald-950">{unit.name}</h3>
                  <p className="mt-2 text-sm leading-7 text-stone-600">
                    {unit.description || "كوخ مريح ومجهّز لقضاء وقت ممتع."}
                  </p>
                  {unit.amenities?.length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {unit.amenities.map((a) => (
                        <li key={a} className="rounded-full bg-emerald-50 text-emerald-800 text-xs px-3 py-1">
                          {a}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-5 flex items-end justify-between">
                    <div>
                      <div className="text-xs text-stone-500">يتسع لـ {unit.capacity} أشخاص</div>
                      <div className="text-2xl font-extrabold text-emerald-900">
                        {Number(unit.base_hourly_price)} <span className="text-sm font-medium text-stone-500">ريال / ساعة</span>
                      </div>
                      {unit.weekend_hourly_price && Number(unit.weekend_hourly_price) !== Number(unit.base_hourly_price) && (
                        <div className="text-xs text-stone-500">{Number(unit.weekend_hourly_price)} ريال نهاية الأسبوع والإجازات</div>
                      )}
                    </div>
                    <Link
                      href={`/units/${unit.id}/book`}
                      className="rounded-xl bg-emerald-800 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-900 transition"
                    >
                      احجز الآن
                    </Link>
                  </div>
                  {unit.location_url && (
                    <a
                      href={unit.location_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 text-sm font-medium text-emerald-800 hover:underline"
                    >
                      📍 الموقع على الخريطة
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
          {!units.length && <p className="text-stone-500">لا توجد أكواخ متاحة حالياً.</p>}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
