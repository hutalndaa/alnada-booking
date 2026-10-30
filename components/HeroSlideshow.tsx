import { CABIN_PHOTOS } from "@/lib/photos";

// عرض صور متحركة بدون جافاسكربت (CSS فقط) — كل صورة تظهر ثم تتلاشى
export default function HeroSlideshow() {
  const photos = CABIN_PHOTOS.slice(0, 5);
  const n = photos.length;
  const per = 6; // ثواني لكل صورة
  return (
    <section className="relative isolate overflow-hidden bg-ink-900 text-white">
      <div className="absolute inset-0 -z-10" aria-hidden>
        {photos.map((p, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={p.src}
            src={p.src}
            alt=""
            className="hero-slide absolute inset-0 h-full w-full object-cover"
            style={{ animationDuration: `${per * n}s`, animationDelay: `${i * per}s`, opacity: i === 0 ? 1 : 0 }}
            loading={i === 0 ? "eager" : "lazy"}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/90 via-ink-900/45 to-ink-900/30" />
      </div>
      <div className="max-w-5xl mx-auto px-4 pt-24 pb-16 sm:pt-36 sm:pb-24">
        <h1 className="text-4xl sm:text-6xl font-bold leading-tight">أكواخ الندى</h1>
        <p className="mt-4 max-w-xl text-base sm:text-lg leading-8 text-white/90">
          مرحباً بكم في عالم من الهدوء والجمال، حيث تلتقي الراحة بالفخامة وتُصنع الذكريات التي لا تُنسى.
          <br />احجز كوخك بالساعة بخطوات بسيطة.
        </p>
        <a
          href="#cabins"
          className="inline-block mt-8 rounded-lg bg-sadu-800 px-8 py-3 font-bold text-white hover:bg-sadu-700 transition"
        >
          تصفّح الأكواخ
        </a>
      </div>
      <div className="h-1.5 sadu-band" aria-hidden />
    </section>
  );
}
