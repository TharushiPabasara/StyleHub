import React, { useContext, useState, useEffect } from 'react';
import { Truck, Sparkles, RotateCcw, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react';
import { SettingsContext } from '../context/SettingsContext';

const getAnnouncementIcon = (text = '') => {
  const lower = text.toLowerCase();
  if (lower.includes('deliver') || lower.includes('shipping')) {
    return <Truck size={12} className="text-emerald-400 flex-shrink-0" />;
  }
  if (lower.includes('return') || lower.includes('exchange')) {
    return <RotateCcw size={12} className="text-sky-400 flex-shrink-0" />;
  }
  if (lower.includes('card') || lower.includes('payment') || lower.includes('cash')) {
    return <CreditCard size={12} className="text-amber-400 flex-shrink-0" />;
  }
  return <Sparkles size={12} className="text-emerald-400 flex-shrink-0" />;
};

const AnnouncementBar = () => {
  const { settings } = useContext(SettingsContext);
  
  const shippingFee = settings?.shippingFee !== undefined ? Number(settings.shippingFee) : 400;
  const freeThreshold = settings?.freeShippingThreshold !== undefined ? Number(settings.freeShippingThreshold) : 15000;

  // Extract raw list of announcements
  let rawList = [];
  if (Array.isArray(settings?.announcements) && settings.announcements.length > 0) {
    rawList = settings.announcements.filter(Boolean);
  } else if (settings?.announcementText) {
    rawList = settings.announcementText.split('\n').map(s => s.trim()).filter(Boolean);
  }

  const returnDays = settings?.returnPolicyDays || 14;

  // Fallback defaults if none configured
  let announcements = rawList.length > 0 ? rawList : [
    `Island-wide Delivery: LKR ${shippingFee.toLocaleString()} • Free Shipping on orders over LKR ${freeThreshold.toLocaleString()}`,
    'New Drops Every Week • Discover Our Handpicked Boutique Styles',
    `Hassle-Free ${returnDays}-Day Returns & Exchanges Across Sri Lanka`,
    'Cash on Delivery & Secure Online Card Payment Available'
  ];

  // If free returns are disabled, filter out return/exchange messages
  if (settings?.enableFreeReturns === false) {
    announcements = announcements.filter(msg => {
      const lower = msg.toLowerCase();
      return !lower.includes('return') && !lower.includes('exchange');
    });
  }

  const mode = settings?.announcementMode || 'marquee'; // 'marquee' or 'slider'
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Slider auto-rotation timer
  useEffect(() => {
    if (mode !== 'slider' || isPaused || announcements.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [mode, isPaused, announcements.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % announcements.length);
  };

  return (
    <div className="bg-black text-white text-xs border-b border-neutral-800 relative z-40 select-none overflow-hidden">
      <style>
        {`
          @keyframes stylehubMarquee {
            0% { transform: translate3d(0, 0, 0); }
            100% { transform: translate3d(-50%, 0, 0); }
          }
          .stylehub-marquee-track {
            display: flex;
            width: max-content;
            animation: stylehubMarquee 26s linear infinite;
            will-change: transform;
          }
          .stylehub-marquee-track:hover {
            animation-play-state: paused;
          }
        `}
      </style>

      {mode === 'slider' ? (
        // Slider Mode: One item at a time with subtle transitions and nav arrows
        <div 
          className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {announcements.length > 1 && (
            <button 
              onClick={handlePrev}
              aria-label="Previous announcement"
              className="text-neutral-400 hover:text-white p-1 transition-colors rounded-full hover:bg-neutral-800"
            >
              <ChevronLeft size={14} />
            </button>
          )}

          <div className="flex-1 flex items-center justify-center gap-2.5 text-center font-medium tracking-wider overflow-hidden px-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/10 text-[10px] uppercase font-bold tracking-widest text-emerald-300">
              {getAnnouncementIcon(announcements[currentIndex])}
              <span>OFFER</span>
            </span>
            <span className="text-[11px] sm:text-xs uppercase text-gray-200 transition-opacity duration-300">
              {announcements[currentIndex]}
            </span>
          </div>

          {announcements.length > 1 && (
            <button 
              onClick={handleNext}
              aria-label="Next announcement"
              className="text-neutral-400 hover:text-white p-1 transition-colors rounded-full hover:bg-neutral-800"
            >
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      ) : (
        // Marquee Mode: Continuous flowing ticker across the screen ("yana vidihata")
        <div 
          className="py-2 overflow-hidden flex items-center cursor-pointer group"
          title="Pause on hover"
        >
          <div className="stylehub-marquee-track flex items-center">
            {/* First set */}
            {announcements.map((text, idx) => (
              <div key={`track-1-${idx}`} className="flex items-center mx-6 sm:mx-10 whitespace-nowrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-[10px] uppercase font-bold tracking-wider text-emerald-300 mr-2">
                  {getAnnouncementIcon(text)}
                  <span className="text-[9px]">STYLEHUB</span>
                </span>
                <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wider text-gray-200">
                  {text}
                </span>
                <span className="mx-6 sm:mx-10 text-emerald-400 text-xs opacity-60">✦</span>
              </div>
            ))}

            {/* Duplicate set for 100% gapless continuous marquee looping */}
            {announcements.map((text, idx) => (
              <div key={`track-2-${idx}`} className="flex items-center mx-6 sm:mx-10 whitespace-nowrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-[10px] uppercase font-bold tracking-wider text-emerald-300 mr-2">
                  {getAnnouncementIcon(text)}
                  <span className="text-[9px]">STYLEHUB</span>
                </span>
                <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wider text-gray-200">
                  {text}
                </span>
                <span className="mx-6 sm:mx-10 text-emerald-400 text-xs opacity-60">✦</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementBar;
