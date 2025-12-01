import { Hono } from "hono";
import type { Env } from './core-utils';
import { AuthEntity, MessageEntity, SettingsEntity, ReplyEntity, LikeEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
import type { AuthUser, Settings, Message, Reply } from "@shared/types";
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
const MASK_PHONE = (phone: string) => `${phone.substring(0, 3)}****${phone.substring(7)}`;
async function getSession(c: any): Promise<{ userId: string; phone: string } | null> {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.split(' ')[1];
  if (!token) return null;
  const auth = new AuthEntity(c.env, 'auth-singleton');
  const session = await auth.verifySession(token);
  if (!session) {
    console.warn(`Invalid session token received: ${token.substring(0, 8)}...`);
    return null;
  }
  return session;
}
async function getReplyDepth(env: Env, replyId: string, depth = 0): Promise<number> {
  if (depth > 5) return depth; // Safety break for deep recursion
  const replyEntity = new ReplyEntity(env, replyId);
  if (!(await replyEntity.exists())) return depth;
  const reply = await replyEntity.getState();
  if (!reply.parentId || reply.parentId.startsWith('msg')) {
    return depth + 1;
  }
  return getReplyDepth(env, reply.parentId, depth + 1);
}
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // --- Liuyan Studio Routes ---
  // AUTH
  app.post('/api/auth/request-otp', async (c) => {
    const { phone } = await c.req.json<{ phone: string }>();
    if (!/^\d{11}$/.test(phone)) return bad(c, 'Invalid phone number format.');
    const auth = new AuthEntity(c.env, 'auth-singleton');
    const lastRequest = await auth.getRateLimit(phone);
    if (Date.now() - lastRequest < 60000) {
      return bad(c, 'Too many requests. Please wait 60 seconds.');
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    await auth.saveOtp(phone, code, expiresAt);
    await auth.updateRateLimit(phone, Date.now());
    return ok(c, { demoCode: code });
  });
  app.post('/api/auth/verify-otp', async (c) => {
    const { phone, code } = await c.req.json<{ phone: string; code: string }>();
    if (!/^\d{11}$/.test(phone) || !/^\d{6}$/.test(code)) return bad(c, 'Invalid phone or code.');
    const auth = new AuthEntity(c.env, 'auth-singleton');
    const isValid = await auth.verifyOtp(phone, code);
    if (!isValid) return bad(c, 'Invalid or expired code.');
    const user: AuthUser = { id: `user:${phone}`, phone };
    const token = await auth.createSession(user);
    return ok(c, { token, user });
  });
  // MESSAGES, REPLIES, LIKES
  app.get('/api/messages', async (c) => {
    await MessageEntity.ensureSeed(c.env);
    await ReplyEntity.ensureSeed(c.env);
    await LikeEntity.ensureSeed(c.env);
    const session = await getSession(c);
    const [{ items: messages }, { items: replies }, { items: likes }] = await Promise.all([
      MessageEntity.list(c.env),
      ReplyEntity.list(c.env),
      LikeEntity.list(c.env),
    ]);
    const repliesByParentId = replies.reduce((acc, reply) => {
      (acc[reply.parentId] = acc[reply.parentId] || []).push(reply);
      return acc;
    }, {} as Record<string, Reply[]>);
    const buildReplyTree = (parentId: string): Reply[] => {
      const children = repliesByParentId[parentId] || [];
      return children.map(child => ({
        ...child,
        likedByUser: session ? likes.some(l => l.targetId === child.id && l.userId === session.userId) : false,
        replies: buildReplyTree(child.id),
      })).sort((a, b) => a.ts - b.ts);
    };
    const hydratedMessages = messages.map(msg => ({
      ...msg,
      likedByUser: session ? likes.some(l => l.targetId === msg.id && l.userId === session.userId) : false,
      replies: buildReplyTree(msg.id),
    })).sort((a, b) => b.ts - a.ts);
    return ok(c, { items: hydratedMessages, next: null });
  });
  app.post('/api/messages', async (c) => {
    const session = await getSession(c);
    if (!session) return c.json({ success: false, error: 'Unauthorized' }, 401);
    const { text } = await c.req.json<{ text: string }>();
    if (!isStr(text) || text.length > 500) return bad(c, 'Invalid message text.');
    const messageData: Omit<Message, 'replies' | 'likes' | 'likedByUser'> = {
      id: crypto.randomUUID(),
      userId: session.userId,
      phoneMasked: MASK_PHONE(session.phone),
      text: text.trim(),
      ts: Date.now(),
    };
    const messageToSave: Message = { ...messageData, replies: [], likes: 0 };
    const createdMessage = await MessageEntity.create(c.env, messageToSave);
    return ok(c, { ...createdMessage, likedByUser: false });
  });
  app.post('/api/replies', async (c) => {
    const session = await getSession(c);
    if (!session) return c.json({ success: false, error: 'Unauthorized' }, 401);
    const { parentId, text, messageId } = await c.req.json<{ parentId: string; text: string; messageId: string }>();
    if (!isStr(text) || text.length > 500 || !isStr(parentId) || !isStr(messageId)) return bad(c, 'Invalid input.');
    const depth = parentId.startsWith('msg') ? 0 : await getReplyDepth(c.env, parentId);
    if (depth >= 3) return bad(c, 'Maximum reply depth reached.');
    const replyData: Omit<Reply, 'replies' | 'likes' | 'likedByUser'> = {
      id: crypto.randomUUID(),
      messageId,
      parentId,
      userId: session.userId,
      phoneMasked: MASK_PHONE(session.phone),
      text: text.trim(),
      ts: Date.now(),
    };
    const replyToSave: Reply = { ...replyData, replies: [], likes: 0 };
    const createdReply = await ReplyEntity.create(c.env, replyToSave);
    return ok(c, { ...createdReply, likedByUser: false });
  });
  app.put('/api/likes/:targetId', async (c) => {
    const session = await getSession(c);
    if (!session) return c.json({ success: false, error: 'Unauthorized' }, 401);
    const { targetId } = c.req.param();
    const type = c.req.query('type') as 'message' | 'reply';
    if (!targetId || !['message', 'reply'].includes(type)) return bad(c, 'Invalid target.');
    const existingLike = await LikeEntity.findByUserAndTarget(c.env, session.userId, targetId);
    let finalState: { liked: boolean; count: number };
    if (existingLike) {
      await LikeEntity.delete(c.env, existingLike.id);
      if (type === 'message') {
        const entity = new MessageEntity(c.env, targetId);
        const state = await entity.mutate(s => ({ ...s, likes: Math.max(0, (s.likes || 0) - 1) }));
        finalState = { liked: false, count: state.likes };
      } else {
        const entity = new ReplyEntity(c.env, targetId);
        const state = await entity.mutate(s => ({ ...s, likes: Math.max(0, (s.likes || 0) - 1) }));
        finalState = { liked: false, count: state.likes };
      }
    } else {
      await LikeEntity.create(c.env, { id: crypto.randomUUID(), targetId, targetType: type, userId: session.userId, ts: Date.now() });
      if (type === 'message') {
        const entity = new MessageEntity(c.env, targetId);
        const state = await entity.mutate(s => ({ ...s, likes: (s.likes || 0) + 1 }));
        finalState = { liked: true, count: state.likes };
      } else {
        const entity = new ReplyEntity(c.env, targetId);
        const state = await entity.mutate(s => ({ ...s, likes: (s.likes || 0) + 1 }));
        finalState = { liked: true, count: state.likes };
      }
    }
    return ok(c, finalState);
  });
  // SETTINGS & SEND
  app.get('/api/settings/email', async (c) => {
    const settings = new SettingsEntity(c.env, 'app-settings');
    return ok(c, await settings.getState());
  });
  app.post('/api/settings/email', async (c) => {
    const newSettings = await c.req.json<Partial<Settings>>();
    if (newSettings.recipient && !/.+@.+\..+/.test(newSettings.recipient)) {
      return bad(c, 'Invalid email format.');
    }
    const settings = new SettingsEntity(c.env, 'app-settings');
    await settings.patch(newSettings);
    return ok(c, await settings.getState());
  });
  app.post('/api/send-weekly', async (c) => {
    const settingsEntity = new SettingsEntity(c.env, 'app-settings');
    const settings = await settingsEntity.getState();
    if (!settings.recipient) return bad(c, 'Recipient email not configured.');
    const [{ items: allMessages }, { items: allReplies }, { items: allLikes }] = await Promise.all([
      MessageEntity.list(c.env), 
      ReplyEntity.list(c.env),
      LikeEntity.list(c.env)
    ]);
    const newMessages = allMessages.filter(m => m.ts > settings.lastSentTs);
    const newReplies = allReplies.filter(r => r.ts > settings.lastSentTs);
    const newLikesCount = allLikes.filter(l => l.ts > settings.lastSentTs).length;
    if (newMessages.length === 0 && newReplies.length === 0) {
      return ok(c, { status: 'No new messages or replies to send.', sentCount: 0 });
    }
    const now = Date.now();
    let status: 'success' | 'failure' = 'success';
    let responseSnippet = `Mock send: ${newMessages.length} messages, ${newReplies.length} replies, ${newLikesCount} new likes.`;
    // In a real scenario, you would build an HTML email and send it via an HTTP provider.
    // For this demo, we just log it.
    await settingsEntity.mutate(s => {
      if (status === 'success') s.lastSentTs = now;
      s.sendLogs.unshift({ ts: now, messageCount: newMessages.length, replyCount: newReplies.length, likeCount: newLikesCount, status, responseSnippet });
      s.sendLogs = s.sendLogs.slice(0, 10);
      return s;
    });
    return ok(c, { status: responseSnippet, sentCount: newMessages.length });
  });
}