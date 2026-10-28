import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export interface LegalSection {
  title: string;
  items: string[];
}

export default function LegalPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <>
      <SiteHeader />
      <main className="max-w-2xl mx-auto px-4 pt-10">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-950">{title}</h1>
        <p className="mt-3 leading-8 text-stone-600">{intro}</p>
        <div className="mt-8 space-y-7">
          {sections.map((s, i) => (
            <section key={s.title}>
              <h2 className="font-bold text-emerald-900 text-lg">
                {i + 1}. {s.title}
              </h2>
              <ul className="mt-2 space-y-2 list-disc pr-5 leading-8 text-stone-700">
                {s.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <p className="mt-10 text-xs text-stone-400">آخر تحديث: أكتوبر 2026</p>
      </main>
      <SiteFooter />
    </>
  );
}
