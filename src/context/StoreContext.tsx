import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  auth,
  BOOTSTRAPPED_ADMIN_EMAIL,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import {
  ActivePageView,
  BespokeStage,
  CartItem,
  CategoryCode,
  CurrencyCode,
  HomeFilterTab,
  MeasurementProfile,
  Order,
  PaymentGateway,
  PaymentPlan,
  Product,
  RtwStage,
  ShippingZone,
  SizeCode,
  StoreSettings,
} from '../types/josy';
import {
  BESPOKE_PIPELINE,
  INITIAL_MEASUREMENT_PROFILES,
  INITIAL_ORDERS,
  INITIAL_PRODUCTS,
  RTW_PIPELINE,
} from '../data/catalog';

const CART_STORAGE_KEY = 'josy_textile_cart_v1';
const CURRENCY_STORAGE_KEY = 'josy_textile_currency_v1';
const CATEGORY_CODES: CategoryCode[] = ['01', '02', '03', '04', '05', '06', '07', '08', '09'];

function timestampToIso(value: unknown): string {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (typeof value === 'string') return value;
  return new Date().toISOString();
}

function clampStr(val: string, max: number): string {
  return val.trim().slice(0, max);
}

function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 80);
  return cleaned.length >= 2 ? cleaned : `id-${Date.now()}`;
}

export interface PlaceOrderInput {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  whatsappOptIn: boolean;
  deliveryAddress: string;
  shippingZone: ShippingZone;
  paymentGateway: PaymentGateway;
  paymentPlan: PaymentPlan;
}

interface StoreContextValue {
  // Navigation & UI overlays
  activePage: ActivePageView;
  setActivePage: (page: ActivePageView) => void;
  activeCategoryFilter: CategoryCode | 'ALL';
  setActiveCategoryFilter: (cat: CategoryCode | 'ALL') => void;
  activeHomeTab: HomeFilterTab;
  setActiveHomeTab: (tab: HomeFilterTab) => void;
  selectedProduct: Product | null;
  setSelectedProduct: (product: Product | null) => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  isSizingPolicyOpen: boolean;
  setIsSizingPolicyOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalMode: 'signup' | 'signin';
  openAuthModal: (mode?: 'signup' | 'signin') => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Auth
  user: User | null;
  authReady: boolean;
  isAdmin: boolean;
  signUpWithEmail: (
    fullName: string,
    email: string,
    password: string
  ) => Promise<{ user: User | null; error?: string }>;
  signInWithEmail: (
    email: string,
    password: string
  ) => Promise<{ user: User | null; error?: string }>;
  signInWithGoogle: () => Promise<User | null>;
  signOutUser: () => Promise<void>;

  // Currency
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;

  // Data
  products: Product[];
  settings: StoreSettings;
  cart: CartItem[];
  wishlistIds: string[];
  measurementProfiles: MeasurementProfile[];
  orders: Order[];
  isSyncingCloud: boolean;

  // Cart Actions
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  updateCartQuantity: (itemId: string, delta: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;

  // Wishlist & Profiles
  toggleWishlist: (productId: string) => Promise<void>;
  saveMeasurementProfile: (
    profile: Omit<MeasurementProfile, 'id' | 'updatedAt'>,
    existingId?: string
  ) => Promise<MeasurementProfile | null>;
  deleteMeasurementProfile: (profileId: string) => Promise<void>;

  // Orders & Checkout
  placeOrder: (input: PlaceOrderInput) => Promise<Order | null>;
  settleBespokeBalance: (orderId: string) => Promise<void>;
  toggleOrderWhatsapp: (orderId: string, optIn: boolean) => Promise<void>;

  // Admin & Tailor Workshop Actions
  advanceOrderStage: (orderId: string, track: 'RTW' | 'BESPOKE') => Promise<void>;
  updateProductStock: (productId: string, size: SizeCode, count: number) => Promise<void>;
  createProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateStoreSettings: (patch: Partial<StoreSettings>) => Promise<void>;
  seedInitialCatalogToCloud: () => Promise<void>;

  // Newsletter & Contact
  subscribeNewsletter: (email: string) => Promise<boolean>;
  submitContactInquiry: (data: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) => Promise<boolean>;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [activePage, setActivePage] = useState<ActivePageView>('home');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<CategoryCode | 'ALL'>('ALL');
  const [activeHomeTab, setActiveHomeTab] = useState<HomeFilterTab>('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSizingPolicyOpen, setIsSizingPolicyOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signup' | 'signin'>('signup');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const openAuthModal = (mode: 'signup' | 'signin' = 'signup') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAdminDoc, setIsAdminDoc] = useState(false);

  // Store Data State
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    try {
      const saved = localStorage.getItem(CURRENCY_STORAGE_KEY) as CurrencyCode | null;
      if (saved && ['NGN', 'USD', 'GBP', 'EUR'].includes(saved)) return saved;
    } catch {
      // ignore
    }
    return 'NGN';
  });

  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [settings, setSettings] = useState<StoreSettings>({
    bespokeCapacityOpen: true,
    splitDepositEnabled: true,
    bespokeLeadWindow: '10–14 business days',
  });
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (raw) return JSON.parse(raw) as CartItem[];
    } catch {
      // ignore
    }
    return [];
  });
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [measurementProfiles, setMeasurementProfiles] = useState<MeasurementProfile[]>(
    INITIAL_MEASUREMENT_PROFILES
  );
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);

  const isAdmin = useMemo(() => {
    if (!user) return false;
    if (user.emailVerified && user.email === BOOTSTRAPPED_ADMIN_EMAIL) return true;
    return isAdminDoc;
  }, [user, isAdminDoc]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3600);
  };

  const setCurrency = (c: CurrencyCode) => {
    setCurrencyState(c);
    try {
      localStorage.setItem(CURRENCY_STORAGE_KEY, c);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  // 1. Auth Listener & User Document Bootstrap
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setIsAdminDoc(false);
      if (firebaseUser) {
        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const snap = await getDoc(userRef);
          if (!snap.exists()) {
            await setDoc(userRef, {
              uid: firebaseUser.uid,
              displayName: clampStr(firebaseUser.displayName || 'Josy Buyer', 120),
              email: clampStr(firebaseUser.email || 'buyer@josytextile.com', 180),
              wishlistIds: [],
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
          // Check optional /admins/{uid} doc
          const adminSnap = await getDoc(doc(db, 'admins', firebaseUser.uid));
          if (adminSnap.exists()) {
            setIsAdminDoc(true);
          }
        } catch (err) {
          console.warn('Profile bootstrap skipped:', err);
        }
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // 2. Public Real-Time Storefront Products & Settings Sync
  useEffect(() => {
    const qProducts = query(
      collection(db, 'products'),
      where('categoryCode', 'in', CATEGORY_CODES)
    );
    const unsubProducts = onSnapshot(
      qProducts,
      (snapshot) => {
        if (!snapshot.empty) {
          const cloudProducts: Product[] = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              sku: String(data.sku || ''),
              name: String(data.name || ''),
              categoryCode: data.categoryCode as CategoryCode,
              categoryName: String(data.categoryName || ''),
              fulfillmentMode: data.fulfillmentMode,
              priceNGN: Number(data.priceNGN || 0),
              bespokeSurchargeNGN: Number(data.bespokeSurchargeNGN || 0),
              image: String(data.image || ''),
              secondaryImage: String(data.secondaryImage || ''),
              description: String(data.description || ''),
              craftDetails: Array.isArray(data.craftDetails) ? data.craftDetails : [],
              swatches: Array.isArray(data.swatches) ? data.swatches : [],
              cutOptions: Array.isArray(data.cutOptions) ? data.cutOptions : [],
              stockBySize: data.stockBySize,
              modelNote: String(data.modelNote || ''),
              isSpotlight: Boolean(data.isSpotlight),
              isNewArrival: Boolean(data.isNewArrival),
              soldOutOverride: Boolean(data.soldOutOverride),
              filterGroups: Array.isArray(data.filterGroups) ? data.filterGroups : ['All'],
            };
          });
          setProducts(cloudProducts);
        }
      },
      (error) => {
        console.warn('Products snapshot fallback to seed catalog:', error.message);
      }
    );

    const unsubSettings = onSnapshot(
      doc(db, 'settings', 'store'),
      (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setSettings({
            bespokeCapacityOpen: Boolean(d.bespokeCapacityOpen),
            splitDepositEnabled: Boolean(d.splitDepositEnabled),
            bespokeLeadWindow: String(d.bespokeLeadWindow || '10–14 business days'),
          });
        }
      },
      (error) => {
        console.warn('Settings snapshot fallback:', error.message);
      }
    );

    return () => {
      unsubProducts();
      unsubSettings();
    };
  }, []);

  // 3. Authenticated Real-Time Listeners (User Wishlist, Measurement Profiles, Orders)
  useEffect(() => {
    if (!authReady || !user) {
      setWishlistIds([]);
      setMeasurementProfiles([]);
      setOrders([]);
      return;
    }

    setIsSyncingCloud(true);

    // User profile wishlist
    const unsubUser = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          if (Array.isArray(d.wishlistIds)) {
            setWishlistIds(d.wishlistIds.map(String));
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      }
    );

    // Private measurement profiles
    const profilesPath = `users/${user.uid}/measurementProfiles`;
    const qProfiles = query(
      collection(db, profilesPath),
      where('ownerId', '==', user.uid)
    );
    const unsubProfiles = onSnapshot(
      qProfiles,
      (snap) => {
        if (snap.empty) {
          setMeasurementProfiles([]);
        } else {
          const list: MeasurementProfile[] = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              name: String(data.name || ''),
              unit: data.unit === 'cm' ? 'cm' : 'in',
              measurements: data.measurements,
              notes: String(data.notes || ''),
              updatedAt: timestampToIso(data.updatedAt).slice(0, 10),
            };
          });
          setMeasurementProfiles(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, profilesPath);
      }
    );

    // Orders listener (Admin sees all orders; customers see their own orders)
    const isBootstrapped =
      Boolean(user.emailVerified) && user.email === BOOTSTRAPPED_ADMIN_EMAIL;
    const ordersQuery = isBootstrapped
      ? query(collection(db, 'orders'))
      : query(collection(db, 'orders'), where('customerUid', '==', user.uid));

    const unsubOrders = onSnapshot(
      ordersQuery,
      (snap) => {
        const cloudOrders: Order[] = snap.docs
          .map((d) => {
            const data = d.data();
            return {
              id: d.id,
              createdAt: timestampToIso(data.createdAt),
              targetCompletionDate: String(data.targetCompletionDate || ''),
              customerName: String(data.customerName || ''),
              customerEmail: String(data.customerEmail || ''),
              customerPhone: String(data.customerPhone || ''),
              whatsappOptIn: Boolean(data.whatsappOptIn),
              deliveryAddress: String(data.deliveryAddress || ''),
              shippingZone: data.shippingZone,
              currency: data.currency as CurrencyCode,
              paymentGateway: data.paymentGateway as PaymentGateway,
              paymentPlan: data.paymentPlan as PaymentPlan,
              rtwItems: Array.isArray(data.rtwItems) ? data.rtwItems : [],
              bespokeItems: Array.isArray(data.bespokeItems) ? data.bespokeItems : [],
              subtotalNGN: Number(data.subtotalNGN || 0),
              shippingNGN: Number(data.shippingNGN || 0),
              totalNGN: Number(data.totalNGN || 0),
              amountPaidNGN: Number(data.amountPaidNGN || 0),
              balanceDueNGN: Number(data.balanceDueNGN || 0),
              balanceSettled: Boolean(data.balanceSettled),
              rtwStage: data.rtwStage && data.rtwStage !== 'NONE' ? (data.rtwStage as RtwStage) : undefined,
              rtwTrackingCode: data.rtwTrackingCode ? String(data.rtwTrackingCode) : undefined,
              bespokeStage:
                data.bespokeStage && data.bespokeStage !== 'NONE'
                  ? (data.bespokeStage as BespokeStage)
                  : undefined,
              bespokeTrackingCode: data.bespokeTrackingCode
                ? String(data.bespokeTrackingCode)
                : undefined,
              notifications: Array.isArray(data.notifications) ? data.notifications : [],
            };
          })
          .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

        setOrders(cloudOrders);
        setIsSyncingCloud(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'orders');
      }
    );

    return () => {
      unsubUser();
      unsubProfiles();
      unsubOrders();
    };
  }, [authReady, user]);

  // Auth Actions
  const formatFirebaseAuthError = (err: unknown): string => {
    const code = (err as { code?: string })?.code || '';
    if (code === 'auth/email-already-in-use') {
      return 'An account with this email already exists. Switch to Buyer Sign In.';
    }
    if (code === 'auth/invalid-email') {
      return 'Please enter a valid email address.';
    }
    if (code === 'auth/weak-password') {
      return 'Password is too weak. Use at least 6 characters.';
    }
    if (
      code === 'auth/invalid-credential' ||
      code === 'auth/wrong-password' ||
      code === 'auth/user-not-found'
    ) {
      return 'Invalid email or password. Please check your credentials and retry.';
    }
    if (code === 'auth/operation-not-allowed') {
      return 'Email & Password sign-in is not yet enabled in Firebase Console (Authentication → Sign-in method → Email/Password).';
    }
    if (code === 'auth/too-many-requests') {
      return 'Too many attempts. Please wait a moment and try again.';
    }
    return 'Authentication could not be completed. Please try again.';
  };

  const signUpWithEmail = async (
    fullName: string,
    email: string,
    password: string
  ): Promise<{ user: User | null; error?: string }> => {
    try {
      const cleanName = clampStr(fullName, 120) || 'Josy Buyer';
      const cleanEmail = clampStr(email, 180);
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      await updateProfile(cred.user, { displayName: cleanName });

      // Bootstrap initial buyer document (create-only)
      try {
        await setDoc(doc(db, 'users', cred.user.uid), {
          uid: cred.user.uid,
          displayName: cleanName,
          email: cleanEmail,
          wishlistIds: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (docErr) {
        console.warn('Initial buyer profile bootstrap note:', docErr);
      }

      showToast(`Buyer account created for ${cleanName}`);
      return { user: cred.user };
    } catch (err) {
      return { user: null, error: formatFirebaseAuthError(err) };
    }
  };

  const signInWithEmail = async (
    email: string,
    password: string
  ): Promise<{ user: User | null; error?: string }> => {
    try {
      const cred = await signInWithEmailAndPassword(auth, clampStr(email, 180), password);
      showToast(`Signed in as ${cred.user.displayName || cred.user.email}`);
      return { user: cred.user };
    } catch (err) {
      return { user: null, error: formatFirebaseAuthError(err) };
    }
  };

  const signInWithGoogle = async (): Promise<User | null> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      showToast(`Signed in as ${result.user.displayName || result.user.email}`);
      return result.user;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign-in cancelled';
      if (!msg.includes('popup-closed-by-user')) {
        showToast('Unable to complete Google sign-in. Please allow popups and retry.');
      }
      return null;
    }
  };

  const signOutUser = async () => {
    await signOut(auth);
    showToast('Signed out of Josy Textile');
  };

  // Cart Actions
  const addToCart = (item: Omit<CartItem, 'id'>) => {
    setCart((prev) => {
      if (item.selectedMode === 'RTW') {
        const idx = prev.findIndex(
          (i) =>
            i.productId === item.productId &&
            i.selectedMode === 'RTW' &&
            i.size === item.size &&
            i.swatch.id === item.swatch.id &&
            i.cutOption === item.cutOption
        );
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + item.quantity };
          return updated;
        }
      }
      return [...prev, { ...item, id: `ci-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }];
    });
    setIsCartOpen(true);
    showToast(
      item.selectedMode === 'BESPOKE'
        ? `Added Custom-Tailored ${item.name} to Bag`
        : `Added ${item.name} (${item.size}) to Bag`
    );
  };

  const updateCartQuantity = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === itemId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  };

  const clearCart = () => setCart([]);

  // Wishlist (Local session curation for buyers; cloud update strictly admin-only)
  const toggleWishlist = async (productId: string) => {
    const next = wishlistIds.includes(productId)
      ? wishlistIds.filter((id) => id !== productId)
      : [...wishlistIds, productId].slice(0, 50);

    setWishlistIds(next);

    if (user && isAdmin) {
      const path = `users/${user.uid}`;
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          wishlistIds: next,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    }
    showToast(
      next.includes(productId) ? 'Saved piece to your Wishlist' : 'Removed piece from Wishlist'
    );
  };

  // Measurement Profiles (Buyers can create new profiles; only Studio Admins can edit or delete)
  const saveMeasurementProfile = async (
    profile: Omit<MeasurementProfile, 'id' | 'updatedAt'>,
    existingId?: string
  ): Promise<MeasurementProfile | null> => {
    if (!user) {
      openAuthModal('signup');
      showToast('Create a buyer account or sign in to save your measurements.');
      return null;
    }

    if (existingId && !isAdmin) {
      showToast('Editing saved records is restricted to Studio Administrators.');
      return null;
    }

    const profileId = sanitizeId(existingId || `prof-${Date.now()}`);
    const cleanName = clampStr(profile.name || 'Custom Fit Profile', 80);
    const cleanNotes = clampStr(profile.notes || '', 500);
    const path = `users/${user.uid}/measurementProfiles/${profileId}`;

    // Ensure parent user document exists for Master Gate
    try {
      const parentRef = doc(db, 'users', user.uid);
      const parentSnap = await getDoc(parentRef);
      if (!parentSnap.exists()) {
        await setDoc(parentRef, {
          uid: user.uid,
          displayName: clampStr(user.displayName || 'Josy Buyer', 120),
          email: clampStr(user.email || 'buyer@josytextile.com', 180),
          wishlistIds: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      const ref = doc(db, `users/${user.uid}/measurementProfiles`, profileId);
      const existingSnap = await getDoc(ref);

      if (existingSnap.exists()) {
        if (!isAdmin) {
          showToast('Editing saved records is restricted to Studio Administrators.');
          return null;
        }
        await updateDoc(ref, {
          name: cleanName,
          unit: profile.unit,
          measurements: profile.measurements,
          notes: cleanNotes,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(ref, {
          id: profileId,
          ownerId: user.uid,
          name: cleanName,
          unit: profile.unit,
          measurements: profile.measurements,
          notes: cleanNotes,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      const saved: MeasurementProfile = {
        id: profileId,
        name: cleanName,
        unit: profile.unit,
        measurements: profile.measurements,
        notes: cleanNotes,
        updatedAt: new Date().toISOString().slice(0, 10),
      };
      showToast(`Saved measurement profile "${cleanName}"`);
      return saved;
    } catch (err) {
      handleFirestoreError(err, existingId ? OperationType.UPDATE : OperationType.CREATE, path);
    }
  };

  const deleteMeasurementProfile = async (profileId: string) => {
    if (!user || !isAdmin) {
      showToast('Deleting records is restricted to Studio Administrators.');
      return;
    }
    const path = `users/${user.uid}/measurementProfiles/${profileId}`;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/measurementProfiles`, profileId));
      showToast('Deleted measurement profile');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  // Place Order (Buyers can create new orders)
  const placeOrder = async (input: PlaceOrderInput): Promise<Order | null> => {
    if (!user) {
      openAuthModal('signup');
      showToast('Please create a buyer account or sign in to place your order.');
      return null;
    }
    const activeUser = user;

    const rtwItems = cart.filter((i) => i.selectedMode === 'RTW');
    const bespokeItems = cart.filter((i) => i.selectedMode === 'BESPOKE');
    if (rtwItems.length + bespokeItems.length === 0) return null;

    const rtwSubtotal = rtwItems.reduce((sum, i) => sum + i.unitPriceNGN * i.quantity, 0);
    const bespokeSubtotal = bespokeItems.reduce((sum, i) => sum + i.unitPriceNGN * i.quantity, 0);
    const subtotalNGN = Math.round(rtwSubtotal + bespokeSubtotal);
    const shippingNGN = Math.round(input.shippingZone.rateNGN);
    const totalNGN = subtotalNGN + shippingNGN;

    const useSplit =
      input.paymentPlan === 'SPLIT_DEPOSIT_60_40' &&
      bespokeItems.length > 0 &&
      settings.splitDepositEnabled;

    const bespokeDeposit = useSplit ? Math.round(bespokeSubtotal * 0.6) : bespokeSubtotal;
    const amountPaidNGN = rtwSubtotal + bespokeDeposit + shippingNGN;
    const balanceDueNGN = totalNGN - amountPaidNGN;
    const balanceSettled = balanceDueNGN === 0;

    const orderId = `JT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + (bespokeItems.length > 0 ? 12 : 3));
    const targetCompletionDate = targetDate.toISOString().slice(0, 10);
    const nowDisplay = new Date().toISOString().replace('T', ' ').slice(0, 16);

    const initialNotifications: Order['notifications'] = [
      {
        timestamp: nowDisplay,
        stage: bespokeItems.length > 0 ? 'Measurements Confirmed' : 'Order Confirmed',
        channel: input.whatsappOptIn ? 'Email & WhatsApp' : 'Email',
        message: useSplit
          ? `Order ${orderId} confirmed via ${input.paymentGateway}. 60% luxury production deposit received; 40% balance due upon Quality Control.`
          : `Order ${orderId} confirmed in full via ${input.paymentGateway}.`,
      },
    ];

    // Strip any oversized base64 reference images (> 180KB) defensively to keep Firestore docs sleek
    const cleanBespokeItems = bespokeItems.map((item) => {
      if (
        item.bespokeSpec?.referencePhotoDataUrl &&
        item.bespokeSpec.referencePhotoDataUrl.length > 180000
      ) {
        return {
          ...item,
          bespokeSpec: {
            ...item.bespokeSpec,
            referencePhotoDataUrl: undefined,
          },
        };
      }
      return item;
    });

    const docPayload = {
      id: orderId,
      customerUid: activeUser.uid,
      customerName: clampStr(input.customerName, 120),
      customerEmail: clampStr(input.customerEmail, 180),
      customerPhone: clampStr(input.customerPhone, 40),
      whatsappOptIn: Boolean(input.whatsappOptIn),
      deliveryAddress: clampStr(input.deliveryAddress, 300),
      shippingZone: input.shippingZone,
      currency,
      paymentGateway: clampStr(input.paymentGateway, 80),
      paymentPlan: useSplit ? 'SPLIT_DEPOSIT_60_40' : 'FULL_UPFRONT',
      rtwItems,
      bespokeItems: cleanBespokeItems,
      subtotalNGN,
      shippingNGN,
      totalNGN,
      amountPaidNGN,
      balanceDueNGN,
      balanceSettled,
      rtwStage: rtwItems.length > 0 ? 'Order Confirmed' : 'NONE',
      rtwTrackingCode: '',
      bespokeStage: bespokeItems.length > 0 ? 'Measurements Confirmed' : 'NONE',
      bespokeTrackingCode: '',
      targetCompletionDate,
      notifications: initialNotifications,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const path = `orders/${orderId}`;
    try {
      await setDoc(doc(db, 'orders', orderId), docPayload);

      // Decrement RTW stock locally (and in Firestore if current user is admin)
      if (rtwItems.length > 0) {
        setProducts((prev) =>
          prev.map((prod) => {
            const matched = rtwItems.filter((i) => i.productId === prod.id && i.size);
            if (matched.length === 0) return prod;
            const nextStock = { ...prod.stockBySize };
            matched.forEach((m) => {
              if (m.size) {
                nextStock[m.size] = Math.max(0, (nextStock[m.size] || 0) - m.quantity);
              }
            });
            return { ...prod, stockBySize: nextStock };
          })
        );
      }

      clearCart();
      setIsCartOpen(false);
      setActivePage('account');
      showToast(`Order ${orderId} confirmed — live production tracker ready`);

      return {
        ...docPayload,
        createdAt: new Date().toISOString(),
        rtwStage: rtwItems.length > 0 ? 'Order Confirmed' : undefined,
        bespokeStage: bespokeItems.length > 0 ? 'Measurements Confirmed' : undefined,
      } as Order;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  // Settle Remaining 40% Balance (Admin-confirmed record update only)
  const settleBespokeBalance = async (orderId: string) => {
    if (!isAdmin) {
      showToast('Order payment updates are confirmed by Studio Administrators. Contact 07032802844 or josephwingie@gmail.com.');
      return;
    }
    const target = orders.find((o) => o.id === orderId);
    if (!target || target.balanceSettled) return;

    const nowDisplay = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const updatedNotifs = [
      ...target.notifications,
      {
        timestamp: nowDisplay,
        stage: 'Balance Settled (40%)',
        channel: target.whatsappOptIn ? ('Email & WhatsApp' as const) : ('Email' as const),
        message: 'Remaining 40% luxury balance settled upon Quality Control. Cleared for dispatch.',
      },
    ].slice(-30);

    const path = `orders/${orderId}`;
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        balanceSettled: true,
        balanceDueNGN: 0,
        amountPaidNGN: target.totalNGN,
        notifications: updatedNotifs,
        updatedAt: serverTimestamp(),
      });
      showToast(`40% Balance settled for ${orderId} — cleared for dispatch`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const toggleOrderWhatsapp = async (orderId: string, optIn: boolean) => {
    if (!isAdmin) {
      showToast('Editing existing order records is restricted to Studio Administrators.');
      return;
    }
    const path = `orders/${orderId}`;
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        whatsappOptIn: optIn,
        updatedAt: serverTimestamp(),
      });
      showToast(optIn ? 'WhatsApp milestone alerts enabled' : 'WhatsApp alerts paused');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  // Admin: Advance RTW or Luxury Pipeline
  const advanceOrderStage = async (orderId: string, track: 'RTW' | 'BESPOKE') => {
    if (!isAdmin) {
      showToast('Only Studio Administrators can update production stages.');
      return;
    }
    const target = orders.find((o) => o.id === orderId);
    if (!target) return;

    const nowDisplay = new Date().toISOString().replace('T', ' ').slice(0, 16);
    let nextRtw = target.rtwStage;
    let nextBespoke = target.bespokeStage;
    let nextRtwCode = target.rtwTrackingCode || '';
    let nextBespokeCode = target.bespokeTrackingCode || '';
    let stageLabel = '';
    let msg = '';

    if (track === 'RTW' && target.rtwStage) {
      const idx = RTW_PIPELINE.indexOf(target.rtwStage);
      if (idx < 0 || idx >= RTW_PIPELINE.length - 1) return;
      nextRtw = RTW_PIPELINE[idx + 1];
      stageLabel = nextRtw || '';
      if (nextRtw === 'Dispatched' && !nextRtwCode) {
        nextRtwCode = `JT-TRK-${Math.floor(100000 + Math.random() * 900000)}`;
      }
      msg =
        nextRtw === 'Dispatched'
          ? `RTW package dispatched via ${target.shippingZone.carrier} (Tracking: ${nextRtwCode}).`
          : `RTW fulfillment status advanced to ${nextRtw}.`;
    } else if (track === 'BESPOKE' && target.bespokeStage) {
      const idx = BESPOKE_PIPELINE.indexOf(target.bespokeStage);
      if (idx < 0 || idx >= BESPOKE_PIPELINE.length - 1) return;
      nextBespoke = BESPOKE_PIPELINE[idx + 1];
      stageLabel = nextBespoke || '';
      if (nextBespoke === 'Dispatched' && !nextBespokeCode) {
        nextBespokeCode = `JT-BSP-${Math.floor(100000 + Math.random() * 900000)}`;
      }
      msg =
        nextBespoke === 'Finishing & Quality Check' && !target.balanceSettled
          ? 'Garment passed Isoko Road studio QC. Automated 40% balance payment link sent to customer.'
          : nextBespoke === 'Dispatched'
            ? `Custom garment dispatched via ${target.shippingZone.carrier} (Tracking: ${nextBespokeCode}).`
            : `Isoko Road atelier updated luxury tailoring status to ${nextBespoke}.`;
    } else {
      return;
    }

    const updatedNotifs = [
      ...target.notifications,
      {
        timestamp: nowDisplay,
        stage: stageLabel,
        channel: target.whatsappOptIn ? ('Email & WhatsApp' as const) : ('Email' as const),
        message: msg,
      },
    ].slice(-30);

    const path = `orders/${orderId}`;
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        rtwStage: nextRtw || 'NONE',
        bespokeStage: nextBespoke || 'NONE',
        rtwTrackingCode: nextRtwCode,
        bespokeTrackingCode: nextBespokeCode,
        notifications: updatedNotifs,
        updatedAt: serverTimestamp(),
      });
      showToast(`Order ${orderId} advanced to "${stageLabel}"`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  // Admin: Seed Initial Catalog to Firestore
  const seedInitialCatalogToCloud = async () => {
    if (!isAdmin) {
      showToast('Sign in with the studio admin account to sync catalog to Firestore.');
      return;
    }
    try {
      for (const prod of INITIAL_PRODUCTS) {
        const ref = doc(db, 'products', prod.id);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          await setDoc(ref, {
            ...prod,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      }
      await setDoc(doc(db, 'settings', 'store'), {
        ...settings,
        updatedAt: serverTimestamp(),
      });
      showToast('Josy Textile catalog & studio settings synced to Firestore');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'products');
    }
  };

  // Admin: Update Stock
  const updateProductStock = async (productId: string, size: SizeCode, count: number) => {
    if (!isAdmin) {
      showToast('Only Studio Administrators can edit inventory.');
      return;
    }
    const safeCount = Math.max(0, Math.min(10000, Math.floor(count)));
    const target = products.find((p) => p.id === productId);
    if (!target) return;

    const updatedStock = { ...target.stockBySize, [size]: safeCount };
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stockBySize: updatedStock } : p))
    );

    const path = `products/${productId}`;
    try {
      const ref = doc(db, 'products', productId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        await updateDoc(ref, {
          stockBySize: updatedStock,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(ref, {
          ...target,
          stockBySize: updatedStock,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  // Admin: Create Product
  const createProduct = async (product: Omit<Product, 'id'>) => {
    if (!isAdmin) {
      showToast('Only Studio Administrators can publish catalog items.');
      return;
    }
    const newId = sanitizeId(`jt-${product.categoryCode}-${Date.now().toString().slice(-5)}`);
    const fullProduct: Product = { ...product, id: newId };
    setProducts((prev) => [fullProduct, ...prev]);

    const path = `products/${newId}`;
    try {
      await setDoc(doc(db, 'products', newId), {
        ...fullProduct,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      showToast(`Published "${fullProduct.name}" to Firestore catalog`);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  // Admin: Update Store Settings
  const updateStoreSettings = async (patch: Partial<StoreSettings>) => {
    if (!isAdmin) {
      showToast('Only Studio Administrators can edit store settings.');
      return;
    }
    const next = { ...settings, ...patch };
    setSettings(next);

    const path = 'settings/store';
    try {
      await setDoc(doc(db, 'settings', 'store'), {
        ...next,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
    showToast('Atelier capacity & payment rules updated');
  };

  // Newsletter Subscription
  const subscribeNewsletter = async (email: string): Promise<boolean> => {
    const cleanEmail = clampStr(email, 180);
    if (!cleanEmail || !cleanEmail.includes('@')) return false;

    if (user) {
      const subId = sanitizeId(`sub-${user.uid}-${Date.now().toString().slice(-5)}`);
      const path = `newsletterSubscribers/${subId}`;
      try {
        await setDoc(doc(db, 'newsletterSubscribers', subId), {
          uid: user.uid,
          email: cleanEmail,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    }
    showToast('Subscribed to Josy Textile Private Drop Alerts');
    return true;
  };

  // Contact Inquiry / Studio Request (Buyers can create requests)
  const submitContactInquiry = async (data: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }): Promise<boolean> => {
    if (!user) {
      openAuthModal('signup');
      showToast('Please create a buyer account or sign in to submit a studio request.');
      return false;
    }

    const inqId = sanitizeId(`inq-${user.uid}-${Date.now().toString().slice(-5)}`);
    const path = `contactInquiries/${inqId}`;
    try {
      await setDoc(doc(db, 'contactInquiries', inqId), {
        uid: user.uid,
        name: clampStr(data.name, 120),
        email: clampStr(data.email, 180),
        subject: clampStr(data.subject, 160),
        message: clampStr(data.message, 2000),
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
    showToast('Request delivered to our Isoko Road, Ughelli studio');
    return true;
  };

  return (
    <StoreContext.Provider
      value={{
        activePage,
        setActivePage,
        activeCategoryFilter,
        setActiveCategoryFilter,
        activeHomeTab,
        setActiveHomeTab,
        selectedProduct,
        setSelectedProduct,
        isCartOpen,
        setIsCartOpen,
        isSearchOpen,
        setIsSearchOpen,
        isSizingPolicyOpen,
        setIsSizingPolicyOpen,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalMode,
        openAuthModal,
        toastMessage,
        showToast,
        user,
        authReady,
        isAdmin,
        signUpWithEmail,
        signInWithEmail,
        signInWithGoogle,
        signOutUser,
        currency,
        setCurrency,
        products,
        settings,
        cart,
        wishlistIds,
        measurementProfiles,
        orders,
        isSyncingCloud,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        toggleWishlist,
        saveMeasurementProfile,
        deleteMeasurementProfile,
        placeOrder,
        settleBespokeBalance,
        toggleOrderWhatsapp,
        advanceOrderStage,
        updateProductStock,
        createProduct,
        updateStoreSettings,
        seedInitialCatalogToCloud,
        subscribeNewsletter,
        submitContactInquiry,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStore must be used within StoreProvider');
  }
  return ctx;
}
