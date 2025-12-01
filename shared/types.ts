export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
// --- Liuyan Studio Types ---
export interface Reply {
  id: string;
  messageId: string; // Root message ID
  parentId: string; // Immediate parent (message or another reply)
  userId: string;
  phoneMasked: string;
  text: string;
  ts: number;
  likes: number;
  likedByUser?: boolean;
  replies: Reply[];
}
export interface Message {
  id: string;
  userId: string;
  phoneMasked: string;
  text: string;
  ts: number;
  replies: Reply[];
  likes: number;
  likedByUser?: boolean;
}
export interface Like {
  id: string;
  targetId: string; // message.id or reply.id
  targetType: 'message' | 'reply';
  userId: string;
  ts: number;
}
export interface Settings {
  id: 'app-settings';
  recipient: string;
  provider: 'mock' | 'http';
  apiUrl: string;
  apiKey: string; // Note: In production, this should be a secret, not stored directly
  timezone?: string;
  lastSentTs: number;
  sendLogs: SendLog[];
}
export interface SendLog {
  ts: number;
  messageCount: number;
  replyCount?: number;
  likeCount?: number;
  status: 'success' | 'failure';
  responseSnippet: string;
}
export interface AuthUser {
  id: string;
  phone: string;
}
// --- Original Template Types (can be removed if not used) ---
export interface User {
  id: string;
  name: string;
}
export interface Chat {
  id: string;
  title: string;
}
export interface ChatMessage {
  id: string;
  chatId: string;
  userId: string;
  text: string;
  ts: number; // epoch millis
}