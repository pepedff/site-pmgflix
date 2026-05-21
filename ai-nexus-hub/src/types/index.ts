// ============================================
// AI Nexus Hub — Type Definitions
// ============================================

export type AICategory = 'text' | 'image' | 'audio' | 'video' | 'code' | 'search' | 'music' | 'multimodal';

export interface AIProvider {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: AICategory[];
  brandColor: string;
  status: 'online' | 'offline' | 'maintenance';
  isFavorite?: boolean;
  popularity: number;
  tags: string[];
  capabilities: string[];
  model?: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tokensUsed?: number;
  isStreaming?: boolean;
}

export interface Chat {
  id: string;
  title: string;
  aiProvider: AIProvider;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  isPinned?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  plan: 'free' | 'pro' | 'team';
  createdAt: Date;
  stats: UserStats;
}

export interface UserStats {
  totalChats: number;
  totalMessages: number;
  favoriteAIs: number;
  tokensUsed: number;
  timeSaved: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  yearlyPrice: number;
  description: string;
  features: string[];
  limits: {
    messagesPerDay: number;
    aiModels: number;
    fileUpload: boolean;
    comparison: boolean;
    workspace: boolean;
    teamMembers?: number;
  };
  isPopular?: boolean;
}

export interface Comparison {
  id: string;
  prompt: string;
  results: ComparisonResult[];
  createdAt: Date;
}

export interface ComparisonResult {
  aiProvider: AIProvider;
  response: string;
  responseTime: number;
  tokensUsed: number;
  rating?: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: Date;
}
