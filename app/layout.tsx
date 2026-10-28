import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Tajawal } from "next/font/google";

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "أكواخ الندى | احجز كوخك بالساعة",
  description: "احجز كوخك بالساعة بسهولة وبسعر واضح. دفع آمن وتأكيد فوري.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#14532d" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${tajawal.className} bg-stone-50 text-stone-900 min-h-screen antialiased`}>
        {children}
      </body>
    </html>
  );
}
