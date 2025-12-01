import { Hono } from "hono";
import type { Env } from './core-utils';
import { AuthEntity, MessageEntity, SettingsEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
import type { AuthUser, Settings } from "@shared/types";
const MASK_PHONE = (phone: string) => `${phone.substring(0, 3)}****${phone.substring(7)}`;
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
    // In a real app, you'd send this code via SMS. For demo, we return it.
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
  // MESSAGES
  app.get('/api/messages', async (c) => {
    await MessageEntity.ensureSeed(c.env);
    const { items } = await MessageEntity.list(c.env);
    // Simple sort by timestamp descending for the list view
    items.sort((a, b) => b.ts - a.ts);
    return ok(c, { items, next: null });
  });
  app.post('/api/messages', async (c) => {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) return c.json({ success: false, error: 'Unauthorized' }, 401);
    const auth = new AuthEntity(c.env, 'auth-singleton');
    const session = await auth.verifySession(token);
    if (!session) return c.json({ success: false, error: 'Unauthorized' }, 401);
    const { text } = await c.req.json<{ text: string }>();
    if (!isStr(text) || text.length > 500) return bad(c, 'Invalid message text.');
    const message = await MessageEntity.create(c.env, {
      id: crypto.randomUUID(),
      userId: session.userId,
      phoneMasked: MASK_PHONE(session.phone),
      text: text.trim(),
      ts: Date.now(),
    });
    return ok(c, message);
  });
  // SETTINGS
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
  // SEND WEEKLY (Manual Trigger)
  app.post('/api/send-weekly', async (c) => {
    const settingsEntity = new SettingsEntity(c.env, 'app-settings');
    const settings = await settingsEntity.getState();
    if (!settings.recipient) return bad(c, 'Recipient email not configured.');
    const { items: allMessages } = await MessageEntity.list(c.env);
    const newMessages = allMessages.filter(m => m.ts > settings.lastSentTs);
    if (newMessages.length === 0) {
      return ok(c, { status: 'No new messages to send.', sentCount: 0 });
    }
    const now = Date.now();
    let status = 'success';
    let responseSnippet = `Mock send: ${newMessages.length} messages.`;
    if (settings.provider === 'http') {
      const plainTextBody = `You have ${newMessages.length} new message(s):\n\n` +
        newMessages.map(m => `${m.phoneMasked} at ${new Date(m.ts).toLocaleString()}:\n${m.text}`).join('\n\n---\n\n');
      const htmlBody = `
        <html>
          <body style="font-family: sans-serif; line-height: 1.6;">
            <h1 style="color: #333;">Daily Messages Summary</h1>
            <p>You have ${newMessages.length} new message(s) since the last summary.</p>
            <hr>
            ${newMessages.map(m => `
              <div style="margin-bottom: 1.5em; padding: 1em; border-left: 3px solid #F38020; background-color: #f9f9f9;">
                <p style="margin: 0; color: #555;">
                  <strong>${m.phoneMasked}</strong> - 
                  <span style="font-size: 0.9em; color: #777;">${new Date(m.ts).toLocaleString()}</span>
                </p>
                <p style="margin-top: 0.5em; color: #333;">${m.text}</p>
              </div>
            `).join('')}
          </body>
        </html>`;
      let attempts = 0;
      let success = false;
      while (attempts < 2 && !success) {
        try {
          const resp = await fetch(settings.apiUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${settings.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: settings.recipient,
              subject: `New Messages from 留声 - ${new Date().toLocaleDateString()}`,
              text: plainTextBody,
              html: htmlBody,
            }),
          });
          if (resp.ok) {
            responseSnippet = `HTTP send success: ${resp.status}`;
            success = true;
          } else {
            throw new Error(`API returned ${resp.status}`);
          }
        } catch (e: unknown) {
          const errMsg = (e as Error)?.message ?? 'Unknown error';
          status = 'failure';
          responseSnippet = `HTTP send failed (attempt ${attempts + 1}): ${errMsg}`;
          if (attempts < 1) {
            await new Promise(r => setTimeout(r, 1000)); // wait 1s before retry
          }
        }
        attempts++;
      }
    }
    await settingsEntity.mutate(s => {
      if (status === 'success') {
        s.lastSentTs = now;
      }
      s.sendLogs.unshift({ ts: now, messageCount: newMessages.length, status: status as 'success' | 'failure', responseSnippet });
      s.sendLogs = s.sendLogs.slice(0, 10); // Keep last 10 logs
      return s;
    });
    return ok(c, { status: responseSnippet, sentCount: newMessages.length });
  });
}