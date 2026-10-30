import { HOURS_TEXT, INQUIRY_TEXT } from "@/lib/hours";

/** معلومات الدوام والأسعار - تظهر في الرئيسية وصفحة الحجز */
export default function InfoBar({ weekday, weekend }: { weekday?: number; weekend?: number }) {
  return (
    <section className="rounded-2xl bg-white border border-stone-200 p-5 shadow-sm text-sm leading-8 text-stone-700">
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <div className="font-bold text-emerald-900">🕰️ ساعات العمل</div>
          <div>{HOURS_TEXT}</div>
        </div>
        <div>
          <div className="font-bold text-emerald-900">📩 الرد على الاستفسارات</div>
          <div>{INQUIRY_TEXT}</div>
        </div>
        <div>
          <div className="font-bold text-emerald-900">💰 الأسعار (للساعة)</div>
          <div>
            أيام الأسبوع: {weekday ?? 35} ريال<br />
            نهاية الأسبوع والإجازات: {weekend ?? 45} ريال
          </div>
        </div>
      </div>
      <div className="mt-3 text-xs text-stone-500">يُرجى الحجز مسبقاً. الحجز ينتهي قبل موعد الإغلاق.</div>
    </section>
  );
}
