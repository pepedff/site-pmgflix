'use client';

import { create } from 'zustand';
import { AIProvider, Chat, ChatMessage, User } from '@/types';
import { aiProviders, mockChats, mockUser } from '@/data';

interface AppState {
  // User
  user: User;
  
  // Theme
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  
  // Sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  
  // AI Providers
  providers: AIProvider[];
  toggleFavorite: (id: string) => void;
  
  // Chat
  chats: Chat[];
  activeChat: Chat | null;
  setActiveChat: (chat: Chat | null) => void;
  addChat: (chat: Chat) => void;
  addMessage: (chatId: string, message: ChatMessage) => void;
  
  // Search
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  
  // Compare
  selectedForCompare: AIProvider[];
  toggleCompareSelection: (provider: AIProvider) => void;
  clearCompareSelection: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // User
  user: mockUser,
  
  // Theme
  theme: 'dark',
  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === 'dark' ? 'light' : 'dark';
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
      }
      return { theme: newTheme };
    }),
  
  // Sidebar
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  // AI Providers
  providers: aiProviders,
  toggleFavorite: (id) =>
    set((state) => ({
      providers: state.providers.map((p) =>
        p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
      ),
    })),
  
  // Chat
  chats: mockChats,
  activeChat: null,
  setActiveChat: (chat) => set({ activeChat: chat }),
  addChat: (chat) =>
    set((state) => ({ chats: [chat, ...state.chats] })),
  addMessage: (chatId, message) =>
    set((state) => ({
      chats: state.chats.map((c) =>
        c.id === chatId
          ? { ...c, messages: [...c.messages, message], updatedAt: new Date() }
          : c
      ),
    })),
  
  // Search
  searchOpen: false,
  setSearchOpen: (open) => set({ searchOpen: open }),
  
  // Compare
  selectedForCompare: [],
  toggleCompareSelection: (provider) =>
    set((state) => {
      const exists = state.selectedForCompare.find((p) => p.id === provider.id);
      if (exists) {
        return {
          selectedForCompare: state.selectedForCompare.filter(
            (p) => p.id !== provider.id
          ),
        };
      }
      if (state.selectedForCompare.length >= 4) return state;
      return {
        selectedForCompare: [...state.selectedForCompare, provider],
      };
    }),
  clearCompareSelection: () => set({ selectedForCompare: [] }),
}));
