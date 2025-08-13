"use client";

import { useEffect, useState } from "react";

export default function AgeVerification() {
  const [open, setOpen] = useState(false); // start closed
  const [warn, setWarn] = useState(false);
  const [checked, setChecked] = useState(false); // tracks if we've checked sessionStorage

  useEffect(() => {
    if (typeof window !== "undefined") {
      const ok = sessionStorage.getItem("ageVerified") === "true";
      if (!ok) setOpen(true); // only open if not verified
      setChecked(true); // we've checked now
    }
  }, []);

  // Lock scroll while popup is open
  useEffect(() => {
    if (!open) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [open]);

  const onYes = () => {
    sessionStorage.setItem("ageVerified", "true");
    setOpen(false);
  };

  const onNo = () => setWarn(true);

  // Don't render anything until we've checked sessionStorage
  if (!checked || !open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative mx-4 w-full max-w-2xl rounded-xl bg-white shadow-2xl ring-1 ring-black/10 overflow-hidden">
        <div className="px-8 pt-8 pb-6 text-center">
          
            <img src="/Home_Category/company_logo.jpg" alt="Brand" className="mx-auto h-9 w-auto mb-4" />
         

          <h2 className="text-3xl font-semibold text-gray-900 mb-2">
            Age Warning
          </h2>

          <p className="text-lg font-semibold text-gray-800 mb-2">
            Are you 18+?
          </p>

          <p className="text-gray-500">
            Are you of legal age at your area to purchase vaping products?
          </p>
        </div>

        <div className="h-px w-full bg-gray-200" />

        <div className="px-8 py-5 flex items-center justify-center gap-3">
          <button
            onClick={onYes}
            className="px-4 py-2 text-sm font-semibold text-white rounded-md shadow-sm
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500
                       bg-[#f59e0b] hover:bg-[#ea8a0c]"
          >
            YES
          </button>

          <button
            onClick={onNo}
            className="px-4 py-2 text-sm font-semibold text-white rounded-md shadow-sm
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                       bg-[#3b82f6] hover:bg-[#2f6fe0]"
          >
            NO
          </button>
        </div>

        {warn && (
          <div className="px-8 pb-6 -mt-2 text-center">
            <p className="text-red-600 font-semibold">
              Only 18+ is allowed to visit this website.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
