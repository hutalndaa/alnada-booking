/**
 * إعدادات الضريبة. الأسعار المعروضة والمحسوبة تعتبر "شاملة" ضريبة القيمة المضافة.
 * لو المنشأة غير مسجّلة في الضريبة: غيّر VAT_INCLUDED إلى false وسيختفي الذكر من الموقع.
 */
export const VAT_INCLUDED = true;
export const VAT_PERCENT = 15;
export const VAT_NOTE = VAT_INCLUDED
  ? `السعر شامل ضريبة القيمة المضافة (${VAT_PERCENT}%)`
  : "السعر غير خاضع لضريبة القيمة المضافة";

/** رقم الحجز الظاهر للعميل والإدارة */
export function fmtBookingNo(n: number | string | null | undefined): string {
  return n === null || n === undefined || n === "" ? "" : String(n);
}
