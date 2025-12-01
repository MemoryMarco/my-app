/**
 * Liuyan Studio Entities: Message, Settings, Auth
 * Also includes original demo entities for template compatibility.
 */
import { IndexedEntity, Entity } from "./core-utils";
import type { User, Chat, ChatMessage, Message, Settings, AuthUser } from "@shared/types";
import { MOCK_CHAT_MESSAGES, MOCK_CHATS, MOCK_USERS, MOCK_MESSAGES } from "@shared/mock-data";
// --- Liuyan Studio Entities ---
export class MessageEntity extends IndexedEntity<Message> {
  static readonly entityName = "message";
  static readonly indexName = "messages";
  static readonly initialState: Message = { id: "", userId: "", phoneMasked: "", text: "", ts: 0 };
  static seedData = MOCK_MESSAGES;
}
export class SettingsEntity extends Entity<Settings> {
  static readonly entityName = "settings";
  static readonly initialState: Settings = {
    id: 'app-settings',
    recipient: "",
    provider: "mock",
    apiUrl: "",
    apiKey: "",
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
}
export class AuthEntity extends Entity<AuthState> {
  static readonly entityName = "auth";
  static readonly initialState: AuthState = { id: 'auth-singleton', otps: {}, sessions: {} };
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