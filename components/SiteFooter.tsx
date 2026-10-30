import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-stone-200 bg-white">
      <div className="max-w-5xl mx-auto px-4 py-8 text-center text-sm text-stone-500">
        <div className="font-bold text-ink-900 mb-1">أكواخ الندى</div>
        <div>حجز بالساعة · دفع آمن · تأكيد فوري</div>
        <nav className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs">
          <Link href="/terms" className="hover:text-sadu-800 hover:underline">الشروط والأحكام</Link>
          <Link href="/privacy" className="hover:text-sadu-800 hover:underline">سياسة الخصوصية</Link>
          <Link href="/refund" className="hover:text-sadu-800 hover:underline">الاسترجاع والإلغاء</Link>
        </nav>
        <div className="mt-4 text-xs text-stone-400">
          © {new Date().getFullYear()} أكواخ الندى. جميع الحقوق محفوظة.
        </div>
      </div>
    </footer>
  );
}
