"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const ADS_URL = "/data/ads.json";
const ROTATE_INTERVAL_MS = 5000;

interface Ad {
  image: string;
  link: string;
  alt: string;
}

export default function AdBanner() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetch(ADS_URL)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Ad[]) => {
        if (!cancelled) setAds(data);
      })
      .catch(() => {
        if (!cancelled) setAds([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (ads.length < 2) return;

    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % ads.length);
    }, ROTATE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [ads.length]);

  if (ads.length === 0) return null;

  const ad = ads[index];

  return (
    <div className="mx-auto w-full max-w-4xl px-6">
      <div className="relative aspect-[4/1] w-full overflow-hidden rounded-2xl border border-neon-purple/20">
        <AnimatePresence>
          <motion.a
            key={index}
            href={ad.link}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={ad.alt}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="absolute inset-0 block"
          >
            <img
              src={ad.image}
              alt={ad.alt}
              className="h-full w-full object-cover"
            />
          </motion.a>
        </AnimatePresence>
      </div>
    </div>
  );
}
