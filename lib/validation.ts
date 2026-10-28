// تحويل الأرقام العربية/الهندية إلى إنجليزية
export function toEnglishDigits(s: string): string {
  return s
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
}

// حروف (عربي/إنجليزي) ومسافات فقط
const NAME_RE = /^[A-Za-zء-يـ\s]+$/;
export function cleanNameInput(s: string): string {
  return s.replace(/[^A-Za-zء-يـ\s]/g, "");
}
export function isValidName(s: string): boolean {
  const t = s.trim();
  return t.length >= 2 && t.length <= 40 && NAME_RE.test(t);
}

// جوال سعودي: 10 أرقام يبدأ بـ 05
export function cleanPhoneInput(s: string): string {
  return toEnglishDigits(s).replace(/\D/g, "").slice(0, 10);
}
export function isValidPhone(s: string): boolean {
  return /^05\d{8}$/.test(s);
}

export function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
}
