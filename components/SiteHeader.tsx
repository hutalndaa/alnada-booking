import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-stone-200">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-extrabold text-emerald-900 text-lg">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-800 text-white text-sm">ن</span>
          أكواخ الندى
        </Link>
        <Link href="/#cabins" className="text-sm font-medium text-emerald-800 hover:text-emerald-900">
          الأكواخ
        </Link>
      </div>
    </header>
  );
}
