import "./globals.css";
import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import WhatsAppFab from "@/components/WhatsAppFab";

const tajawal = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "أكواخ الندى | احجز كوخك بالساعة",
  description: "احجز كوخك بالساعة بسهولة وبسعر واضح. دفع آمن وتأكيد فوري.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#1e2428" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${tajawal.className} bg-mist-50 text-ink-900 min-h-screen antialiased`}>
        {children}
        <WhatsAppFab />
      </body>
    </html>
  );
}
