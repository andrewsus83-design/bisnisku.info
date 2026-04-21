import { create } from "zustand";
import type {
  CustomerStage,
  CustomerListQuery,
} from "@/lib/validations/crm";

// ── Types ──

export interface CustomerRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  stage: CustomerStage;
  source: string;
  total_visits: number;
  total_spent: number;
  last_visit_at: string | null;
  first_visit_at: string | null;
  average_spend: number;
  lifetime_points: number;
  birthday: string | null;
  is_active: boolean;
  created_at: string;
  customer_tag_assignments?: Array<{
    tag_id: string;
    customer_tags: {
      id: string;
      name: string;
      color: string;
    };
  }>;
}

export interface TagItem {
  id: string;
  name: string;
  color: string;
  is_auto: boolean;
  auto_rule: string | null;
}

// ── Store state ──

interface CrmState {
  // Customer list
  customers: CustomerRow[];
  totalCustomers: number;
  totalPages: number;
  isLoading: boolean;

  // Filters & pagination
  search: string;
  stageFilter: CustomerStage | null;
  tagFilter: string[]; // tag IDs
  sortBy: CustomerListQuery["sortBy"];
  sortDir: CustomerListQuery["sortDir"];
  page: number;
  perPage: number;

  // Selected customer
  selectedCustomerId: string | null;

  // Tags (cached for the business)
  tags: TagItem[];
  tagsLoaded: boolean;

  // UI state
  isDetailOpen: boolean;
  isAddModalOpen: boolean;
  isImportModalOpen: boolean;

  // Actions
  setCustomers: (
    customers: CustomerRow[],
    total: number,
    totalPages: number
  ) => void;
  setIsLoading: (loading: boolean) => void;
  setSearch: (search: string) => void;
  setStageFilter: (stage: CustomerStage | null) => void;
  toggleTagFilter: (tagId: string) => void;
  setSortBy: (sortBy: CustomerListQuery["sortBy"]) => void;
  toggleSortDir: () => void;
  setPage: (page: number) => void;
  selectCustomer: (id: string | null) => void;
  setTags: (tags: TagItem[]) => void;
  setIsDetailOpen: (open: boolean) => void;
  setIsAddModalOpen: (open: boolean) => void;
  setIsImportModalOpen: (open: boolean) => void;

  // Optimistic updates
  optimisticAddTag: (customerId: string, tag: TagItem) => void;
  optimisticRemoveTag: (customerId: string, tagId: string) => void;
  optimisticUpdateStage: (customerId: string, stage: CustomerStage) => void;
  optimisticRemoveCustomer: (customerId: string) => void;

  // Query builder (returns current filter state)
  getQuery: () => Partial<CustomerListQuery>;

  // Reset
  resetFilters: () => void;
}

export const useCrmStore = create<CrmState>((set, get) => ({
  // Defaults
  customers: [],
  totalCustomers: 0,
  totalPages: 0,
  isLoading: false,

  search: "",
  stageFilter: null,
  tagFilter: [],
  sortBy: "created_at",
  sortDir: "desc",
  page: 1,
  perPage: 25,

  selectedCustomerId: null,

  tags: [],
  tagsLoaded: false,

  isDetailOpen: false,
  isAddModalOpen: false,
  isImportModalOpen: false,

  // Actions
  setCustomers: (customers, total, totalPages) =>
    set({ customers, totalCustomers: total, totalPages }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setSearch: (search) => set({ search, page: 1 }),
  setStageFilter: (stageFilter) => set({ stageFilter, page: 1 }),
  toggleTagFilter: (tagId) =>
    set((state) => ({
      tagFilter: state.tagFilter.includes(tagId)
        ? state.tagFilter.filter((id) => id !== tagId)
        : [...state.tagFilter, tagId],
      page: 1,
    })),
  setSortBy: (sortBy) => {
    const current = get();
    if (current.sortBy === sortBy) {
      // Toggle direction if same column
      set({ sortDir: current.sortDir === "asc" ? "desc" : "asc" });
    } else {
      set({ sortBy, sortDir: "desc" });
    }
  },
  toggleSortDir: () =>
    set((state) => ({
      sortDir: state.sortDir === "asc" ? "desc" : "asc",
    })),
  setPage: (page) => set({ page }),
  selectCustomer: (selectedCustomerId) =>
    set({ selectedCustomerId, isDetailOpen: !!selectedCustomerId }),
  setTags: (tags) => set({ tags, tagsLoaded: true }),
  setIsDetailOpen: (isDetailOpen) =>
    set({
      isDetailOpen,
      selectedCustomerId: isDetailOpen ? get().selectedCustomerId : null,
    }),
  setIsAddModalOpen: (isAddModalOpen) => set({ isAddModalOpen }),
  setIsImportModalOpen: (isImportModalOpen) => set({ isImportModalOpen }),

  // Optimistic updates
  optimisticAddTag: (customerId, tag) =>
    set((state) => ({
      customers: state.customers.map((c) =>
        c.id === customerId
          ? {
              ...c,
              customer_tag_assignments: [
                ...(c.customer_tag_assignments ?? []),
                {
                  tag_id: tag.id,
                  customer_tags: { id: tag.id, name: tag.name, color: tag.color },
                },
              ],
            }
          : c
      ),
    })),

  optimisticRemoveTag: (customerId, tagId) =>
    set((state) => ({
      customers: state.customers.map((c) =>
        c.id === customerId
          ? {
              ...c,
              customer_tag_assignments: (
                c.customer_tag_assignments ?? []
              ).filter((ta) => ta.tag_id !== tagId),
            }
          : c
      ),
    })),

  optimisticUpdateStage: (customerId, stage) =>
    set((state) => ({
      customers: state.customers.map((c) =>
        c.id === customerId ? { ...c, stage } : c
      ),
    })),

  optimisticRemoveCustomer: (customerId) =>
    set((state) => ({
      customers: state.customers.filter((c) => c.id !== customerId),
      totalCustomers: state.totalCustomers - 1,
      selectedCustomerId:
        state.selectedCustomerId === customerId
          ? null
          : state.selectedCustomerId,
    })),

  // Query builder
  getQuery: () => {
    const s = get();
    const query: Partial<CustomerListQuery> = {
      sortBy: s.sortBy,
      sortDir: s.sortDir,
      page: s.page,
      perPage: s.perPage,
    };
    if (s.search) query.search = s.search;
    if (s.stageFilter) query.stage = s.stageFilter;
    if (s.tagFilter.length > 0) query.tagIds = s.tagFilter;
    return query;
  },

  // Reset
  resetFilters: () =>
    set({
      search: "",
      stageFilter: null,
      tagFilter: [],
      sortBy: "created_at",
      sortDir: "desc",
      page: 1,
    }),
}));
