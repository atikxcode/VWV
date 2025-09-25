"use client";

import { useEffect, useState } from "react";

export default function OfferPopup({
  imageSrc = "/", // This will be replaced by admin panel data later
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
      <div className="relative w-[600px] h-[300px] bg-white p-[10px] rounded-lg shadow-2xl overflow-hidden">
        {/* Close Button */}
        <button
          onClick={() => setOpen(false)}
          className="absolute -top-[-4%] right-[2%] z-10 bg-black text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-800"
        >
          ✕
        </button>

        {/* Image with border */}
        <div
          className="relative w-full h-full bg-cover bg-center flex items-center justify-center"
          style={{
            backgroundImage: `url(${imageSrc})`
          }}
        >
          {/* Dark overlay inside image */}
          <div className="absolute inset-0 bg-black/40 rounded-lg"></div>

          {/* Centered content */}
          <div className="relative text-center px-4">
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
