import type { User, Chat, ChatMessage, Message } from './types';
export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'User A' },
  { id: 'u2', name: 'User B' }
];
export const MOCK_CHATS: Chat[] = [
  { id: 'c1', title: 'General' },
];
export const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  { id: 'm1', chatId: 'c1', userId: 'u1', text: 'Hello', ts: Date.now() },
];
export const MOCK_MESSAGES: Message[] = [
  { id: 'msg1', userId: 'demo-user-1', phoneMasked: '138****1234', text: '欢迎来到「留声」。这是一个注重视���与交互体验的留言板。', ts: Date.now() - 86400000 },
  { id: 'msg2', userId: 'demo-user-2', phoneMasked: '159****5678', text: '在这里，���可以自由地记录想法、分享瞬间。希望你喜欢。', ts: Date.now() - 43200000 },
];