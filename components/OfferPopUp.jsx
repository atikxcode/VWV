"use client";

import { useEffect, useState } from "react";

export default function OfferPopup({
  imageSrc = "/Home_Category/13.jpg", // This will be replaced by admin panel data later
  headline = "JOIN OUR",
  title = "NEWSLETTER",
  subtitle = "TO RECEIVE NEW EXCLUSIVE DEALS 50%"
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Only show once per session
    const seen = sessionStorage.getItem("offerSeen") === "true";
    if (seen) return;

    const handleScroll = () => {
      if (!open) {
        setOpen(true);
        sessionStorage.setItem("offerSeen", "true");
      }
    };

    window.addEventListener("scroll", handleScroll, { once: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Popup Modal */}
      <div className="relative mx-4 w-full max-w-2xl bg-white shadow-2xl rounded-lg overflow-hidden">
        {/* Close Button */}
        <button
          onClick={() => setOpen(false)}
          className="absolute top-3 right-3 z-10 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/80"
        >
          ✕
        </button>

        {/* Image Background */}
        <div
          className="relative flex flex-col items-center justify-center text-center p-10 bg-cover bg-center"
          style={{
            backgroundImage: `url(${imageSrc})`
          }}
        >
          <div className="bg-black/50 p-6 rounded-lg">
            <p className="text-sm tracking-widest text-white mb-2">{headline}</p>
            <h2 className="text-4xl font-extrabold text-white tracking-wide mb-2">
              {title}
            </h2>
            <p className="text-white font-medium">{subtitle}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
