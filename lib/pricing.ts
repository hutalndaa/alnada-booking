export interface PricingTier {
  minHours: number;
  discountPercent: number;
}

export interface PriceResult {
  hours: number;
  hourlyPrice: number;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  total: number;
}

/**
 * يحسب السعر الإجمالي لحجز بالساعات مع تطبيق أعلى خصم مستحق.
 * الخصومات غير متراكمة - يُطبّق خصم الشريحة الأعلى فقط اللي تحققت شروطها.
 */
export function calculatePrice(
  hourlyPrice: number,
  hours: number,
  tiers: PricingTier[]
): PriceResult {
  if (hours <= 0) throw new Error("عدد الساعات يجب أن يكون أكبر من صفر");

  const applicableTier = tiers
    .filter((t) => hours >= t.minHours)
    .sort((a, b) => b.minHours - a.minHours)[0];

  const discountPercent = applicableTier?.discountPercent ?? 0;
  const subtotal = round2(hourlyPrice * hours);
  const discountAmount = round2(subtotal * (discountPercent / 100));
  const total = round2(subtotal - discountAmount);

  return { hours, hourlyPrice, subtotal, discountPercent, discountAmount, total };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
