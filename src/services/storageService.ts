import { 
  Product, 
  Category, 
  Order, 
  Coupon, 
  StoreSettings, 
  HeroSlide, 
  Review, 
  ContactMessage 
} from '../types';
import { 
  SEED_PRODUCTS, 
  INITIAL_CATEGORIES, 
  INITIAL_COUPONS, 
  INITIAL_SETTINGS, 
  INITIAL_HERO_SLIDES, 
  INITIAL_REVIEWS 
} from './seedData';
import { db } from './firebaseConfig';
import { 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc,
  collection, 
  getDocs
} from 'firebase/firestore';

const STORAGE_KEYS = {
  PRODUCTS: 'emerald_haya_products_v1',
  CATEGORIES: 'emerald_haya_categories_v1',
  ORDERS: 'emerald_haya_orders_v1',
  COUPONS: 'emerald_haya_coupons_v1',
  SETTINGS: 'emerald_haya_settings_v1',
  HERO_SLIDES: 'emerald_haya_hero_slides_v1',
  REVIEWS: 'emerald_haya_reviews_v1',
  MESSAGES: 'emerald_haya_messages_v1',
  NEWSLETTER: 'emerald_haya_newsletter_v1',
  CART: 'emerald_haya_cart_v1',
  WISHLIST: 'emerald_haya_wishlist_v1',
  ADMIN_AUTH: 'emerald_haya_admin_session_v1',
  LAST_FIREBASE_SYNC: 'emerald_haya_last_firebase_sync'
};

/**
 * Universal Firestore Sanitizer:
 * Recursively strips all `undefined` values from objects and arrays,
 * converting undefined fields to null or removing them to prevent
 * "Function setDoc() called with invalid data. Unsupported field value: undefined" errors.
 */
export function cleanFirestoreData<T>(input: T): T {
  if (input === undefined) {
    return null as any;
  }
  if (input === null || typeof input !== 'object') {
    return input;
  }
  if (Array.isArray(input)) {
    return input
      .filter((item) => item !== undefined)
      .map((item) => cleanFirestoreData(item)) as any;
  }
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(input as Record<string, any>)) {
    if (value !== undefined) {
      result[key] = cleanFirestoreData(value);
    }
  }
  return result as T;
}

export const StorageService = {
  // Products
  getProducts(): Product[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error reading products from storage:', e);
    }
    // Seed initial products
    this.saveProducts(SEED_PRODUCTS);
    return SEED_PRODUCTS;
  },

  saveProducts(products: Product[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
      // Asynchronously sync index to Firebase Firestore
      this.syncProductsToFirestore(products).catch((err) => {
        console.warn('Firestore products sync notice:', err?.message || err);
      });
    } catch (e) {
      console.error('Error saving products:', e);
    }
  },

  async saveSingleProductToFirestore(product: Product): Promise<void> {
    const firestore = db;
    if (!firestore) return;
    try {
      const cleanData = cleanFirestoreData({
        ...product,
        discount: product.discount !== undefined ? product.discount : null,
        oldPrice: product.oldPrice !== undefined ? product.oldPrice : null,
        updatedAt: new Date().toISOString()
      });
      await setDoc(doc(firestore, 'products', product.id), cleanData, { merge: true });
      localStorage.setItem(STORAGE_KEYS.LAST_FIREBASE_SYNC, new Date().toISOString());
    } catch (e: any) {
      console.warn('Firebase Firestore single product sync notice:', e?.message || e);
    }
  },

  async deleteProductFromFirestore(id: string): Promise<void> {
    const firestore = db;
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'products', id));
      localStorage.setItem(STORAGE_KEYS.LAST_FIREBASE_SYNC, new Date().toISOString());
    } catch (e: any) {
      console.warn('Firebase Firestore delete product notice:', e?.message || e);
    }
  },

  async syncProductsToFirestore(products: Product[]): Promise<void> {
    const firestore = db;
    if (!firestore) return;
    try {
      // Save top products and catalog index document (without oversized payload or undefined fields)
      const sanitizedItems = products.slice(0, 100).map((p) =>
        cleanFirestoreData({
          ...p,
          discount: p.discount !== undefined ? p.discount : null,
          oldPrice: p.oldPrice !== undefined ? p.oldPrice : null,
          isFlashSale: Boolean(p.isFlashSale),
          isNewArrival: Boolean(p.isNewArrival),
          // If image is a local data url, keep it, but ensure doc doesn't explode
          images: Array.isArray(p.images) ? p.images.slice(0, 3) : []
        })
      );

      const catalogPayload = cleanFirestoreData({
        updatedAt: new Date().toISOString(),
        count: products.length,
        items: sanitizedItems
      });

      await setDoc(doc(firestore, 'catalog', 'all_products'), catalogPayload, { merge: true });
      localStorage.setItem(STORAGE_KEYS.LAST_FIREBASE_SYNC, new Date().toISOString());
    } catch (e: any) {
      console.warn('Firebase Firestore product sync notice:', e?.message || e);
    }
  },

  resetProductsToDefault(): Product[] {
    this.saveProducts(SEED_PRODUCTS);
    return SEED_PRODUCTS;
  },

  // Categories
  getCategories(): Category[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error reading categories:', e);
    }
    this.saveCategories(INITIAL_CATEGORIES);
    return INITIAL_CATEGORIES;
  },

  saveCategories(categories: Category[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
      const firestore = db;
      if (firestore) {
        const cleanCategories = categories.map((c) =>
          cleanFirestoreData({
            ...c,
            description: c.description || '',
            image: c.image || '',
            productCount: typeof c.productCount === 'number' ? c.productCount : 0
          })
        );

        setDoc(
          doc(firestore, 'content', 'categories'),
          cleanFirestoreData({
            categories: cleanCategories,
            updatedAt: new Date().toISOString()
          }),
          { merge: true }
        ).catch((err) => {
          console.warn('Firestore categories sync notice:', err?.message || err);
        });

        // Also save each individual category for direct document querying
        cleanCategories.forEach((cat) => {
          setDoc(
            doc(firestore, 'categories', cat.id),
            cleanFirestoreData({
              ...cat,
              updatedAt: new Date().toISOString()
            }),
            { merge: true }
          ).catch(() => {});
        });
      }
    } catch (e) {
      console.error('Error saving categories:', e);
    }
  },

  // Orders
  getOrders(): Order[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Error reading orders:', e);
    }
    return [];
  },

  saveOrder(order: Order): void {
    try {
      const current = this.getOrders();
      const updated = [order, ...current];
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));

      // Asynchronously persist to Firebase Firestore
      const firestore = db;
      if (firestore) {
        const cleanOrder = cleanFirestoreData({
          ...order,
          orderNotes: order.orderNotes || '',
          savedAt: new Date().toISOString()
        });
        setDoc(doc(firestore, 'orders', order.id), cleanOrder, { merge: true }).catch((err) => {
          console.warn('Firestore order sync notice:', err?.message || err);
        });
      }
    } catch (e) {
      console.error('Error saving order:', e);
    }
  },

  updateOrderStatus(orderId: string, status: Order['status']): Order[] {
    const orders = this.getOrders();
    const updated = orders.map((ord) => (ord.id === orderId ? { ...ord, status } : ord));
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
      const firestore = db;
      if (firestore) {
        setDoc(
          doc(firestore, 'orders', orderId),
          cleanFirestoreData({ status, updatedAt: new Date().toISOString() }),
          { merge: true }
        ).catch(() => {});
      }
    } catch (e) {
      console.error('Error updating order status:', e);
    }
    return updated;
  },

  // Coupons
  getCoupons(): Coupon[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.COUPONS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Error reading coupons:', e);
    }
    this.saveCoupons(INITIAL_COUPONS);
    return INITIAL_COUPONS;
  },

  saveCoupons(coupons: Coupon[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(coupons));
      const firestore = db;
      if (firestore) {
        setDoc(
          doc(firestore, 'content', 'coupons'),
          cleanFirestoreData({
            coupons,
            updatedAt: new Date().toISOString()
          }),
          { merge: true }
        ).catch(() => {});
      }
    } catch (e) {
      console.error('Error saving coupons:', e);
    }
  },

  // Settings
  getSettings(): StoreSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Error reading settings:', e);
    }
    this.saveSettings(INITIAL_SETTINGS);
    return INITIAL_SETTINGS;
  },

  saveSettings(settings: StoreSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      const firestore = db;
      if (firestore) {
        const payload = cleanFirestoreData({
          ...settings,
          logoUrl: settings.logoUrl || '',
          facebookUrl: settings.facebookUrl || '',
          tiktokUrl: settings.tiktokUrl || '',
          youtubeUrl: settings.youtubeUrl || '',
          pinterestUrl: settings.pinterestUrl || '',
          imgbbApiKey: settings.imgbbApiKey || '',
          updatedAt: new Date().toISOString()
        });
        Promise.all([
          setDoc(doc(firestore, 'settings', 'general'), payload, { merge: true }),
          setDoc(doc(firestore, 'settings', 'store'), payload, { merge: true })
        ]).then(() => {
          localStorage.setItem(STORAGE_KEYS.LAST_FIREBASE_SYNC, new Date().toISOString());
        }).catch((err) => {
          console.warn('Firestore settings sync notice:', err?.message || err);
        });
      }
    } catch (e) {
      console.error('Error saving settings:', e);
    }
  },

  // Hero Slides
  getHeroSlides(): HeroSlide[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.HERO_SLIDES);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Error reading hero slides:', e);
    }
    this.saveHeroSlides(INITIAL_HERO_SLIDES);
    return INITIAL_HERO_SLIDES;
  },

  saveHeroSlides(slides: HeroSlide[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.HERO_SLIDES, JSON.stringify(slides));
      const firestore = db;
      if (firestore) {
        const cleanSlides = slides.map((s) =>
          cleanFirestoreData({
            ...s,
            categoryFilter: s.categoryFilter || '',
            image: s.image || '',
            isActive: Boolean(s.isActive)
          })
        );
        setDoc(
          doc(firestore, 'content', 'heroSlides'),
          cleanFirestoreData({
            slides: cleanSlides,
            updatedAt: new Date().toISOString()
          }),
          { merge: true }
        ).then(() => {
          localStorage.setItem(STORAGE_KEYS.LAST_FIREBASE_SYNC, new Date().toISOString());
        }).catch((err) => {
          console.warn('Firestore hero slides sync notice:', err?.message || err);
        });
      }
    } catch (e) {
      console.error('Error saving hero slides:', e);
    }
  },

  // Reviews
  getReviews(): Review[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.REVIEWS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Error reading reviews:', e);
    }
    this.saveReviews(INITIAL_REVIEWS);
    return INITIAL_REVIEWS;
  },

  saveReviews(reviews: Review[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
      const firestore = db;
      if (firestore) {
        const cleanReviews = reviews.map((r) =>
          cleanFirestoreData({
            ...r,
            customerCity: r.customerCity || '',
            isVerified: Boolean(r.isVerified),
            isApproved: Boolean(r.isApproved)
          })
        );
        setDoc(
          doc(firestore, 'content', 'reviews'),
          cleanFirestoreData({
            reviews: cleanReviews,
            updatedAt: new Date().toISOString()
          }),
          { merge: true }
        ).catch(() => {});
      }
    } catch (e) {
      console.error('Error saving reviews:', e);
    }
  },

  addReview(review: Review): Review[] {
    const reviews = this.getReviews();
    const updated = [review, ...reviews];
    this.saveReviews(updated);
    return updated;
  },

  // Contact messages
  getMessages(): ContactMessage[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Error reading messages:', e);
    }
    return [];
  },

  saveMessage(msg: ContactMessage): void {
    try {
      const msgs = this.getMessages();
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify([msg, ...msgs]));
      const firestore = db;
      if (firestore) {
        const cleanMsg = cleanFirestoreData({
          ...msg,
          phone: msg.phone || '',
          subject: msg.subject || '',
          receivedAt: new Date().toISOString()
        });
        setDoc(doc(firestore, 'messages', msg.id), cleanMsg, { merge: true }).catch(() => {});
      }
    } catch (e) {
      console.error('Error saving message:', e);
    }
  },

  // Newsletter
  subscribeNewsletter(email: string): boolean {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.NEWSLETTER);
      const list: string[] = stored ? JSON.parse(stored) : [];
      if (!list.includes(email)) {
        list.push(email);
        localStorage.setItem(STORAGE_KEYS.NEWSLETTER, JSON.stringify(list));
      }
      const firestore = db;
      if (firestore) {
        const subscriberId = email.replace(/[^a-zA-Z0-9]/g, '_');
        setDoc(
          doc(firestore, 'newsletter_subscribers', subscriberId),
          cleanFirestoreData({
            email,
            subscribedAt: new Date().toISOString()
          }),
          { merge: true }
        ).catch(() => {});
      }
      return true;
    } catch (e) {
      console.error('Error subscribing to newsletter:', e);
      return false;
    }
  },

  getNewsletterSubscribers(): string[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.NEWSLETTER);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  },

  // Full manual or triggered backup to Firebase
  async pushAllToFirestore(payload: {
    products?: Product[];
    settings?: StoreSettings;
    slides?: HeroSlide[];
    categories?: Category[];
  }): Promise<{ success: boolean; message: string }> {
    const firestore = db;
    if (!firestore) {
      return { success: false, message: 'Firebase is not initialized' };
    }
    try {
      const operations: Promise<any>[] = [];

      if (payload.settings) {
        const cleanSet = cleanFirestoreData({
          ...payload.settings,
          logoUrl: payload.settings.logoUrl || '',
          facebookUrl: payload.settings.facebookUrl || '',
          tiktokUrl: payload.settings.tiktokUrl || '',
          youtubeUrl: payload.settings.youtubeUrl || '',
          pinterestUrl: payload.settings.pinterestUrl || '',
          imgbbApiKey: payload.settings.imgbbApiKey || '',
          updatedAt: new Date().toISOString()
        });
        operations.push(setDoc(doc(firestore, 'settings', 'general'), cleanSet, { merge: true }));
        operations.push(setDoc(doc(firestore, 'settings', 'store'), cleanSet, { merge: true }));
      }

      if (payload.slides && payload.slides.length > 0) {
        const cleanSlides = payload.slides.map((s) =>
          cleanFirestoreData({
            ...s,
            categoryFilter: s.categoryFilter || '',
            image: s.image || '',
            isActive: Boolean(s.isActive)
          })
        );
        operations.push(
          setDoc(
            doc(firestore, 'content', 'heroSlides'),
            cleanFirestoreData({
              slides: cleanSlides,
              updatedAt: new Date().toISOString()
            }),
            { merge: true }
          )
        );
      }

      if (payload.products && payload.products.length > 0) {
        // Save catalog index with 100% sanitized items (NO undefined fields)
        const sanitizedItems = payload.products.slice(0, 100).map((p) =>
          cleanFirestoreData({
            ...p,
            discount: p.discount !== undefined ? p.discount : null,
            oldPrice: p.oldPrice !== undefined ? p.oldPrice : null,
            isFlashSale: Boolean(p.isFlashSale),
            isNewArrival: Boolean(p.isNewArrival),
            images: Array.isArray(p.images) ? p.images.slice(0, 3) : []
          })
        );

        operations.push(
          setDoc(
            doc(firestore, 'catalog', 'all_products'),
            cleanFirestoreData({
              updatedAt: new Date().toISOString(),
              count: payload.products.length,
              items: sanitizedItems
            }),
            { merge: true }
          )
        );

        // Save top 30 custom / modified products to individual docs
        payload.products.slice(0, 30).forEach((p) => {
          const cleanProd = cleanFirestoreData({
            ...p,
            discount: p.discount !== undefined ? p.discount : null,
            oldPrice: p.oldPrice !== undefined ? p.oldPrice : null,
            isFlashSale: Boolean(p.isFlashSale),
            isNewArrival: Boolean(p.isNewArrival),
            updatedAt: new Date().toISOString()
          });
          operations.push(setDoc(doc(firestore, 'products', p.id), cleanProd, { merge: true }));
        });
      }

      if (payload.categories && payload.categories.length > 0) {
        const cleanCats = payload.categories.map((c) =>
          cleanFirestoreData({
            ...c,
            description: c.description || '',
            image: c.image || '',
            productCount: typeof c.productCount === 'number' ? c.productCount : 0
          })
        );

        operations.push(
          setDoc(
            doc(firestore, 'content', 'categories'),
            cleanFirestoreData({
              categories: cleanCats,
              updatedAt: new Date().toISOString()
            }),
            { merge: true }
          )
        );

        payload.categories.forEach((cat) => {
          operations.push(
            setDoc(
              doc(firestore, 'categories', cat.id),
              cleanFirestoreData({
                ...cat,
                description: cat.description || '',
                image: cat.image || '',
                productCount: typeof cat.productCount === 'number' ? cat.productCount : 0,
                updatedAt: new Date().toISOString()
              }),
              { merge: true }
            )
          );
        });
      }

      await Promise.all(operations);
      const timestamp = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.LAST_FIREBASE_SYNC, timestamp);
      return { success: true, message: `Successfully synced all boutique data to Firebase Firestore at ${new Date().toLocaleTimeString()}` };
    } catch (e: any) {
      console.error('Firebase full push error:', e);
      return { success: false, message: e?.message || 'Failed to sync with Firebase' };
    }
  },

  // Try fetching any remotely updated Firestore data on initialization
  async initFirestoreSync(): Promise<{
    settings?: StoreSettings;
    slides?: HeroSlide[];
    products?: Product[];
    categories?: Category[];
  }> {
    const firestore = db;
    if (!firestore) return {};
    try {
      const [settingsSnap, storeSettingsSnap, slidesSnap, catalogSnap, categoriesSnap] = await Promise.all([
        getDoc(doc(firestore, 'settings', 'general')).catch(() => null),
        getDoc(doc(firestore, 'settings', 'store')).catch(() => null),
        getDoc(doc(firestore, 'content', 'heroSlides')).catch(() => null),
        getDoc(doc(firestore, 'catalog', 'all_products')).catch(() => null),
        getDoc(doc(firestore, 'content', 'categories')).catch(() => null)
      ]);

      const result: {
        settings?: StoreSettings;
        slides?: HeroSlide[];
        products?: Product[];
        categories?: Category[];
      } = {};

      const activeSettingsSnap = storeSettingsSnap?.exists() ? storeSettingsSnap : settingsSnap;
      if (activeSettingsSnap && activeSettingsSnap.exists()) {
        const remoteSettings = activeSettingsSnap.data() as StoreSettings;
        if (remoteSettings.brandName) {
          result.settings = remoteSettings;
          localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(remoteSettings));
        }
      }

      if (slidesSnap && slidesSnap.exists()) {
        const remoteSlides = slidesSnap.data()?.slides as HeroSlide[];
        if (Array.isArray(remoteSlides) && remoteSlides.length > 0) {
          result.slides = remoteSlides;
          localStorage.setItem(STORAGE_KEYS.HERO_SLIDES, JSON.stringify(remoteSlides));
        }
      }

      // Check remote categories from content/categories or /categories collection
      if (categoriesSnap && categoriesSnap.exists()) {
        const remoteCategories = categoriesSnap.data()?.categories as Category[];
        if (Array.isArray(remoteCategories) && remoteCategories.length > 0) {
          result.categories = remoteCategories;
          localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(remoteCategories));
        }
      } else {
        try {
          const catColSnap = await getDocs(collection(firestore, 'categories'));
          if (!catColSnap.empty) {
            const list: Category[] = [];
            catColSnap.forEach((d) => {
              const data = d.data() as Category;
              if (data && data.name) list.push(data);
            });
            if (list.length > 0) {
              result.categories = list;
              localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(list));
            }
          }
        } catch {}
      }

      // Check if individual products collection has entries
      try {
        const productsColSnap = await getDocs(collection(firestore, 'products'));
        if (!productsColSnap.empty) {
          const remoteColProducts: Product[] = [];
          productsColSnap.forEach((d) => {
            const data = d.data() as Product;
            if (data && data.name && data.price) {
              remoteColProducts.push(data);
            }
          });

          if (remoteColProducts.length > 0) {
            const local = this.getProducts();
            const map = new Map<string, Product>();
            local.forEach((p) => map.set(p.id, p));
            remoteColProducts.forEach((p) => map.set(p.id, p));
            const merged = Array.from(map.values());
            result.products = merged;
            localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(merged));
          }
        } else if (catalogSnap && catalogSnap.exists()) {
          const remoteProducts = catalogSnap.data()?.items as Product[];
          if (Array.isArray(remoteProducts) && remoteProducts.length > 0) {
            result.products = remoteProducts;
            localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(remoteProducts));
          }
        }
      } catch (e) {
        // Fallback to catalog doc
        if (catalogSnap && catalogSnap.exists()) {
          const remoteProducts = catalogSnap.data()?.items as Product[];
          if (Array.isArray(remoteProducts) && remoteProducts.length > 0) {
            result.products = remoteProducts;
            localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(remoteProducts));
          }
        }
      }

      return result;
    } catch (e) {
      console.warn('Firestore initial sync notice:', e);
      return {};
    }
  },

  getLastFirebaseSync(): string | null {
    return localStorage.getItem(STORAGE_KEYS.LAST_FIREBASE_SYNC);
  },

  // Admin Session
  isAdminLoggedIn(): boolean {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true';
  },

  setAdminLoggedIn(value: boolean): void {
    if (value) {
      localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
    }
  }
};
