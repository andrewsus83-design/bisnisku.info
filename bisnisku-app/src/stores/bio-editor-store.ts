import { create } from "zustand";
import type { BlockType, ThemeInput } from "@/lib/validations/bio-page";

// ── Block data shape ──
export interface EditorBlock {
  id: string;
  type: BlockType;
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
  isVisible: boolean;
}

// ── Editor state ──
interface BioEditorState {
  // Page data
  pageId: string | null;
  theme: ThemeInput;
  status: "draft" | "published" | "archived";
  seoTitle: string;
  seoDescription: string;

  // Blocks
  blocks: EditorBlock[];
  selectedBlockId: string | null;

  // UI state
  isDirty: boolean;
  isSaving: boolean;
  previewMode: "desktop" | "mobile";

  // Actions — page
  setPageData: (data: {
    pageId: string;
    theme: ThemeInput;
    status: "draft" | "published" | "archived";
    seoTitle: string;
    seoDescription: string;
  }) => void;
  setTheme: (theme: Partial<ThemeInput>) => void;
  setSeoTitle: (title: string) => void;
  setSeoDescription: (desc: string) => void;

  // Actions — blocks
  setBlocks: (blocks: EditorBlock[]) => void;
  addBlock: (type: BlockType, afterIndex?: number) => void;
  removeBlock: (id: string) => void;
  moveBlock: (fromIndex: number, toIndex: number) => void;
  updateBlockContent: (id: string, content: Record<string, unknown>) => void;
  updateBlockSettings: (id: string, settings: Record<string, unknown>) => void;
  toggleBlockVisibility: (id: string) => void;
  selectBlock: (id: string | null) => void;

  // Actions — UI
  setIsSaving: (saving: boolean) => void;
  setPreviewMode: (mode: "desktop" | "mobile") => void;
  markClean: () => void;
}

const generateId = () => crypto.randomUUID();

export const useBioEditorStore = create<BioEditorState>((set) => ({
  // Initial state
  pageId: null,
  theme: {
    primaryColor: "#0F172A",
    accentColor: "#FFCC00",
    primaryFont: "Plus Jakarta Sans",
    secondaryFont: "Inter",
    buttonStyle: "rounded",
    darkMode: false,
    backgroundTheme: "none",
    backgroundTexture: "none",
  },
  status: "draft",
  seoTitle: "",
  seoDescription: "",
  blocks: [],
  selectedBlockId: null,
  isDirty: false,
  isSaving: false,
  previewMode: "desktop",

  // Page actions
  setPageData: (data) =>
    set({
      pageId: data.pageId,
      theme: data.theme,
      status: data.status,
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,
      isDirty: false,
    }),

  setTheme: (partial) =>
    set((state) => ({
      theme: { ...state.theme, ...partial },
      isDirty: true,
    })),

  setSeoTitle: (title) => set({ seoTitle: title, isDirty: true }),
  setSeoDescription: (desc) => set({ seoDescription: desc, isDirty: true }),

  // Block actions
  setBlocks: (blocks) => set({ blocks }),

  addBlock: (type, afterIndex) =>
    set((state) => {
      const newBlock: EditorBlock = {
        id: generateId(),
        type,
        content: {},
        settings: {},
        isVisible: true,
      };
      const blocks = [...state.blocks];
      const insertAt =
        afterIndex !== undefined ? afterIndex + 1 : blocks.length;
      blocks.splice(insertAt, 0, newBlock);
      return { blocks, isDirty: true, selectedBlockId: newBlock.id };
    }),

  removeBlock: (id) =>
    set((state) => ({
      blocks: state.blocks.filter((b) => b.id !== id),
      selectedBlockId:
        state.selectedBlockId === id ? null : state.selectedBlockId,
      isDirty: true,
    })),

  moveBlock: (fromIndex, toIndex) =>
    set((state) => {
      const blocks = [...state.blocks];
      const [moved] = blocks.splice(fromIndex, 1);
      blocks.splice(toIndex, 0, moved);
      return { blocks, isDirty: true };
    }),

  updateBlockContent: (id, content) =>
    set((state) => ({
      blocks: state.blocks.map((b) =>
        b.id === id ? { ...b, content: { ...b.content, ...content } } : b
      ),
      isDirty: true,
    })),

  updateBlockSettings: (id, settings) =>
    set((state) => ({
      blocks: state.blocks.map((b) =>
        b.id === id ? { ...b, settings: { ...b.settings, ...settings } } : b
      ),
      isDirty: true,
    })),

  toggleBlockVisibility: (id) =>
    set((state) => ({
      blocks: state.blocks.map((b) =>
        b.id === id ? { ...b, isVisible: !b.isVisible } : b
      ),
      isDirty: true,
    })),

  selectBlock: (id) => set({ selectedBlockId: id }),

  // UI actions
  setIsSaving: (saving) => set({ isSaving: saving }),
  setPreviewMode: (mode) => set({ previewMode: mode }),
  markClean: () => set({ isDirty: false }),
}));
