export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
// --- Liuyan Studio Types ---
export interface Message {
  id: string;
  userId: string;
  phoneMasked: string;
  text: string;
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