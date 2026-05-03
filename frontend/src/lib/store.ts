import { create } from "zustand";

export type PageId =
  | "dashboard"
  | "apis"
  | "api-keys"
  | "analytics"
  | "billing"
  | "settings"
  | "overview"
  | "my-api-keys"
  | "usage-history"
  | "all-users"
  | "all-apis"
  | "system-stats";

interface AppState {
  currentPage: PageId;
  sidebarCollapsed: boolean;
  commandOpen: boolean;
  setCurrentPage: (page: PageId) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCommandOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: "dashboard",
  sidebarCollapsed: false,
  commandOpen: false,
  setCurrentPage: (page) => set({ currentPage: page }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setCommandOpen: (open) => set({ commandOpen: open }),
}));
