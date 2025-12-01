/**
 * Liuyan Studio Entities: Message, Settings, Auth, Reply, Like
 * Also includes original demo entities for template compatibility.
 */
import { IndexedEntity, Entity, Env } from "./core-utils";
import type { User, Chat, ChatMessage, Message, Settings, AuthUser, Reply, Like } from "@shared/types";
import { MOCK_CHAT_MESSAGES, MOCK_CHATS, MOCK_USERS, MOCK_MESSAGES, MOCK_REPLIES, MOCK_LIKES } from "@shared/mock-data";
// --- Liuyan Studio Entities ---
export class MessageEntity extends IndexedEntity<Message> {
  static readonly entityName = "message";
  static readonly indexName = "messages";
  static readonly initialState: Message = { id: "", userId: "", phoneMasked: "", text: "", ts: 0, replies: [], likes: 0 };
  static seedData = MOCK_MESSAGES;
}
export class ReplyEntity extends IndexedEntity<Reply> {
  static readonly entityName = "reply";
  static readonly indexName = "replies";
  static readonly initialState: Reply = { id: "", messageId: "", parentId: "", userId: "", phoneMasked: "", text: "", ts: 0, likes: 0, replies: [] };
  static seedData = MOCK_REPLIES;
}
export class LikeEntity extends IndexedEntity<Like> {
  static readonly entityName = "like";
  static readonly indexName = "likes";
  static readonly initialState: Like = { id: "", targetId: "", targetType: "message", userId: "", ts: 0 };
  static seedData = MOCK_LIKES;
  static async findByUserAndTarget(env: Env, userId: string, targetId: string): Promise<Like | null> {
    const { items } = await this.list(env);
    return items.find(like => like.userId === userId && like.targetId === targetId) || null;
  }
}
export class SettingsEntity extends Entity<Settings> {
  static readonly entityName = "settings";
  static readonly initialState: Settings = {
    id: 'app-settings',
    recipient: "",
    provider: "mock",
    apiUrl: "",
    apiKey: "",
    timezone: "UTC",
    lastSentTs: 0,
    sendLogs: [],
  };
}
type OtpStore = { [phone: string]: { code: string; expiresAt: number } };
type SessionStore = { [token: string]: { userId: string; phone: string; ts: number } };
export interface AuthState {
  id: 'auth-singleton';
  otps: OtpStore;
  sessions: SessionStore;
  rateLimits?: { [phone: string]: number }; // timestamp of last request
}
export class AuthEntity extends Entity<AuthState> {
  static readonly entityName = "auth";
  static readonly initialState: AuthState = { id: 'auth-singleton', otps: {}, sessions: {}, rateLimits: {} };
  async saveOtp(phone: string, code: string, expiresAt: number): Promise<void> {
    await this.mutate(s => {
      s.otps[phone] = { code, expiresAt };
      return s;
    });
  }
  async verifyOtp(phone: string, code: string): Promise<boolean> {
    const s = await this.getState();
    const otpData = s.otps[phone];
    if (!otpData || otpData.code !== code || otpData.expiresAt < Date.now()) {
      return false;
    }
    // OTP is valid, clear it
    await this.mutate(s => {
      delete s.otps[phone];
      return s;
    });
    return true;
  }
  async createSession(user: AuthUser): Promise<string> {
    const token = crypto.randomUUID();
    await this.mutate(s => {
      s.sessions[token] = { userId: user.id, phone: user.phone, ts: Date.now() };
      return s;
    });
    return token;
  }
  async verifySession(token: string): Promise<{ userId: string; phone: string } | null> {
    const s = await this.getState();
    return s.sessions[token] ?? null;
  }
  async getRateLimit(phone: string): Promise<number> {
    const s = await this.getState();
    return s.rateLimits?.[phone] ?? 0;
  }
  async updateRateLimit(phone: string, now: number): Promise<void> {
    await this.mutate(s => {
      if (!s.rateLimits) s.rateLimits = {};
      s.rateLimits[phone] = now;
      return s;
    });
  }
}
// --- Original Template Entities ---
// USER ENTITY: one DO instance per user
export class UserEntity extends IndexedEntity<User> {
  static readonly entityName = "user";
  static readonly indexName = "users";
  static readonly initialState: User = { id: "", name: "" };
  static seedData = MOCK_USERS;
}
// CHAT BOARD ENTITY: one DO instance per chat board, stores its own messages
export type ChatBoardState = Chat & { messages: ChatMessage[] };
const SEED_CHAT_BOARDS: ChatBoardState[] = MOCK_CHATS.map(c => ({
  ...c,
  messages: MOCK_CHAT_MESSAGES.filter(m => m.chatId === c.id),
}));
export class ChatBoardEntity extends IndexedEntity<ChatBoardState> {
  static readonly entityName = "chat";
  static readonly indexName = "chats";
  static readonly initialState: ChatBoardState = { id: "", title: "", messages: [] };
  static seedData = SEED_CHAT_BOARDS;
  async listMessages(): Promise<ChatMessage[]> {
    const { messages } = await this.getState();
    return messages;
  }
  async sendMessage(userId: string, text: string): Promise<ChatMessage> {
    const msg: ChatMessage = { id: crypto.randomUUID(), chatId: this.id, userId, text, ts: Date.now() };
    await this.mutate(s => ({ ...s, messages: [...s.messages, msg] }));
    return msg;
  }
}