import React, { useState } from 'react';
import { 
  ArrowRight, 
  Phone, 
  Mail, 
  MapPin, 
  Sparkles, 
  Check, 
  MessageCircle, 
  Instagram, 
  Facebook, 
  Youtube, 
  Music2, 
  CreditCard, 
  ShieldCheck, 
  Truck, 
  Banknote,
  Award
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { useStore } from '../context/StoreContext';
import { StorageService } from '../services/storageService';

export const Footer: React.FC = () => {
  const { navigateTo, setSelectedCategoryFilter, settings, showToast } = useStore();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      showToast('Please provide a valid email address', 'error');
      return;
    }
    StorageService.subscribeNewsletter(newsletterEmail);
    setSubscribed(true);
    showToast('Welcome to Emerald Haya Private Client Privileges');
    setNewsletterEmail('');
  };

  const categoryLinks = [
    { label: 'Signature Abayas & Kimonos', cat: 'Abayas & Kimonos' },
    { label: 'Modest Co-Ords & Sets', cat: 'Modest Co-Ords & Sets' },
    { label: 'Luxury Evening Gowns', cat: 'Luxury Evening Gowns' },
    { label: 'Abaya & Stole Combo Deals', cat: 'Abaya & Stole Combo Deals' },
    { label: 'Medina Silk Stoles & Sheilas', cat: 'Stoles & Sheilas' },
    { label: 'Magnetic Hijab Pins & Brooches', cat: 'Magnetic Pins & Brooches' },
    { label: 'Open Front Abayas', cat: 'Open Abayas' },
    { label: 'Kimono Cuts', cat: 'Kimono Abayas' },
    { label: 'Farasha Silks', cat: 'Farasha Abayas' },
    { label: 'Pure Korean Nida', cat: 'Nida Abayas' }
  ];

  const baseCustomerCareLinks = [
    { label: 'Track Your Order', page: 'track-order' },
    { label: 'Boutique Shopping Bag', page: 'cart' },
    { label: 'Wishlist & Favorites', page: 'wishlist' },
    { label: 'Frequent Inquiries (FAQ)', page: 'faqs' },
    { label: 'Atelier Stories & Style Guide', page: 'blog' },
    { label: 'Contact Atelier & Support', page: 'contact' }
  ];

  // Only show Coming Soon if active in settings
  const customerCareLinks = settings.isComingSoonActive
    ? [{ label: 'Coming Soon (Seasonal Preview)', page: 'coming-soon' }, ...baseCustomerCareLinks]
    : baseCustomerCareLinks;

  const policyLinks = [
    { label: 'Shipping & Delivery', page: 'shipping' },
    { label: 'Refund & Alteration Policy', page: 'refund' },
    { label: 'Privacy Policy', page: 'privacy' },
    { label: 'Terms of Service', page: 'terms' }
  ];

  const cleanWhatsApp = (settings.whatsappNumber || '+92316217618').replace(/[^0-9]/g, '');

  return (
    <footer className="bg-[#0B0B0B] text-[#FDFBF7] pt-14 pb-10 border-t border-[#D4AF37]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Newsletter & Brand Statement Banner */}
        <div className="pb-12 border-b border-white/10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="max-w-xl">
            <span className="text-[#D4AF37] text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Private Client Register
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-light text-white leading-tight">
              Receive Invitations to Exclusive Designer Edits & Private Seasonal Sales
            </h3>
            <p className="text-xs text-neutral-400 mt-2">
              Join our connoisseur circle for priority access to new modest wear drops and private promotions.
            </p>
          </div>

          <form onSubmit={handleNewsletterSubmit} className="w-full lg:w-auto flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="Enter your email address..."
              className="px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-sm text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#D4AF37] w-full sm:w-80"
              disabled={subscribed}
            />
            <button
              type="submit"
              disabled={subscribed}
              className="px-6 py-3 bg-[#002814] hover:bg-[#001A0D] text-[#F3E5AB] text-xs font-bold uppercase tracking-wider rounded-sm transition-colors flex items-center justify-center gap-2 border border-[#D4AF37]/50 shrink-0 cursor-pointer"
            >
              {subscribed ? (
                <>
                  <Check className="w-4 h-4 text-[#D4AF37]" />
                  <span>Subscribed</span>
                </>
              ) : (
                <>
                  <span>Join Privileges</span>
                  <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* 4 Columns Navigation Section */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-2">
            <BrandLogo variant="light" size="lg" />
            <p className="text-xs text-neutral-400 leading-relaxed mt-4 max-w-sm">
              Emerald Haya is an elite modest apparel design house dedicated to timeless modest couture, fine hand-embroidered abayas, co-ords, and luxury evening wear.
            </p>

            <div className="mt-5 space-y-2.5 text-xs text-neutral-300">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span>{settings.address}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <a href={`tel:${settings.whatsappNumber}`} className="hover:text-[#D4AF37] transition-colors">
                  {settings.whatsappNumber}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <a href={`mailto:${settings.storeEmail}`} className="hover:text-[#D4AF37] transition-colors">
                  {settings.storeEmail}
                </a>
              </div>
            </div>

            {/* Social Icons using Crisp Lucide Icons (No Broken Images) */}
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <a
                href={`https://wa.me/${cleanWhatsApp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-[#002814] text-[#D4AF37] border border-[#D4AF37]/40 flex items-center justify-center hover:bg-[#00381C] hover:scale-105 transition-all shadow-sm"
                title="WhatsApp Concierge"
              >
                <MessageCircle className="w-4 h-4" />
              </a>

              {settings.instagramUrl && (
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-neutral-900 text-neutral-300 border border-neutral-800 flex items-center justify-center hover:border-[#D4AF37] hover:text-[#D4AF37] hover:scale-105 transition-all"
                  title="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}

              {settings.facebookUrl && (
                <a
                  href={settings.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-neutral-900 text-neutral-300 border border-neutral-800 flex items-center justify-center hover:border-[#D4AF37] hover:text-[#D4AF37] hover:scale-105 transition-all"
                  title="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              )}

              {settings.tiktokUrl && (
                <a
                  href={settings.tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-neutral-900 text-neutral-300 border border-neutral-800 flex items-center justify-center hover:border-[#D4AF37] hover:text-[#D4AF37] hover:scale-105 transition-all"
                  title="TikTok"
                >
                  <Music2 className="w-4 h-4" />
                </a>
              )}

              {settings.youtubeUrl && (
                <a
                  href={settings.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-neutral-900 text-neutral-300 border border-neutral-800 flex items-center justify-center hover:border-[#D4AF37] hover:text-[#D4AF37] hover:scale-105 transition-all"
                  title="YouTube"
                >
                  <Youtube className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Col 2: Categories */}
          <div>
            <h4 className="font-serif text-sm font-semibold uppercase tracking-wider text-[#D4AF37] mb-4">
              Collections
            </h4>
            <ul className="space-y-2 text-xs text-neutral-300">
              {categoryLinks.map((item) => (
                <li key={item.label}>
                  <button
                    onClick={() => {
                      setSelectedCategoryFilter(item.cat);
                      navigateTo('shop');
                    }}
                    className="hover:text-[#D4AF37] transition-colors text-left cursor-pointer"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Customer Care */}
          <div>
            <h4 className="font-serif text-sm font-semibold uppercase tracking-wider text-[#D4AF37] mb-4">
              Client Care
            </h4>
            <ul className="space-y-2 text-xs text-neutral-300">
              {customerCareLinks.map((item) => (
                <li key={item.label}>
                  <button
                    onClick={() => navigateTo(item.page)}
                    className="hover:text-[#D4AF37] transition-colors text-left cursor-pointer"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
              <li>
                <a
                  href={`https://wa.me/${cleanWhatsApp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#D4AF37] transition-colors text-emerald-400 font-medium inline-flex items-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WhatsApp: {settings.whatsappNumber}</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Policies & Trust Badge */}
          <div>
            <h4 className="font-serif text-sm font-semibold uppercase tracking-wider text-[#D4AF37] mb-4">
              Boutique Policies
            </h4>
            <ul className="space-y-2 text-xs text-neutral-300">
              {policyLinks.map((item) => (
                <li key={item.label}>
                  <button
                    onClick={() => navigateTo(item.page)}
                    className="hover:text-[#D4AF37] transition-colors text-left cursor-pointer"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-6 p-3.5 bg-neutral-900/90 rounded-lg border border-[#D4AF37]/30 flex items-start gap-2.5">
              <Award className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#D4AF37] block font-bold">
                  Guaranteed Authenticity
                </span>
                <span className="text-[11px] text-neutral-400 block mt-0.5 leading-snug">
                  Every garment comes with an Atelier Certificate of Authenticity & Fabric Care Guide.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright and Payment / Trust Icons */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between text-xs text-neutral-400 gap-4">
          <div className="flex flex-wrap items-center gap-2 text-center md:text-left">
            <span>© {new Date().getFullYear()} Emerald Haya Modest Apparel. All Rights Reserved.</span>
            <span className="hidden sm:inline">·</span>
            <button
              onClick={() => navigateTo('admin')}
              className="text-neutral-400 hover:text-[#D4AF37] transition-colors underline cursor-pointer"
              title="Access Atelier Management Console"
            >
              Admin Dashboard (/admin)
            </button>
          </div>

          {/* Pure Lucide Icons for Trust & Payment methods (No broken images) */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-neutral-300">
            <div className="flex items-center gap-1.5 bg-neutral-900 px-2.5 py-1 rounded border border-neutral-800">
              <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>WhatsApp Direct</span>
            </div>
            <div className="flex items-center gap-1.5 bg-neutral-900 px-2.5 py-1 rounded border border-neutral-800">
              <Banknote className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Cash on Delivery</span>
            </div>
            <div className="flex items-center gap-1.5 bg-neutral-900 px-2.5 py-1 rounded border border-neutral-800">
              <CreditCard className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Card / Bank</span>
            </div>
            <div className="flex items-center gap-1.5 bg-neutral-900 px-2.5 py-1 rounded border border-neutral-800">
              <Truck className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Express Delivery</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
