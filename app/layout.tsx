import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "أكواخ الندى",
  description: "نظام حجوزات أكواخ الندى",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-neutral-50 text-neutral-900 min-h-screen">{children}</body>
    </html>
  );
}
