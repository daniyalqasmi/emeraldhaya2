export interface Product {
  id: string;
  name: string;
  category: string;
  brand: string;
  sku: string;
  description: string;
  price: number;
  discount?: number | null; // percentage e.g. 15 for 15%
  oldPrice?: number | null;
  stock: number;
  images: string[];
  color: string;
  availableColors: string[];
  size: string[]; // e.g. ['50', '52', '54', '56', '58', '60']
  material: string;
  weight: string;
  reviewsCount: number;
  rating: number;
  gallery: string[];
  tags: string[];
  isFlashSale?: boolean;
  isNewArrival?: boolean;
  isTrending?: boolean;
  isBestSeller?: boolean;
  isFeatured?: boolean;
  isComboDeal?: boolean;
  isStoleOrPin?: boolean;
  bundleItems?: string[];
  relatedProductIds?: string[];
  detailsList?: string[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  productCount: number;
}

export interface CartItem {
  product: Product;
  selectedSize: string;
  selectedColor: string;
  quantity: number;
}

export interface WishlistItem {
  productId: string;
  addedAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  price: number;
  selectedSize: string;
  selectedColor: string;
  quantity: number;
  image: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  orderNotes?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  whatsappMessageSent: boolean;
  courierName?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
}

export interface Coupon {
  code: string;
  discountPercent: number;
  minSpend: number;
  isActive: boolean;
  description: string;
  createdAt?: string;
}

export interface Review {
  id: string;
  productId: string;
  customerName: string;
  customerCity?: string;
  rating: number;
  comment: string;
  date: string;
  isVerified: boolean;
  isApproved: boolean;
}

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  tagline: string;
  ctaText: string;
  categoryFilter?: string;
  image: string;
  isActive: boolean;
}

export interface CurrencyConfig {
  rate: number;
  symbol: string;
  position: 'prefix' | 'suffix';
}

export interface NavMenuItem {
  id: string;
  label: string;
  page: string;
  categoryFilter?: string;
  badge?: string;
  isActive: boolean;
  order: number;
}

export interface StoreSettings {
  brandName: string;
  tagline: string;
  logoUrl?: string;
  whatsappNumber: string; // international format e.g. +92316217618
  storeEmail: string;
  storePhone: string;
  address: string;
  freeShippingThreshold: number;
  standardShippingFee?: number;
  taxPercent?: number;
  currency: 'USD' | 'AED' | 'SAR' | 'GBP' | 'PKR';
  googleFormUrl: string;
  announcementText: string;
  instagramUrl: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  youtubeUrl?: string;
  pinterestUrl?: string;
  imgbbApiKey?: string;
  isComingSoonActive: boolean; // Active or Deactivated toggle
  currencyRates?: Record<CurrencyCode, CurrencyConfig>;
  navMenuItems?: NavMenuItem[];
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: string;
  date: string;
  readTime: string;
  category: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

export type CurrencyCode = 'USD' | 'AED' | 'SAR' | 'GBP' | 'PKR';

export interface AdminUser {
  uid: string;
  name: string;
  email: string;
  role: 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface AdminAuthContextType {
  adminUser: AdminUser | null;
  firebaseUser: any | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  clearError: () => void;
}
