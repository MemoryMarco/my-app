import type { User, Chat, ChatMessage, Message, Reply, Like } from './types';
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
  { id: 'msg1', userId: 'demo-user-1', phoneMasked: '138****1234', text: '欢迎���到「留声」。这是一个注重视觉与交互体验���留言板。', ts: Date.now() - 86400000, replies: [], likes: 1 },
  { id: 'msg2', userId: 'demo-user-2', phoneMasked: '159****5678', text: '在这里���你可以自由地记录想法、分享瞬间。希望你喜欢。', ts: Date.now() - 43200000, replies: [], likes: 0 },
];
export const MOCK_REPLIES: Reply[] = [
  { id: 'r1', messageId: 'msg1', parentId: 'msg1', userId: 'demo-user-2', phoneMasked: '159****5678', text: '同意这个观点���视觉效果很棒。', ts: Date.now() - 3600000, likes: 1, replies: [] },
  { id: 'r1-1', messageId: 'msg1', parentId: 'r1', userId: 'demo-user-1', phoneMasked: '138****1234', text: '谢谢回复！', ts: Date.now() - 3000000, likes: 0, replies: [] },
];
export const MOCK_LIKES: Like[] = [
  { id: 'l1', targetId: 'msg1', targetType: 'message', userId: 'demo-user-2', ts: Date.now() - 80000000 },
  { id: 'l2', targetId: 'r1', targetType: 'reply', userId: 'demo-user-1', ts: Date.now() - 3500000 },
];