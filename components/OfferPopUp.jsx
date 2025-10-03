"use client";

import { useEffect, useState } from "react";

export default function OfferPopup() {
  const [open, setOpen] = useState(false);
  const [popupData, setPopupData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch popup data from API
  useEffect(() => {
    const fetchPopupData = async () => {
      try {
        const response = await fetch("/api/offer-popup");
        const result = await response.json();

        if (result.success && result.data) {
          setPopupData(result.data);
        } else {
          console.log("No active popup found");
        }
      } catch (error) {
        console.error("Error fetching popup:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPopupData();
  }, []);

  // Handle popup display logic
  useEffect(() => {
    if (typeof window === "undefined" || !popupData || loading) return;

    // Check if user has already seen the popup (if showOnce is enabled)
    if (popupData.displayRules?.showOnce) {
      const seen = sessionStorage.getItem("offerPopupSeen");
      if (seen) {
        console.log("Popup already shown in this session");
        return;
      }
    }

    const triggerType = popupData.displayRules?.triggerType || "scroll";
    const delaySeconds = popupData.displayRules?.delaySeconds || 0;

    const showPopup = () => {
      setOpen(true);
      if (popupData.displayRules?.showOnce) {
        sessionStorage.setItem("offerPopupSeen", "true");
      }
    };

    // Handle different trigger types
    switch (triggerType) {
      case "immediate":
        // Show immediately after delay
        if (delaySeconds > 0) {
          const timer = setTimeout(showPopup, delaySeconds * 1000);
          return () => clearTimeout(timer);
        } else {
          showPopup();
        }
        break;

      case "time":
        // Show after specific time delay
        const timeTimer = setTimeout(showPopup, delaySeconds * 1000);
        return () => clearTimeout(timeTimer);

      case "scroll":
        // Show on scroll
        let scrollTriggered = false;
        const handleScroll = () => {
          if (!scrollTriggered && window.scrollY > 100) {
            scrollTriggered = true;
            if (delaySeconds > 0) {
              setTimeout(showPopup, delaySeconds * 1000);
            } else {
              showPopup();
            }
            window.removeEventListener("scroll", handleScroll);
          }
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);

      case "exit":
        // Show on exit intent (mouse leaving viewport)
        let exitTriggered = false;
        const handleMouseLeave = (e) => {
          if (!exitTriggered && e.clientY <= 0) {
            exitTriggered = true;
            if (delaySeconds > 0) {
              setTimeout(showPopup, delaySeconds * 1000);
            } else {
              showPopup();
            }
            document.removeEventListener("mouseleave", handleMouseLeave);
          }
        };
        document.addEventListener("mouseleave", handleMouseLeave);
        return () => document.removeEventListener("mouseleave", handleMouseLeave);

      default:
        // Default to scroll
        const defaultHandleScroll = () => {
          if (!open) {
            showPopup();
          }
        };
        window.addEventListener("scroll", defaultHandleScroll, { once: true });
        return () => window.removeEventListener("scroll", defaultHandleScroll);
    }
  }, [popupData, loading, open]);

  // Don't render if loading or no data
  if (loading || !popupData || !open) return null;

  // Extract popup content
  const {
    imageSrc = "/placeholder.jpg",
    headline = "JOIN OUR",
    title = "NEWSLETTER",
    subtitle = "TO RECEIVE NEW EXCLUSIVE DEALS 50%",
  } = popupData;

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
          className="absolute -top-[-4%] right-[2%] z-10 bg-black text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-800 transition-colors"
          aria-label="Close popup"
        >
          ✕
        </button>

        {/* Image with overlay */}
        <div
          className="relative w-full h-full bg-cover bg-center flex items-center justify-center rounded-lg"
          style={{
            backgroundImage: `url(${imageSrc})`,
          }}
        >
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/40 rounded-lg"></div>

          {/* Centered content */}
          <div className="relative text-center px-4 z-10">
            <p className="text-sm tracking-widest text-white mb-2">
              {headline}
            </p>
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
