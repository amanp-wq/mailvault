import { create } from 'zustand';

export type FolderType = 'ALL' | 'INBOX' | 'SENT' | 'DRAFTS' | 'STARRED' | 'IMPORTANT';

interface EmailState {
  // Current view state
  selectedAccountId: string | null;
  selectedFolder: FolderType;
  selectedEmailId: string | null;
  selectedLabelId: string | null;
  selectedTagId: string | null;
  searchQuery: string;
  currentPage: number;

  // UI state
  sidebarOpen: boolean;
  uploadDialogOpen: boolean;
  addLabelDialogOpen: boolean;
  addTagDialogOpen: boolean;
  addAccountDialogOpen: boolean;
  emailDetailOpen: boolean;

  // Actions
  setSelectedAccountId: (id: string | null) => void;
  setSelectedFolder: (folder: FolderType) => void;
  setSelectedEmailId: (id: string | null) => void;
  setSelectedLabelId: (id: string | null) => void;
  setSelectedTagId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setCurrentPage: (page: number) => void;
  setSidebarOpen: (open: boolean) => void;
  setUploadDialogOpen: (open: boolean) => void;
  setAddLabelDialogOpen: (open: boolean) => void;
  setAddTagDialogOpen: (open: boolean) => void;
  setAddAccountDialogOpen: (open: boolean) => void;
  setEmailDetailOpen: (open: boolean) => void;
  resetFilters: () => void;
}

export const useEmailStore = create<EmailState>((set) => ({
  selectedAccountId: null,
  selectedFolder: 'ALL',
  selectedEmailId: null,
  selectedLabelId: null,
  selectedTagId: null,
  searchQuery: '',
  currentPage: 1,
  sidebarOpen: true,
  uploadDialogOpen: false,
  addLabelDialogOpen: false,
  addTagDialogOpen: false,
  addAccountDialogOpen: false,
  emailDetailOpen: false,

  setSelectedAccountId: (id) => set({ selectedAccountId: id, currentPage: 1, selectedEmailId: null }),
  setSelectedFolder: (folder) => set({ selectedFolder: folder, currentPage: 1, selectedEmailId: null }),
  setSelectedEmailId: (id) => set({ selectedEmailId: id }),
  setSelectedLabelId: (id) => set({ selectedLabelId: id, currentPage: 1, selectedEmailId: null }),
  setSelectedTagId: (id) => set({ selectedTagId: id, currentPage: 1, selectedEmailId: null }),
  setSearchQuery: (query) => set({ searchQuery: query, currentPage: 1 }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setUploadDialogOpen: (open) => set({ uploadDialogOpen: open }),
  setAddLabelDialogOpen: (open) => set({ addLabelDialogOpen: open }),
  setAddTagDialogOpen: (open) => set({ addTagDialogOpen: open }),
  setAddAccountDialogOpen: (open) => set({ addAccountDialogOpen: open }),
  setEmailDetailOpen: (open) => set({ emailDetailOpen: open }),
  resetFilters: () =>
    set({
      selectedFolder: 'ALL',
      selectedLabelId: null,
      selectedTagId: null,
      searchQuery: '',
      currentPage: 1,
      selectedEmailId: null,
    }),
}));
