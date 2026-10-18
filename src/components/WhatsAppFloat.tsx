import React, { useState } from 'react';
import { Phone, MessageCircle, X, ChevronRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const WhatsAppFloat: React.FC = () => {
  const { settings } = useStore();
  const [isOpen, setIsOpen] = useState(false);

  const cleanNum = (settings.whatsappNumber || '+92316217618').replace(/[^0-9]/g, '');

  const quickQuestions = [
    { title: 'Check Abaya Sizing & Fit', msg: 'Salaam Emerald Haya! Could you please help me pick the right abaya size for my height and frame?' },
    { title: 'Bespoke / Custom Hemming', msg: 'Salaam! I would like to inquire about bespoke alterations and custom sleeve lengths for my order.' },
    { title: 'Track Existing Order', msg: 'Salaam! I placed an order with Emerald Haya and would like to track the dispatch timeline.' }
  ];

  const handleSendWhatsApp = (customMsg?: string) => {
    const defaultMsg = 'Salaam Emerald Haya! I am shopping on your website and would like assistance with luxury modest apparel.';
    const text = encodeURIComponent(customMsg || defaultMsg);
    const url = `https://wa.me/${cleanNum}?text=${text}`;
    window.location.assign(url);
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end">
      {/* Popover dialog */}
      {isOpen && (
        <div className="mb-2.5 w-76 sm:w-84 bg-white border border-[#D4AF37]/50 shadow-2xl rounded-xl p-3.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between pb-2.5 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#002814] text-[#D4AF37] flex items-center justify-center font-bold text-[11px] shadow-sm">
                EH
              </div>
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-900">
                  Emerald Haya Concierge
                </h4>
                <div className="flex items-center gap-1 text-[9.5px] text-emerald-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Online · Master Stylist</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="text-neutral-400 hover:text-black p-1 rounded hover:bg-neutral-100 transition-colors cursor-pointer"
              aria-label="Close concierge"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[11px] text-neutral-600 mt-2 leading-relaxed">
            Welcome to Emerald Haya. Speak directly with our master stylists for bespoke tailoring, sizing advice, or instant orders.
          </p>

          <div className="mt-2.5 space-y-1.5">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendWhatsApp(q.msg)}
                className="w-full text-left text-[11px] p-2 rounded-lg bg-[#F8F6F0] hover:bg-emerald-50 text-neutral-800 flex items-center justify-between transition-colors border border-black/5 cursor-pointer"
              >
                <span className="truncate pr-2">{q.title}</span>
                <ChevronRight className="w-3 h-3 text-[#002814] shrink-0" />
              </button>
            ))}
          </div>

          <div className="mt-2.5 pt-2 border-t border-neutral-100">
            <button
              onClick={() => handleSendWhatsApp()}
              className="w-full py-2 bg-[#002814] hover:bg-[#001A0D] text-white text-[11px] font-semibold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 shadow transition-colors cursor-pointer"
            >
              <Phone className="w-3 h-3 text-[#D4AF37]" />
              Open WhatsApp Chat
            </button>
          </div>
        </div>
      )}

      {/* Trigger floating button - Sleek, smaller size as requested */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center gap-2 px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#002814] hover:bg-[#001A0D] text-white rounded-full shadow-xl border border-[#D4AF37]/80 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
        aria-label="Contact concierge on WhatsApp"
        title="WhatsApp Concierge"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4AF37]" />
        </span>
        {/* Smaller, neat WhatsApp icon */}
        <MessageCircle className="w-4 h-4 text-[#D4AF37]" />
        <span className="text-[11px] font-semibold tracking-wide uppercase hidden sm:inline">
          WhatsApp
        </span>
      </button>
    </div>
  );
};
