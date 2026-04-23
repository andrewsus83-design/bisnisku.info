import { create } from "zustand";
import type {
  ProductType,
  ProductStatus,
  DiscountType,
  Product,
  VoucherCode,
  VoucherRedemption,
  ProductStats,
  ProductWithDetails,
} from "@/lib/validations/product";

// ── Tab types ──

export type ProductTab = "voucher" | "special" | "digital" | "redeem";

export const productTabLabels: Record<ProductTab, string> = {
  voucher: "Voucher",
  special: "Produk Spesial",
  digital: "Produk Digital",
  redeem: "Redeem Voucher",
};

// ── Form state types ──

export interface SharedProductFields {
  name: string;
  description: string;
  price: number;
  compare_price: number | null;
  image_url: string | null;
  tags: string[];
}

export interface VoucherForm {
  discount_type: DiscountType;
  discount_value: number;
  min_spend: number;
  max_discount: number | null;
  valid_from: string;
  valid_until: string | null;
  max_uses: number | null;
  max_uses_per_customer: number;
  buy_quantity: number;
  get_quantity: number;
  bundle_items: Array<{ product_name: string; quantity: number }>;
  auto_send_wa: boolean;
  wa_message: string | null;
  quantity: number;
}

export interface SpecialForm {
  track_stock: boolean;
  total_stock: number;
  low_stock_alert: number;
  allow_preorder: boolean;
  lead_time_days: number;
  fulfillment_type: "pickup" | "delivery" | "both";
  weight_grams: number | null;
  variants: Array<{
    name: string;
    sku: string;
    price: number | null;
    stock: number;
    option_type: string;
    option_value: string;
    image_url: string | null;
  }>;
}

export interface DigitalForm {
  delivery_method: "auto" | "manual";
  auto_send_wa: boolean;
  max_downloads: number;
  access_days: number;
  requires_email: boolean;
}

// ── Store state ──

interface ProductState {
  // Active tab
  activeTab: ProductTab;
  setActiveTab: (tab: ProductTab) => void;

  // Product list
  products: Product[];
  setProducts: (p: Product[]) => void;
  totalProducts: number;
  setTotalProducts: (n: number) => void;

  // Filters
  search: string;
  setSearch: (s: string) => void;
  typeFilter: ProductType | "";
  setTypeFilter: (t: ProductType | "") => void;
  statusFilter: ProductStatus | "";
  setStatusFilter: (s: ProductStatus | "") => void;

  // Pagination
  page: number;
  setPage: (p: number) => void;
  limit: number;
  setLimit: (l: number) => void;

  // Stats
  stats: ProductStats;
  setStats: (s: ProductStats) => void;

  // Selected product (detail view)
  selectedProduct: ProductWithDetails | null;
  setSelectedProduct: (p: ProductWithDetails | null) => void;

  // Voucher codes (for selected voucher)
  voucherCodes: VoucherCode[];
  setVoucherCodes: (c: VoucherCode[]) => void;

  // Redemption history
  redemptions: VoucherRedemption[];
  setRedemptions: (r: VoucherRedemption[]) => void;

  // Shared product fields (create forms)
  sharedFields: SharedProductFields;
  setSharedFields: (f: Partial<SharedProductFields>) => void;
  resetSharedFields: () => void;

  // Voucher form
  voucherForm: VoucherForm;
  setVoucherForm: (f: Partial<VoucherForm>) => void;
  resetVoucherForm: () => void;

  // Special product form
  specialForm: SpecialForm;
  setSpecialForm: (f: Partial<SpecialForm>) => void;
  resetSpecialForm: () => void;

  // Digital product form
  digitalForm: DigitalForm;
  setDigitalForm: (f: Partial<DigitalForm>) => void;
  resetDigitalForm: () => void;

  // Loading states
  isLoading: boolean;
  setIsLoading: (l: boolean) => void;
  isCreating: boolean;
  setIsCreating: (c: boolean) => void;
}

// ── Default form values ──

const defaultSharedFields: SharedProductFields = {
  name: "",
  description: "",
  price: 0,
  compare_price: null,
  image_url: null,
  tags: [],
};

const defaultVoucherForm: VoucherForm = {
  discount_type: "percentage",
  discount_value: 0,
  min_spend: 0,
  max_discount: null,
  valid_from: "",
  valid_until: null,
  max_uses: null,
  max_uses_per_customer: 1,
  buy_quantity: 1,
  get_quantity: 1,
  bundle_items: [],
  auto_send_wa: false,
  wa_message: null,
  quantity: 100,
};

const defaultSpecialForm: SpecialForm = {
  track_stock: true,
  total_stock: 0,
  low_stock_alert: 5,
  allow_preorder: false,
  lead_time_days: 0,
  fulfillment_type: "pickup",
  weight_grams: null,
  variants: [],
};

const defaultDigitalForm: DigitalForm = {
  delivery_method: "auto",
  auto_send_wa: true,
  max_downloads: 5,
  access_days: 30,
  requires_email: false,
};

const defaultStats: ProductStats = {
  totalProducts: 0,
  activeProducts: 0,
  totalVouchers: 0,
  activeVouchers: 0,
  totalRedemptions: 0,
  totalRevenue: 0,
  totalSpecial: 0,
  totalDigital: 0,
};

// ── Store ──

export const useProductStore = create<ProductState>((set) => ({
  // Active tab
  activeTab: "voucher",
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Product list
  products: [],
  setProducts: (p) => set({ products: p }),
  totalProducts: 0,
  setTotalProducts: (n) => set({ totalProducts: n }),

  // Filters
  search: "",
  setSearch: (s) => set({ search: s }),
  typeFilter: "",
  setTypeFilter: (t) => set({ typeFilter: t }),
  statusFilter: "",
  setStatusFilter: (s) => set({ statusFilter: s }),

  // Pagination
  page: 1,
  setPage: (p) => set({ page: p }),
  limit: 20,
  setLimit: (l) => set({ limit: l }),

  // Stats
  stats: { ...defaultStats },
  setStats: (s) => set({ stats: s }),

  // Selected product
  selectedProduct: null,
  setSelectedProduct: (p) => set({ selectedProduct: p }),

  // Voucher codes
  voucherCodes: [],
  setVoucherCodes: (c) => set({ voucherCodes: c }),

  // Redemption history
  redemptions: [],
  setRedemptions: (r) => set({ redemptions: r }),

  // Shared product fields
  sharedFields: { ...defaultSharedFields },
  setSharedFields: (f) =>
    set((state) => ({ sharedFields: { ...state.sharedFields, ...f } })),
  resetSharedFields: () => set({ sharedFields: { ...defaultSharedFields } }),

  // Voucher form
  voucherForm: { ...defaultVoucherForm },
  setVoucherForm: (f) =>
    set((state) => ({ voucherForm: { ...state.voucherForm, ...f } })),
  resetVoucherForm: () => set({ voucherForm: { ...defaultVoucherForm } }),

  // Special product form
  specialForm: { ...defaultSpecialForm },
  setSpecialForm: (f) =>
    set((state) => ({ specialForm: { ...state.specialForm, ...f } })),
  resetSpecialForm: () => set({ specialForm: { ...defaultSpecialForm } }),

  // Digital product form
  digitalForm: { ...defaultDigitalForm },
  setDigitalForm: (f) =>
    set((state) => ({ digitalForm: { ...state.digitalForm, ...f } })),
  resetDigitalForm: () => set({ digitalForm: { ...defaultDigitalForm } }),

  // Loading states
  isLoading: true,
  setIsLoading: (l) => set({ isLoading: l }),
  isCreating: false,
  setIsCreating: (c) => set({ isCreating: c }),
}));
