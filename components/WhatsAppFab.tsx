"use client";

import { usePathname } from "next/navigation";
import { useWhatsAppNumber } from "@/lib/useWhatsAppNumber";
import { waLink } from "@/lib/whatsapp";

/** زر واتساب عائم في صفحات العملاء فقط */
export default function WhatsAppFab() {
  const pathname = usePathname();
  const number = useWhatsAppNumber();
  if (!number || pathname.startsWith("/admin") || pathname.startsWith("/login")) return null;
  return (
    <a
      href={waLink(number, "السلام عليكم، عندي استفسار عن أكواخ الندى")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="تواصل معنا على واتساب"
      className="fixed bottom-5 left-5 z-30 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-bold text-white shadow-lg hover:brightness-95"
    >
      <svg viewBox="0 0 32 32" className="h-5 w-5 fill-current" aria-hidden>
        <path d="M16 3C8.8 3 3 8.7 3 15.8c0 2.5.7 4.8 2 6.8L3 29l6.6-1.9c1.9 1 4 1.6 6.4 1.6 7.2 0 13-5.7 13-12.8S23.200 3 16 3zm0 23.300c-2.100 0-4-.6-5.700-1.600l-.4-.2-3.900 1.100 1.100-3.800-.3-.4A10.300 10.300 0 0 1 5.600 15.800C5.600 10.100 10.300 5.500 16 5.500s10.400 4.600 10.400 10.300S21.700 26.300 16 26.300zm5.700-7.700c-.3-.2-1.800-.9-2.100-1-.3-.1-.5-.2-.7.200-.2.300-.8 1-1 1.200-.2.200-.4.200-.7.100-.3-.2-1.300-.5-2.500-1.500-.9-.8-1.500-1.800-1.700-2.100-.2-.3 0-.5.100-.6l.5-.5c.1-.2.200-.3.300-.5.100-.2.100-.4 0-.5-.1-.2-.7-1.700-1-2.300-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.100-.8.400-.3.300-1.100 1.100-1.100 2.600s1.100 3 1.300 3.200c.2.200 2.200 3.300 5.300 4.600.7.3 1.300.5 1.700.6.7.2 1.400.2 1.900.1.600-.1 1.800-.7 2-1.400.3-.7.3-1.300.2-1.400-.1-.2-.3-.3-.6-.4z" />
      </svg>
      واتساب
    </a>
  );
}
