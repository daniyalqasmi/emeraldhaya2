import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Product, 
  Category, 
  CartItem, 
  Order, 
  Coupon, 
  StoreSettings, 
  HeroSlide, 
  Review, 
  CurrencyCode, 
  OrderStatus,
  NavMenuItem,
  CurrencyConfig
} from '../types';
import { StorageService } from '../services/storageService';
import { INITIAL_CURRENCY_RATES, INITIAL_NAV_MENU_ITEMS } from '../services/seedData';
import { db } from '../services/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

interface StoreContextType {
  // Navigation & Page State
  activePage: string;
  pageParam: string | null;
  navigateTo: (page: string, param?: string) => void;

  // Products & Categories
  products: Product[];
  categories: Category[];
  addCategory: (category: Omit<Category, 'id' | 'productCount'> & { id?: string; productCount?: number }) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  resetProductsToDefault: () => void;
  quickViewProduct: Product | null;
  setQuickViewProduct: (product: Product | null) => void;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, size: string, color: string, quantity?: number) => void;
  removeFromCart: (productId: string, size: string, color: string) => void;
  updateCartQuantity: (productId: string, size: string, color: string, newQuantity: number) => void;
  clearCart: () => void;
  cartTotalCount: number;
  cartSubtotal: number;
  cartDiscount: number;
  cartShipping: number;
  cartGrandTotal: number;

  // Wishlist
  wishlistIds: string[];
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  moveToCartFromWishlist: (product: Product, size: string, color: string) => void;

  // Coupon
  coupons: Coupon[];
  addCoupon: (coupon: Coupon) => void;
  deleteCoupon: (code: string) => void;
  toggleCouponActive: (code: string, isActive: boolean) => void;
  appliedCoupon: Coupon | null;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;

  // Orders & WhatsApp Checkout
  orders: Order[];
  createWhatsAppOrder: (orderData: {
    customerName: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    orderNotes?: string;
  }) => { order: Order; whatsappUrl: string };
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updateOrderCourier: (orderId: string, courierName: string, trackingNumber: string, estimatedDelivery?: string) => void;
  getOrderById: (orderIdOrNumber: string) => Order | undefined;
  searchOrderAsync: (query: string) => Promise<Order | undefined>;

  // Settings & Configuration
  settings: StoreSettings;
  updateSettings: (newSettings: StoreSettings) => void;
  updateNavMenuItems: (items: NavMenuItem[]) => void;
  toggleComingSoon: (active: boolean) => void;
  updateCurrencyRates: (rates: Record<CurrencyCode, CurrencyConfig>) => void;

  // Hero Slides
  heroSlides: HeroSlide[];
  updateHeroSlides: (slides: HeroSlide[]) => void;

  // Reviews
  reviews: Review[];
  addCustomerReview: (reviewData: Omit<Review, 'id' | 'date' | 'isApproved'>) => void;
  toggleReviewApproval: (reviewId: string, isApproved: boolean) => void;

  // Currency
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  formatPrice: (usdPrice: number) => string;

  // Toasts
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  removeToast: (id: string) => void;

  // Admin Auth
  isAdmin: boolean;
  setAdminStatus: (status: boolean) => void;

  // Filter & Search shortcuts
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategoryFilter: string;
  setSelectedCategoryFilter: (cat: string) => void;

  // Firebase Cloud Synchronization
  syncAllToFirebase: () => Promise<{ success: boolean; message: string }>;
  lastFirebaseSync: string | null;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const CURRENCY_RATES: Record<CurrencyCode, { rate: number; symbol: string; position: 'prefix' | 'suffix' }> = {
  USD: { rate: 1.0, symbol: '$', position: 'prefix' },
  AED: { rate: 3.67, symbol: ' AED', position: 'suffix' },
  SAR: { rate: 3.75, symbol: ' SAR', position: 'suffix' },
  GBP: { rate: 0.79, symbol: '£', position: 'prefix' },
  PKR: { rate: 278.0, symbol: 'Rs. ', position: 'prefix' }
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation
  const [activePage, setActivePage] = useState<string>('home');
  const [pageParam, setPageParam] = useState<string | null>(null);

  // Entities
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(() => {
    const s = StorageService.getSettings();
    return {
      ...s,
      isComingSoonActive: s.isComingSoonActive ?? false, // Default inactive per user request
      currencyRates: s.currencyRates || INITIAL_CURRENCY_RATES,
      navMenuItems: s.navMenuItems || INITIAL_NAV_MENU_ITEMS
    };
  });
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  // Cart & Wishlist
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('emerald_haya_cart_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('emerald_haya_wishlist_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [currency, setCurrency] = useState<CurrencyCode>('PKR');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean>(StorageService.isAdminLoggedIn());

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');

  // Load Initial Entities from StorageService & Sync with Firebase Firestore
  useEffect(() => {
    setProducts(StorageService.getProducts());
    setCategories(StorageService.getCategories());
    setOrders(StorageService.getOrders());
    setCoupons(StorageService.getCoupons());
    setHeroSlides(StorageService.getHeroSlides());
    setReviews(StorageService.getReviews());

    // Background Firestore cloud check
    StorageService.initFirestoreSync().then((cloudData) => {
      if (cloudData.settings) {
        setSettings({
          ...cloudData.settings,
          currency: 'PKR'
        });
      }
      if (cloudData.slides && cloudData.slides.length > 0) setHeroSlides(cloudData.slides);
      if (cloudData.products && cloudData.products.length > 0) setProducts(cloudData.products);
      if (cloudData.categories && cloudData.categories.length > 0) setCategories(cloudData.categories);
    }).catch(() => {});
  }, []);

  // Sync Cart to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('emerald_haya_cart_v1', JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to sync cart:', e);
    }
  }, [cart]);

  // Sync Wishlist to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('emerald_haya_wishlist_v1', JSON.stringify(wishlistIds));
    } catch (e) {
      console.error('Failed to sync wishlist:', e);
    }
  }, [wishlistIds]);

  // Handle URL pathname and hash changes for deep linking (e.g. /admin, #/admin, /shop, etc.)
  useEffect(() => {
    const handleRoute = () => {
      const isExitAdmin = sessionStorage.getItem('emerald_exit_admin_session') === 'true';
      const pathname = window.location.pathname.replace(/^\//, '');
      const hash = window.location.hash.replace(/^#\/?/, '');

      // If user recently exited admin or is returning to storefront, never auto-force admin
      if (isExitAdmin && (pathname === 'admin' || pathname.startsWith('admin/') || hash === 'admin' || hash.startsWith('admin/'))) {
        try {
          window.history.replaceState(null, '', '/');
        } catch {}
        setActivePage('home');
        setPageParam(null);
        return;
      }

      // Check admin path first only if user didn't explicitly exit
      if (pathname === 'admin' || pathname.startsWith('admin/') || hash === 'admin' || hash.startsWith('admin/')) {
        setActivePage('admin');
        const param = pathname.startsWith('admin/') ? pathname.replace('admin/', '') : hash.replace('admin/', '');
        setPageParam(param || null);
        return;
      }

      // Check other routes from hash or pathname
      const route = hash || pathname;
      if (route) {
        const [page, ...rest] = route.split('/');
        setActivePage(page || 'home');
        setPageParam(rest.join('/') || null);
      } else {
        setActivePage('home');
        setPageParam(null);
      }
    };

    handleRoute();
    window.addEventListener('hashchange', handleRoute);
    window.addEventListener('popstate', handleRoute);
    return () => {
      window.removeEventListener('hashchange', handleRoute);
      window.removeEventListener('popstate', handleRoute);
    };
  }, []);

  // Dynamic SEO title & description synchronization per page
  useEffect(() => {
    let title = `${settings.brandName} | Luxury Islamic Abayas, Stoles & Haute Couture`;
    let desc = "Discover Emerald Haya – bespoke Dubai and Saudi abayas, authentic Korean Nida, Medina silk stoles, magnetic hijab pins, and luxury modest couture.";

    if (activePage === 'shop') {
      title = `Haute Couture Boutique (${products.length}+ Pieces) | ${settings.brandName}`;
      desc = "Browse our full modest fashion collection of Dubai abayas, Saudi robes, Medina silk stoles, magnetic hijab pins, and exclusive bundle deals.";
    } else if (activePage === 'coming-soon') {
      title = `Ramadan & Eid 2026 Collection Reveal | VIP Preview · ${settings.brandName}`;
      desc = "Exclusive private preview of the upcoming Imperial Sovereign Abayas, hand-cut Farasha silks, and Austrian crystal accessories.";
    } else if (activePage === 'product' && pageParam) {
      const prod = products.find((p) => p.id === pageParam);
      if (prod) {
        title = `${prod.name} | ${settings.brandName} Dubai`;
        desc = `${prod.name} - ${prod.category} crafted from ${prod.material}. Order direct with WhatsApp Concierge delivery.`;
      }
    } else if (activePage === 'cart') {
      title = `Shopping Bag (${cart.length}) | ${settings.brandName}`;
    } else if (activePage === 'about') {
      title = `Atelier Heritage & Craftsmanship | ${settings.brandName} Dubai`;
    } else if (activePage === 'contact') {
      title = `Client Concierge & Bespoke Salon | ${settings.brandName}`;
    } else if (activePage === 'admin') {
      title = `Atelier Management Console | ${settings.brandName}`;
    }

    document.title = title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', desc);
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', title);
  }, [activePage, pageParam, products, settings.brandName, cart.length]);

  const navigateTo = (page: string, param?: string) => {
    setActivePage(page);
    setPageParam(param || null);

    if (page === 'admin') {
      sessionStorage.removeItem('emerald_exit_admin_session');
      try {
        window.history.pushState(null, '', '/admin');
      } catch {}
    } else {
      // Navigating to storefront pages: mark exit from admin
      sessionStorage.setItem('emerald_exit_admin_session', 'true');
      const cleanPath = page === 'home' ? '/' : `/${page}${param ? `/${param}` : ''}`;
      try {
        if (window.location.hash && page === 'home') {
          window.history.replaceState(null, '', window.location.origin + '/');
        } else {
          window.history.pushState(null, '', cleanPath);
        }
      } catch {
        // Safe fallback in sandboxed iframes
      }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Toast Helpers
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 3800);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Products CRUD
  const addProduct = (productData: Omit<Product, 'id'>) => {
    const newId = `prod-${Date.now()}`;
    const newProduct: Product = { ...productData, id: newId };
    const updated = [newProduct, ...products];
    setProducts(updated);
    StorageService.saveProducts(updated);
    StorageService.saveSingleProductToFirestore(newProduct);
    showToast(`Added "${newProduct.name}" to boutique catalog & saved to Firebase`);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    const updated = products.map((p) => (p.id === id ? { ...p, ...updates } : p));
    setProducts(updated);
    StorageService.saveProducts(updated);
    const updatedProduct = updated.find((p) => p.id === id);
    if (updatedProduct) {
      StorageService.saveSingleProductToFirestore(updatedProduct);
    }
    showToast('Product updated successfully & saved to Firebase');
  };

  const deleteProduct = (id: string) => {
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);
    StorageService.saveProducts(updated);
    StorageService.deleteProductFromFirestore(id);
    showToast('Product removed from catalog & Firebase', 'info');
  };

  const resetProductsToDefault = () => {
    const defaults = StorageService.resetProductsToDefault();
    setProducts(defaults);
    showToast('Catalog restored to original luxury items');
  };

  // Categories CRUD
  const addCategory = (catData: Omit<Category, 'id' | 'productCount'> & { id?: string; productCount?: number }) => {
    const slug = catData.slug || catData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newId = catData.id || `cat-${Date.now()}`;
    const newCategory: Category = {
      id: newId,
      name: catData.name,
      slug,
      description: catData.description || '',
      image: catData.image || '',
      productCount: catData.productCount || 0
    };
    const updated = [newCategory, ...categories];
    setCategories(updated);
    StorageService.saveCategories(updated);
    showToast(`Category "${newCategory.name}" added and synced to Firebase`);
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    const updated = categories.map((c) => (c.id === id ? { ...c, ...updates } : c));
    setCategories(updated);
    StorageService.saveCategories(updated);
    showToast('Category updated successfully & synced to Firebase');
  };

  const deleteCategory = (id: string) => {
    const updated = categories.filter((c) => c.id !== id);
    setCategories(updated);
    StorageService.saveCategories(updated);
    showToast('Category removed from store & Firebase', 'info');
  };

  // Cart Management
  const addToCart = (product: Product, size: string, color: string, quantity: number = 1) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.product.id === product.id && item.selectedSize === size && item.selectedColor === color
      );

      if (existingIndex > -1) {
        const copy = [...prev];
        copy[existingIndex].quantity += quantity;
        return copy;
      } else {
        return [...prev, { product, selectedSize: size, selectedColor: color, quantity }];
      }
    });

    showToast(`Added ${quantity} × ${product.name} (Size ${size}) to Cart`);
  };

  const removeFromCart = (productId: string, size: string, color: string) => {
    setCart((prev) =>
      prev.filter(
        (item) => !(item.product.id === productId && item.selectedSize === size && item.selectedColor === color)
      )
    );
    showToast('Item removed from cart', 'info');
  };

  const updateCartQuantity = (productId: string, size: string, color: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId, size, color);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId && item.selectedSize === size && item.selectedColor === color
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  // Calculations
  const cartTotalCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  const cartDiscount = appliedCoupon
    ? Math.round((cartSubtotal * appliedCoupon.discountPercent) / 100)
    : 0;

  const cartShipping =
    cartSubtotal === 0 || cartSubtotal >= (settings.freeShippingThreshold || 5000)
      ? 0
      : (settings.standardShippingFee !== undefined ? settings.standardShippingFee : 250);

  const cartGrandTotal = Math.max(0, cartSubtotal - cartDiscount + cartShipping);

  // Wishlist
  const toggleWishlist = (productId: string) => {
    if (wishlistIds.includes(productId)) {
      setWishlistIds((prev) => prev.filter((id) => id !== productId));
      showToast('Removed from your Wishlist', 'info');
    } else {
      setWishlistIds((prev) => [...prev, productId]);
      showToast('Added to your Wishlist');
    }
  };

  const isInWishlist = (productId: string) => wishlistIds.includes(productId);

  const moveToCartFromWishlist = (product: Product, size: string, color: string) => {
    addToCart(product, size, color, 1);
    setWishlistIds((prev) => prev.filter((id) => id !== product.id));
  };

  // Coupon System
  const addCoupon = (newCoupon: Coupon) => {
    const cleanCoupon: Coupon = {
      ...newCoupon,
      code: newCoupon.code.trim().toUpperCase(),
      createdAt: new Date().toISOString()
    };
    const updated = [cleanCoupon, ...coupons.filter(c => c.code.toUpperCase() !== cleanCoupon.code)];
    setCoupons(updated);
    StorageService.saveCoupons(updated);
    showToast(`Promotion code "${cleanCoupon.code}" created successfully`);
  };

  const deleteCoupon = (code: string) => {
    const updated = StorageService.deleteCoupon(code);
    setCoupons(updated);
    if (appliedCoupon && appliedCoupon.code.toUpperCase() === code.toUpperCase()) {
      setAppliedCoupon(null);
    }
    showToast(`Promotion code "${code}" deleted`, 'info');
  };

  const toggleCouponActive = (code: string, isActive: boolean) => {
    const updated = StorageService.toggleCouponActive(code, isActive);
    setCoupons(updated);
    if (!isActive && appliedCoupon && appliedCoupon.code.toUpperCase() === code.toUpperCase()) {
      setAppliedCoupon(null);
    }
    showToast(`Promo code "${code}" is now ${isActive ? 'ACTIVE' : 'DEACTIVATED'}`);
  };

  const applyCoupon = (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    const found = coupons.find((c) => c.code.toUpperCase() === cleanCode && c.isActive);

    if (!found) {
      return { success: false, message: 'Invalid or inactive promotional code' };
    }

    if (cartSubtotal < found.minSpend) {
      return {
        success: false,
        message: `Requires minimum spend of ${formatPrice(found.minSpend)}`
      };
    }

    setAppliedCoupon(found);
    showToast(`Code "${found.code}" applied! (${found.discountPercent}% OFF)`);
    return { success: true, message: `Applied ${found.discountPercent}% discount!` };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    showToast('Promotion code removed', 'info');
  };

  // WhatsApp Order Creation
  const createWhatsAppOrder = (customerData: {
    customerName: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    orderNotes?: string;
  }) => {
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const orderNumber = `EH-${randomSuffix}`;
    const orderId = `order-${Date.now()}`;

    const orderItems = cart.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      sku: item.product.sku,
      price: item.product.price,
      selectedSize: item.selectedSize,
      selectedColor: item.selectedColor,
      quantity: item.quantity,
      image: item.product.images[0]
    }));

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      customerName: customerData.customerName,
      phone: customerData.phone,
      email: customerData.email,
      address: customerData.address,
      city: customerData.city,
      postalCode: customerData.postalCode,
      country: customerData.country,
      orderNotes: customerData.orderNotes,
      items: orderItems,
      subtotal: cartSubtotal,
      discount: cartDiscount,
      shipping: cartShipping,
      total: cartGrandTotal,
      status: 'pending',
      createdAt: new Date().toISOString(),
      whatsappMessageSent: true
    };

    // Save order
    StorageService.saveOrder(newOrder);
    setOrders((prev) => [newOrder, ...prev]);

    // Format WhatsApp Message
    const itemsFormatted = orderItems
      .map(
        (it, idx) =>
          `${idx + 1}. *${it.productName}*\n   SKU: ${it.sku}\n   Size: ${it.selectedSize} | Color: ${it.selectedColor}\n   Qty: ${it.quantity} × ${formatPrice(it.price)}`
      )
      .join('\n\n');

    const discountLine = cartDiscount > 0 ? `\n• Discount (${appliedCoupon?.code}): -${formatPrice(cartDiscount)}` : '';
    const shippingLine = cartShipping === 0 ? 'Complimentary VIP Shipping' : formatPrice(cartShipping);

    const rawMessage = `✨ *EMERALD HAYA — LUXURY ORDER* ✨
━━━━━━━━━━━━━━━━━━━━
*Order Ref:* #${orderNumber}
*Date:* ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}

👤 *CUSTOMER DETAILS:*
• Name: ${customerData.customerName}
• Phone: ${customerData.phone}
• Email: ${customerData.email}
• Address: ${customerData.address}, ${customerData.city} ${customerData.postalCode}, ${customerData.country}
${customerData.orderNotes ? `• Notes: ${customerData.orderNotes}\n` : ''}
🛍️ *ORDERED ITEMS:*
${itemsFormatted}

━━━━━━━━━━━━━━━━━━━━
💰 *FINANCIAL SUMMARY:*
• Subtotal: ${formatPrice(cartSubtotal)}${discountLine}
• Delivery: ${shippingLine}
• *Grand Total: ${formatPrice(cartGrandTotal)}*
• Payment: Cash on Delivery / Bank Transfer upon confirmation

Kindly confirm availability and atelier dispatch timeline. Thank you!`;

    // Construct WhatsApp link
    const cleanWhatsappNumber = settings.whatsappNumber.replace(/[^0-9]/g, '');
    const encodedText = encodeURIComponent(rawMessage);
    const whatsappUrl = `https://wa.me/${cleanWhatsappNumber}?text=${encodedText}`;

    // Clear cart after placing order
    clearCart();

    return { order: newOrder, whatsappUrl };
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    const updated = StorageService.updateOrderStatus(orderId, status);
    setOrders(updated);
    showToast(`Order status updated to "${status.toUpperCase()}"`);
  };

  const updateOrderCourier = (
    orderId: string, 
    courierName: string, 
    trackingNumber: string, 
    estimatedDelivery?: string
  ) => {
    const updated = StorageService.updateOrderCourier(orderId, courierName, trackingNumber, estimatedDelivery);
    setOrders(updated);
    showToast(`Courier tracking updated: ${courierName} (${trackingNumber})`);
  };

  const getOrderById = (query: string): Order | undefined => {
    if (!query || typeof query !== 'string') return undefined;
    const trimmed = query.trim();
    if (!trimmed) return undefined;

    const cleanUpper = trimmed.toUpperCase().replace('#', '').replace('EH-', '').replace('EH', '').trim();
    const cleanDigits = trimmed.replace(/[^0-9]/g, '');

    return orders.find((o) => {
      // 1. Direct ID match
      if (o.id.toLowerCase() === trimmed.toLowerCase()) return true;

      // 2. Exact Order number without #
      const ordUpper = o.orderNumber.toUpperCase().replace('#', '').trim();
      if (ordUpper === trimmed.toUpperCase().replace('#', '').trim()) return true;

      // 3. Substring match for order number (e.g. searching '84920' finds 'EH-84920')
      if (cleanUpper && ordUpper.includes(cleanUpper)) return true;

      // 4. Digits match on order number
      const ordDigits = o.orderNumber.replace(/[^0-9]/g, '');
      if (cleanDigits && cleanDigits.length >= 4 && ordDigits === cleanDigits) return true;

      // 5. Courier tracking number match
      if (o.trackingNumber && o.trackingNumber.toUpperCase().replace(/[^A-Z0-9]/g, '').includes(cleanUpper)) return true;

      // 6. Phone number match (comparing normalized digits)
      const phoneDigits = o.phone.replace(/[^0-9]/g, '');
      if (cleanDigits && cleanDigits.length >= 7) {
        if (phoneDigits.endsWith(cleanDigits) || cleanDigits.endsWith(phoneDigits)) return true;
        if (phoneDigits.includes(cleanDigits)) return true;
      }

      // 7. Email match
      if (trimmed.includes('@') && o.email.toLowerCase().trim() === trimmed.toLowerCase()) return true;

      return false;
    });
  };

  const searchOrderAsync = async (query: string): Promise<Order | undefined> => {
    const local = getOrderById(query);
    if (local) return local;

    // Asynchronously search Firestore if not found locally
    try {
      const firestore = db;
      if (!firestore) return undefined;
      const cleanUpper = query.trim().toUpperCase().replace('#', '').trim();
      const cleanDigits = query.replace(/[^0-9]/g, '');

      const snap = await getDocs(collection(firestore, 'orders'));
      if (!snap.empty) {
        for (const docSnap of snap.docs) {
          const ord = docSnap.data() as Order;
          if (!ord) continue;
          const ordUpper = (ord.orderNumber || '').toUpperCase().replace('#', '').trim();
          const ordDigits = (ord.orderNumber || '').replace(/[^0-9]/g, '');
          const phoneDigits = (ord.phone || '').replace(/[^0-9]/g, '');

          const isMatch =
            ord.id === query.trim() ||
            ordUpper === cleanUpper ||
            (cleanUpper && ordUpper.includes(cleanUpper)) ||
            (cleanDigits && cleanDigits.length >= 4 && ordDigits === cleanDigits) ||
            (cleanDigits && cleanDigits.length >= 7 && (phoneDigits.endsWith(cleanDigits) || cleanDigits.endsWith(phoneDigits))) ||
            (query.includes('@') && (ord.email || '').toLowerCase() === query.trim().toLowerCase());

          if (isMatch) {
            setOrders((prev) => {
              if (prev.some((o) => o.id === ord.id)) return prev;
              return [ord, ...prev];
            });
            return ord;
          }
        }
      }
    } catch (e) {
      console.warn('Firestore async order lookup notice:', e);
    }
    return undefined;
  };

  // Nav Menu & Coming Soon & Currency Helpers
  const updateNavMenuItems = (items: NavMenuItem[]) => {
    const updated = {
      ...settings,
      navMenuItems: items
    };
    StorageService.saveSettings(updated);
    setSettings(updated);
    showToast('Navigation menu updated');
  };

  const toggleComingSoon = (active: boolean) => {
    const updated = {
      ...settings,
      isComingSoonActive: active
    };
    StorageService.saveSettings(updated);
    setSettings(updated);
    showToast(`Coming Soon preview is now ${active ? 'ACTIVE' : 'DEACTIVATED'}`);
  };

  const updateCurrencyRates = (rates: Record<CurrencyCode, CurrencyConfig>) => {
    const updated = {
      ...settings,
      currencyRates: rates
    };
    StorageService.saveSettings(updated);
    setSettings(updated);
    showToast('Currency rates updated successfully');
  };

  // Settings
  const updateSettings = (newSettings: StoreSettings) => {
    const safeSettings = {
      ...newSettings,
      currency: 'PKR' as CurrencyCode
    };
    StorageService.saveSettings(safeSettings);
    setSettings(safeSettings);
    showToast('Store settings and WhatsApp configuration updated');
  };

  // Hero Slides
  const updateHeroSlides = (slides: HeroSlide[]) => {
    StorageService.saveHeroSlides(slides);
    setHeroSlides(slides);
    showToast('Hero sliders updated');
  };

  // Reviews
  const addCustomerReview = (reviewData: Omit<Review, 'id' | 'date' | 'isApproved'>) => {
    const newRev: Review = {
      ...reviewData,
      id: `rev-${Date.now()}`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      isApproved: true
    };
    const updated = StorageService.addReview(newRev);
    setReviews(updated);
    showToast('Thank you! Your verified review has been published.');
  };

  const toggleReviewApproval = (reviewId: string, isApproved: boolean) => {
    const updated = reviews.map((r) => (r.id === reviewId ? { ...r, isApproved } : r));
    setReviews(updated);
    StorageService.saveReviews(updated);
    showToast(`Review ${isApproved ? 'Approved' : 'Hidden'}`);
  };

  // Currency Formatter (Strictly Pakistani Rupee - PKR ONLY: Rs. X,XXX)
  const formatPrice = (amount: number): string => {
    const num = Math.round(Number(amount) || 0);
    return `Rs. ${num.toLocaleString()}`;
  };

  // Admin Session
  const setAdminStatus = (status: boolean) => {
    StorageService.setAdminLoggedIn(status);
    setIsAdmin(status);
  };

  // Firebase Manual Sync & Status
  const [lastFirebaseSync, setLastFirebaseSync] = useState<string | null>(StorageService.getLastFirebaseSync());

  const syncAllToFirebase = async () => {
    const res = await StorageService.pushAllToFirestore({
      products,
      settings,
      slides: heroSlides,
      categories
    });
    if (res.success) {
      setLastFirebaseSync(new Date().toISOString());
      showToast('All products and website settings synced to Firebase Firestore!', 'success');
    } else {
      showToast(res.message, 'error');
    }
    return res;
  };

  return (
    <StoreContext.Provider
      value={{
        activePage,
        pageParam,
        navigateTo,
        products,
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        addProduct,
        updateProduct,
        deleteProduct,
        resetProductsToDefault,
        quickViewProduct,
        setQuickViewProduct,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartTotalCount,
        cartSubtotal,
        cartDiscount,
        cartShipping,
        cartGrandTotal,
        wishlistIds,
        toggleWishlist,
        isInWishlist,
        moveToCartFromWishlist,
        coupons,
        addCoupon,
        deleteCoupon,
        toggleCouponActive,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        orders,
        createWhatsAppOrder,
        updateOrderStatus,
        updateOrderCourier,
        getOrderById,
        searchOrderAsync,
        settings,
        updateSettings,
        updateNavMenuItems,
        toggleComingSoon,
        updateCurrencyRates,
        heroSlides,
        updateHeroSlides,
        reviews,
        addCustomerReview,
        toggleReviewApproval,
        currency,
        setCurrency,
        formatPrice,
        toasts,
        showToast,
        removeToast,
        isAdmin,
        setAdminStatus,
        searchQuery,
        setSearchQuery,
        selectedCategoryFilter,
        setSelectedCategoryFilter,
        syncAllToFirebase,
        lastFirebaseSync
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
