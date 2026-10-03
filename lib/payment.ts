/**
 * طبقة تجريد الدفع - الهدف إنك تقدر تربط أي بوابة دفع لاحقاً
 * (Moyasar / Tap / PayTabs / HyperPay...) بدون ما تغيّر بقية الكود.
 *
 * الحين: يرجّع رابط صفحة الدفع التجريبية /pay/[bookingId]
 * بعد ما تختار بوابة حقيقية: بدّل الدالة تحت بس، واستدعِ SDK/API البوابة
 * لإنشاء عملية دفع فعلية وترجيع رابط الدفع الحقيقي منها.
 */
export interface PaymentIntent {
  checkoutUrl: string;
  provider: "mock" | "moyasar" | "tap" | "paytabs";
}

export async function createPaymentIntent(bookingId: string, amount: number): Promise<PaymentIntent> {
  // TODO: استبدل هذا بالتكامل الفعلي مع بوابة الدفع المختارة
  return {
    checkoutUrl: `/pay/${bookingId}`,
    provider: "mock",
  };
}
