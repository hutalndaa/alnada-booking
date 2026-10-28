"use client";

import { useEffect, useState } from "react";

/** رقم واتساب الأكواخ (يُدار من لوحة الإدارة > الإعدادات) */
export function useWhatsAppNumber() {
  const [number, setNumber] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setNumber(d.whatsapp ?? null))
      .catch(() => {});
  }, []);
  return number;
}
