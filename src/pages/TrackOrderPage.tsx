import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Truck, 
  CheckCircle2, 
  Clock, 
  Package, 
  MapPin, 
  Phone,
  Sparkles,
  ArrowRight,
  Loader2,
  Copy,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { OrderStatus, Order } from '../types';

export const TrackOrderPage: React.FC = () => {
  const { pageParam, getOrderById, searchOrderAsync, formatPrice, navigateTo, settings, showToast } = useStore();

  const [searchQuery, setSearchQuery] = useState(pageParam || '');
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (pageParam) {
      setSearchQuery(pageParam);
      runSearch(pageParam);
    }
  }, [pageParam]);

  const runSearch = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setIsSearching(true);
    setHasSearched(true);

    // 1. Fast sync search in local state
    const foundLocal = getOrderById(trimmed);
    if (foundLocal) {
      setSearchedOrder(foundLocal);
      setIsSearching(false);
      return;
    }

    // 2. Async search in Firestore fallback
    try {
      const foundRemote = await searchOrderAsync(trimmed);
      setSearchedOrder(foundRemote || null);
    } catch {
      setSearchedOrder(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(searchQuery);
  };

  const steps: { status: OrderStatus; label: string; desc: string }[] = [
    { status: 'pending', label: 'Order Registered', desc: 'WhatsApp order received and awaiting tailoring review' },
    { status: 'confirmed', label: 'Measurements Verified', desc: 'Atelier confirmed sizing, fabric yardage and hemming requirements' },
    { status: 'processing', label: 'Hand-Tailoring Atelier', desc: 'Master artisans cutting Korean Nida & hand-finishing sleeve borders' },
    { status: 'shipped', label: 'Dispatched with Courier', desc: 'Handed over to nationwide express courier with tracking ID' },
    { status: 'delivered', label: 'Delivered to Recipient', desc: 'Package hand-delivered in luxury Emerald Haya scented garment packaging' }
  ];

  const getStepIndex = (status: OrderStatus) => {
    const map: Record<OrderStatus, number> = {
      pending: 0,
      confirmed: 1,
      processing: 2,
      shipped: 3,
      delivered: 4,
      cancelled: -1
    };
    return map[status] ?? 0;
  };

  const currentStep = searchedOrder ? getStepIndex(searchedOrder.status) : 2;

  const handleQuickTest = (query: string) => {
    setSearchQuery(query);
    runSearch(query);
  };

  const copyTrackingNumber = (trackingNum: string) => {
    navigator.clipboard?.writeText(trackingNum);
    showToast(`Tracking number "${trackingNum}" copied to clipboard!`, 'success');
  };

  return (
    <div className="w-full bg-[#FDFBF7] py-12 sm:py-20 min-h-[75vh]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="text-[#002814] text-xs font-semibold uppercase tracking-[0.25em] block mb-1">
            Nationwide Courier Tracking
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-light text-[#111111]">
            Track Your Haute Couture Order
          </h1>
          <p className="text-xs text-neutral-500 mt-2 max-w-md mx-auto leading-relaxed">
            Enter your Order Number (e.g. <strong>#EH-84920</strong>), phone number (e.g. <strong>03001234567</strong>), or consignment tracking code.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="mt-6 max-w-lg mx-auto flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter Order # or Pakistani phone number..."
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-[#002814]/30 rounded focus:outline-none focus:border-[#002814] shadow-sm font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-6 py-2.5 bg-[#002814] hover:bg-[#001A0D] text-white text-xs font-bold uppercase tracking-wider rounded transition-colors shadow flex items-center gap-1.5 cursor-pointer"
            >
              {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Track Order</span>
            </button>
          </form>

          {/* Quick Demo Test Buttons */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-neutral-400 text-[11px]">Quick Samples:</span>
            <button
              type="button"
              onClick={() => handleQuickTest('EH-84920')}
              className="px-2.5 py-1 bg-white hover:bg-emerald-50 border border-neutral-200 rounded font-mono text-[11px] text-[#002814] font-semibold transition-colors"
            >
              #EH-84920 (Shipped)
            </button>
            <button
              type="button"
              onClick={() => handleQuickTest('EH-92144')}
              className="px-2.5 py-1 bg-white hover:bg-emerald-50 border border-neutral-200 rounded font-mono text-[11px] text-[#002814] font-semibold transition-colors"
            >
              #EH-92144 (Tailoring)
            </button>
            <button
              type="button"
              onClick={() => handleQuickTest('03001234567')}
              className="px-2.5 py-1 bg-white hover:bg-emerald-50 border border-neutral-200 rounded font-mono text-[11px] text-[#002814] font-semibold transition-colors"
            >
              Phone: 03001234567
            </button>
          </div>
        </div>

        {/* Searching indicator */}
        {isSearching && (
          <div className="p-8 bg-white border border-neutral-200 rounded-sm text-center shadow-sm">
            <Loader2 className="w-6 h-6 animate-spin text-[#002814] mx-auto mb-2" />
            <p className="text-xs text-neutral-600 font-mono">Searching atelier records & Firestore cloud...</p>
          </div>
        )}

        {/* Search Results Display: Not Found */}
        {hasSearched && !isSearching && !searchedOrder && (
          <div className="p-8 bg-white border border-neutral-200 rounded-sm text-center shadow-sm">
            <p className="text-sm font-bold text-neutral-800">
              No matching order record found for "{searchQuery}"
            </p>
            <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
              Barahe karam apna Order Number (#EH-XXXX) ya order place karte waqt istemal shuda 11-digit Pakistani mobile number check karein.
            </p>
            <a
              href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Assalam o Alaikum! I need help tracking my order: ${searchQuery}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-xs text-[#002814] font-bold uppercase tracking-wider underline"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Contact Concierge on WhatsApp</span>
            </a>
          </div>
        )}

        {/* Search Results Display: Order Found */}
        {searchedOrder && !isSearching && (
          <div className="bg-white border border-[#D4AF37]/50 rounded-sm p-6 sm:p-10 shadow-lg space-y-8">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-neutral-100 gap-4">
              <div>
                <span className="text-[10px] text-[#002814] uppercase tracking-widest font-semibold block">
                  Bespoke Consignment Verified
                </span>
                <h2 className="font-serif text-2xl font-bold text-neutral-900 mt-0.5">
                  Order #{searchedOrder.orderNumber}
                </h2>
                <div className="text-xs text-neutral-500 font-mono mt-1">
                  Recipient: <strong>{searchedOrder.customerName}</strong> ({searchedOrder.city}, {searchedOrder.country || 'Pakistan'})
                </div>
                <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                  Address: {searchedOrder.address}
                </div>
              </div>

              <div className="flex sm:flex-col items-end justify-between">
                <span className="text-xs text-neutral-400 font-mono">
                  Placed: {new Date(searchedOrder.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <span className={`mt-1 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider font-mono ${
                  searchedOrder.status === 'delivered'
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : searchedOrder.status === 'shipped'
                    ? 'bg-blue-100 text-blue-900 border border-blue-300'
                    : 'bg-[#002814] text-[#F3E5AB]'
                }`}>
                  Status: {searchedOrder.status}
                </span>
              </div>
            </div>

            {/* Courier Dispatch Card */}
            <div className="p-4 bg-[#FAF7F0] border border-[#D4AF37]/30 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#002814] text-[#F3E5AB] flex items-center justify-center shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider block">
                    Express Courier Partner
                  </span>
                  <div className="text-sm font-bold text-neutral-900">
                    {searchedOrder.courierName || 'Pakistan Express Courier (TCS / Trax)'}
                  </div>
                  {searchedOrder.estimatedDelivery && (
                    <div className="text-xs text-emerald-800 font-medium">
                      Estimated Delivery: {searchedOrder.estimatedDelivery}
                    </div>
                  )}
                </div>
              </div>

              {searchedOrder.trackingNumber && (
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded border border-neutral-200">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-neutral-400 block">Consignment Tracking #</span>
                    <span className="font-mono text-xs font-bold text-neutral-900">{searchedOrder.trackingNumber}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyTrackingNumber(searchedOrder.trackingNumber!)}
                    className="p-1 text-neutral-400 hover:text-black hover:bg-neutral-100 rounded"
                    title="Copy tracking number"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Visual Timeline Stepper */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 mb-6">
                Dispatch Milestones
              </h3>

              <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-2.5 sm:before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-200">
                {steps.map((step, idx) => {
                  const isCompleted = idx <= currentStep;
                  const isCurrent = idx === currentStep;

                  return (
                    <div key={step.status} className="relative flex items-start gap-4">
                      {/* Step Circle Indicator */}
                      <div
                        className={`absolute -left-6 sm:-left-8 w-5 sm:w-7 h-5 sm:h-7 rounded-full flex items-center justify-center text-xs transition-colors ${
                          isCompleted
                            ? 'bg-[#002814] text-white ring-4 ring-emerald-50'
                            : 'bg-neutral-200 text-neutral-400'
                        } ${isCurrent ? 'ring-[#D4AF37] ring-2 animate-pulse' : ''}`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-[#D4AF37]" />
                        ) : (
                          <span className="font-mono text-[10px]">{idx + 1}</span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="pt-0.5">
                        <div className="flex items-center gap-2">
                          <h4
                            className={`font-serif text-base font-bold ${
                              isCompleted ? 'text-neutral-900' : 'text-neutral-400'
                            }`}
                          >
                            {step.label}
                          </h4>
                          {isCurrent && (
                            <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                              In Progress
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ordered Items Summary */}
            <div className="pt-6 border-t border-neutral-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 mb-4">
                Garments in this Consignment
              </h3>
              <div className="space-y-3">
                {searchedOrder.items.map((it: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs py-2 border-b border-neutral-50 last:border-b-0">
                    <div className="flex items-center gap-3">
                      <img src={it.image} alt="" className="w-10 h-12 object-cover rounded bg-neutral-100" />
                      <div>
                        <div className="font-bold text-neutral-900">{it.productName}</div>
                        <div className="text-[11px] text-neutral-500 font-mono">
                          Size {it.selectedSize}" | {it.selectedColor} | Qty: {it.quantity}
                        </div>
                      </div>
                    </div>
                    <div className="font-mono font-bold text-neutral-900">
                      {formatPrice(it.price * it.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Breakdown in PKR */}
              <div className="mt-4 pt-3 border-t border-neutral-100 flex justify-end">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-neutral-500">
                    <span>Subtotal:</span>
                    <span className="font-mono">{formatPrice(searchedOrder.subtotal)}</span>
                  </div>
                  {searchedOrder.discount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Promotional Discount:</span>
                      <span className="font-mono">-{formatPrice(searchedOrder.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-neutral-500">
                    <span>Nationwide Delivery:</span>
                    <span className="font-mono">{searchedOrder.shipping === 0 ? 'Free' : formatPrice(searchedOrder.shipping)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-neutral-900 pt-1 border-t border-neutral-200">
                    <span>Grand Total:</span>
                    <span className="font-mono text-[#002814]">{formatPrice(searchedOrder.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct WhatsApp Follow-up */}
            <div className="p-4 bg-[#F8F6F0] rounded flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-neutral-700">
                <span className="font-bold block">Need live courier update or alteration change?</span>
                <span className="text-neutral-500">Our concierge team in Pakistan is standing by on WhatsApp.</span>
              </div>
              <a
                href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                  `Assalam o Alaikum! Following up on Order Ref: #${searchedOrder.orderNumber} for ${searchedOrder.customerName}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-[#002814] hover:bg-[#001A0D] text-white text-xs font-bold uppercase tracking-wider rounded transition-colors flex items-center gap-2 shrink-0 shadow"
              >
                <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Message Concierge on WhatsApp</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
