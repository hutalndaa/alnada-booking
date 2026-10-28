"use client";

import { useState } from "react";
import { CABIN_PHOTOS } from "@/lib/photos";

export default function Gallery() {
  const [i, setI] = useState(0);
  const cur = CABIN_PHOTOS[i];
  return (
    <div>
      <div className="h-64 overflow-hidden rounded-2xl bg-emerald-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cur.src} alt={cur.alt} className="h-full w-full object-cover" />
      </div>
      <div className="mt-2 grid grid-cols-5 gap-2">
        {CABIN_PHOTOS.map((p, idx) => (
          <button
            key={p.src}
            type="button"
            onClick={() => setI(idx)}
            aria-label={p.alt}
            className={`h-14 overflow-hidden rounded-lg border-2 transition ${
              idx === i ? "border-emerald-700" : "border-transparent opacity-70 hover:opacity-100"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.src} alt="" loading="lazy" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
