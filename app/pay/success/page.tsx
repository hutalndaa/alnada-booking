import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";

export default function PaySuccessPage() {
  return (
    <>
      <SiteHeader />
      <main className="max-w-md mx-auto px-4 pt-10">
        <div className="rounded-2xl bg-white border border-stone-200 p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-800">✓</div>
          <h1 className="font-extrabold text-xl text-emerald-950 mb-2">تم تأكيد حجزك</h1>
          <p className="text-stone-500 text-sm leading-7">شكراً لك! سيتم التواصل معك قبل الموعد على رقم جوالك.</p>
          <Link href="/" className="inline-block mt-6 rounded-xl bg-emerald-800 px-6 py-2.5 text-sm font-bold text-white">
            الرجوع للرئيسية
          </Link>
        </div>
      </main>
    </>
  );
}
