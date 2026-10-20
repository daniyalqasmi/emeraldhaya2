import React, { useState, useMemo } from 'react';
import { 
  Phone, 
  ShieldCheck, 
  Truck, 
  ArrowLeft, 
  Sparkles, 
  MapPin, 
  User, 
  Mail, 
  Lock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { validatePakistaniPhoneNumber } from '../utils/pakistanValidation';

export const CheckoutPage: React.FC = () => {
  const { 
    cart, 
    cartSubtotal, 
    cartDiscount, 
    cartShipping, 
    cartGrandTotal, 
    appliedCoupon, 
    createWhatsAppOrder, 
    navigateTo, 
    formatPrice, 
    showToast,
    settings 
  } = useStore();

  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    email: '',
    address: '',
    city: 'Karachi',
    postalCode: '',
    country: 'Pakistan',
    orderNotes: ''
  });

  const [touchedPhone, setTouchedPhone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live Pakistani phone validation
  const phoneValidation = useMemo(() => {
    if (!formData.phone.trim()) {
      return { isValid: false, error: 'Phone number darj karna zaroori hai', formatted: '', normalized: '' };
    }
    return validatePakistaniPhoneNumber(formData.phone);
  }, [formData.phone]);

  if (cart.length === 0) {
    return (
      <div className="w-full bg-[#FDFBF7] py-20 text-center">
        <h2 className="font-serif text-2xl font-bold">Your Bag is Empty</h2>
        <button
          onClick={() => navigateTo('shop')}
          className="mt-4 px-6 py-2.5 bg-[#002814] text-white text-xs uppercase font-semibold rounded"
        >
          Return to Shop
        </button>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      setTouchedPhone(true);
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setTouchedPhone(true);

    if (!formData.customerName.trim()) {
      showToast('Barahe karam apna pura naam darj karein', 'error');
      return;
    }

    // Strict Pakistani Phone Number Validation
    const validation = validatePakistaniPhoneNumber(formData.phone);
    if (!validation.isValid) {
      showToast(validation.error || 'Barahe karam sahi Pakistani mobile number darj karein (e.g. 03001234567)', 'error');
      return;
    }

    if (!formData.address.trim()) {
      showToast('Barahe karam delivery ka mukammal pata darj karein', 'error');
      return;
    }

    if (!formData.city.trim()) {
      showToast('Barahe karam apna shehar muntakhab karein', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // Use cleanly normalized 11-digit Pakistani phone number
      const orderPayload = {
        ...formData,
        phone: validation.formatted
      };

      const { order, whatsappUrl } = createWhatsAppOrder(orderPayload);

      showToast(`Order #${order.orderNumber} initiated! Opening WhatsApp...`, 'success');

      // Open WhatsApp in new window/tab
      window.open(whatsappUrl, '_blank');

      // Navigate to order-success page
      navigateTo('order-success', order.id);
    } catch (err) {
      console.error(err);
      showToast('Encountered an issue placing your order. Please retry.', 'error');
      setIsSubmitting(false);
    }
  };

  const pakistanCities = [
    'Karachi',
    'Lahore',
    'Islamabad',
    'Rawalpindi',
    'Faisalabad',
    'Multan',
    'Peshawar',
    'Quetta',
    'Sialkot',
    'Gujranwala',
    'Hyderabad',
    'Abbottabad',
    'Bahawalpur',
    'Sargodha',
    'Sukkur',
    'Mirpur (AJK)',
    'Other Pakistan City'
  ];

  return (
    <div className="w-full bg-[#FDFBF7] py-10 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation back */}
        <div className="mb-8">
          <button
            onClick={() => navigateTo('cart')}
            className="flex items-center gap-1 text-xs uppercase tracking-wider text-[#002814] hover:underline font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Shopping Bag</span>
          </button>
          <div className="mt-2 flex items-center justify-between">
            <h1 className="font-serif text-3xl sm:text-4xl font-light text-[#111111]">
              Atelier Checkout & Dispatch
            </h1>
            <span className="text-xs text-[#002814] font-semibold tracking-wider uppercase hidden sm:block bg-emerald-50 px-3 py-1 rounded border border-[#002814]/20">
              🇵🇰 Cash on Delivery & WhatsApp Confirmation
            </span>
          </div>
        </div>

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Customer & Shipping Details (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-[#002814]/15 rounded-sm p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-2 pb-4 border-b border-neutral-100 mb-6">
                <User className="w-4 h-4 text-[#002814]" />
                <h2 className="font-serif text-xl font-bold text-neutral-900">
                  1. Recipient Information
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-700 block mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    placeholder="e.g. Fatima Zahra / Ayesha Malik"
                    required
                    className="w-full text-xs p-3 bg-[#FDFBF7] border border-neutral-300 rounded focus:outline-none focus:border-[#002814]"
                  />
                </div>

                {/* STRICT PAKISTANI PHONE NUMBER INPUT */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-neutral-700 block">
                      Pakistani WhatsApp Mobile *
                    </label>
                    {touchedPhone && (
                      <span className={`text-[10px] font-bold flex items-center gap-1 ${phoneValidation.isValid ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {phoneValidation.isValid ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Valid Number</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3 text-rose-500" />
                            <span>Invalid Format</span>
                          </>
                        )}
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="0300 1234567"
                      required
                      className={`w-full text-xs p-3 bg-[#FDFBF7] border rounded focus:outline-none font-mono ${
                        touchedPhone
                          ? phoneValidation.isValid
                            ? 'border-emerald-500 focus:border-emerald-600'
                            : 'border-rose-400 focus:border-rose-500 bg-rose-50/20'
                          : 'border-neutral-300 focus:border-[#002814]'
                      }`}
                    />
                    <div className="absolute right-3 top-3 text-[11px] font-mono font-bold text-neutral-400">
                      PK (+92)
                    </div>
                  </div>

                  {touchedPhone && !phoneValidation.isValid ? (
                    <span className="text-[11px] text-rose-600 mt-1 block font-medium">
                      ⚠️ {phoneValidation.error || 'Barahe karam sahi 11-digit Pakistani mobile number darj karein (e.g. 03001234567). Faltu number qubool nahi hoga.'}
                    </span>
                  ) : (
                    <span className="text-[10px] text-neutral-400 mt-1 block">
                      Darust 11-digit number darj karein (Jazz 030X, Zong 031X, Warid 032X, Ufone 033X, Telenor 034X).
                    </span>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-700 block mb-1">
                    Email Address (Optional / Recommended)
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="e.g. ayesha.malik@gmail.com"
                    className="w-full text-xs p-3 bg-[#FDFBF7] border border-neutral-300 rounded focus:outline-none focus:border-[#002814]"
                  />
                  <span className="text-[10px] text-neutral-400 mt-1 block">
                    Used to send automated dispatch confirmation and courier tracking link.
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white border border-[#002814]/15 rounded-sm p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-2 pb-4 border-b border-neutral-100 mb-6">
                <MapPin className="w-4 h-4 text-[#002814]" />
                <h2 className="font-serif text-xl font-bold text-neutral-900">
                  2. Courier Destination (Pakistan)
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-700 block mb-1">
                    Complete Street Address *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="House / Flat #, Street, Block / Sector, Area"
                    required
                    className="w-full text-xs p-3 bg-[#FDFBF7] border border-neutral-300 rounded focus:outline-none focus:border-[#002814]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-neutral-700 block mb-1">
                      City *
                    </label>
                    <select
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full text-xs p-3 bg-[#FDFBF7] border border-neutral-300 rounded focus:outline-none focus:border-[#002814] font-medium"
                    >
                      {pakistanCities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-neutral-700 block mb-1">
                      Postal Code (Optional)
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      placeholder="e.g. 75600"
                      className="w-full text-xs p-3 bg-[#FDFBF7] border border-neutral-300 rounded focus:outline-none focus:border-[#002814] font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-neutral-700 block mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      name="country"
                      value="Pakistan"
                      readOnly
                      disabled
                      className="w-full text-xs p-3 bg-neutral-100 border border-neutral-300 rounded font-bold text-neutral-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-700 block mb-1">
                    Special Tailoring Instructions / Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    name="orderNotes"
                    value={formData.orderNotes}
                    onChange={handleInputChange}
                    placeholder="Specify custom abaya length (52, 54, 56, 58, 60), gift packaging, or delivery timing..."
                    className="w-full text-xs p-3 bg-[#FDFBF7] border border-neutral-300 rounded focus:outline-none focus:border-[#002814]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Place Order (5 Cols) */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-[#D4AF37]/40 rounded-sm p-6 sm:p-8 shadow-lg sticky top-28 space-y-6">
              <h3 className="font-serif text-xl font-bold text-neutral-900 pb-3 border-b border-neutral-100">
                Atelier Order Summary
              </h3>

              {/* Items preview list */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div
                    key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}`}
                    className="flex items-center gap-3 py-2 border-b border-neutral-100 last:border-b-0"
                  >
                    <img
                      src={item.product.images[0]}
                      alt=""
                      className="w-12 h-14 object-cover rounded bg-neutral-100"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-neutral-900 truncate">
                        {item.product.name}
                      </div>
                      <div className="text-[11px] text-neutral-500 font-mono">
                        {item.quantity} × {formatPrice(item.product.price)} (Size {item.selectedSize}")
                      </div>
                    </div>
                    <div className="text-xs font-bold font-mono text-neutral-900">
                      {formatPrice(item.product.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Calculation in PKR */}
              <div className="space-y-2 text-xs text-neutral-600 border-t border-neutral-100 pt-4">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono text-neutral-900 font-bold">{formatPrice(cartSubtotal)}</span>
                </div>
                {cartDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Discount ({appliedCoupon?.code}):</span>
                    <span className="font-mono">-{formatPrice(cartDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Nationwide Express Courier:</span>
                  <span className="font-mono text-neutral-900 font-bold">
                    {cartShipping === 0 ? 'Complimentary (Free)' : formatPrice(cartShipping)}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t border-neutral-200 text-sm font-bold text-neutral-900">
                  <span>Grand Total:</span>
                  <span className="font-mono text-xl text-[#002814]">{formatPrice(cartGrandTotal)}</span>
                </div>
              </div>

              {/* Payment & WhatsApp Notice */}
              <div className="p-3 bg-[#FDFBF7] border border-[#002814]/20 rounded text-xs text-neutral-600 space-y-1">
                <div className="flex items-center gap-1.5 text-[#002814] font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Cash on Delivery / Direct WhatsApp Order</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Click <strong>Place Order via WhatsApp</strong> to generate your itemized invoice. Our team in Pakistan will instantly confirm measurements and hand off to TCS / Trax express courier.
                </p>
              </div>

              {/* Main Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-[#002814] hover:bg-[#001A0D] text-white text-xs font-bold uppercase tracking-[0.16em] rounded-sm transition-colors flex items-center justify-center gap-2 shadow-xl border border-[#D4AF37] cursor-pointer"
              >
                <Phone className="w-4 h-4 text-[#D4AF37]" />
                <span>{isSubmitting ? 'Generating Order...' : 'Place Order via WhatsApp Concierge'}</span>
              </button>

              <div className="text-center text-[10px] text-neutral-400">
                Official WhatsApp: <span className="font-mono text-neutral-700">{settings.whatsappNumber.startsWith('+') ? settings.whatsappNumber : `+${settings.whatsappNumber}`}</span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
