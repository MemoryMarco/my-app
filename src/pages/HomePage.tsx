import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageSquare, Send, Settings, Loader2, LogIn, Mail, Phone, KeyRound, Info, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Toaster, toast } from '@/components/ui/sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { MessageCard } from '@/components/MessageCard';
import { api } from '@/lib/api-client';
import * as auth from '@/lib/auth';
import type { Message, Settings as AppSettings, AuthUser, Reply } from '@shared/types';
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { z } from 'zod';
import { produce } from 'immer';
type AuthStep = 'phone' | 'otp';
const MASK_PHONE = (phone: string) => phone ? `${phone.substring(0, 3)}****${phone.substring(7)}` : '';
const settingsSchema = z.object({
  recipient: z.string().email({ message: "请输入有效的邮箱地址。" }),
  provider: z.enum(['mock', 'http']),
  apiUrl: z.string().url({ message: "请输入有效的 URL。" }).optional().or(z.literal('')),
  apiKey: z.string().optional(),
  timezone: z.string().optional(),
}).refine(data => data.provider !== 'http' || (data.apiUrl && data.apiUrl.length > 0), {
  message: "HTTP Provider 需要 API URL。",
  path: ["apiUrl"],
});
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};
export function HomePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(auth.isLoggedIn());
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(auth.getCurrentUser());
  const [isAuthSheetOpen, setAuthSheetOpen] = useState(false);
  const [isSettingsSheetOpen, setSettingsSheetOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [authStep, setAuthStep] = useState<AuthStep>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [settings, setSettings] = useState<Partial<AppSettings>>({ provider: 'mock', timezone: 'UTC' });
  const [isSettingsLoading, setIsSettingsLoading] = useState(false);
  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api<{ items: Message[] }>('/api/messages');
      setMessages(data.items);
    } catch (error) {
      toast.error('��载留言失败。');
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchMessages();
    const handleAuthChange = () => {
      setIsLoggedIn(auth.isLoggedIn());
      setCurrentUser(auth.getCurrentUser());
      if (auth.isLoggedIn()) fetchMessages(); // Re-fetch to get user-specific data like `likedByUser`
    };
    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, [fetchMessages]);
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);
  const handleRequestOtp = async () => {
    if (!/^\d{11}$/.test(phone)) {
      toast.error('请输入有效的 11 位手机号。');
      return;
    }
    setIsOtpLoading(true);
    try {
      const { demoCode } = await api<{ demoCode: string }>('/api/auth/request-otp', { method: 'POST', body: JSON.stringify({ phone }) });
      toast.success(`[演示] 验证码已发送: ${demoCode}`);
      setAuthStep('otp');
      setCountdown(60);
    } catch (error) {
      toast.error((error as Error).message || '发送验证码失败，请稍后再试。');
    } finally {
      setIsOtpLoading(false);
    }
  };
  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error('请输入 6 位验证码。');
      return;
    }
    setIsOtpLoading(true);
    try {
      const { token, user } = await api<{ token: string; user: AuthUser }>('/api/auth/verify-otp', { method: 'POST', body: JSON.stringify({ phone, code: otp }) });
      auth.loginWithToken(token, user);
      toast.success('登录成功！');
      setAuthSheetOpen(false);
      setPhone(''); setOtp(''); setAuthStep('phone');
    } catch (error) {
      toast.error('验证码错误或已过��。');
    } finally {
      setIsOtpLoading(false);
    }
  };
  const handlePostMessage = async () => {
    const postText = newMessage.trim();
    if (!postText) return;
    setIsPosting(true);
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      userId: currentUser!.id,
      phoneMasked: MASK_PHONE(currentUser!.phone),
      text: postText,
      ts: Date.now(),
      replies: [],
      likes: 0,
      likedByUser: false,
    };
    setMessages(prev => [optimisticMessage, ...prev]);
    setNewMessage('');
    try {
      const postedMessage = await api<Message>('/api/messages', { method: 'POST', body: JSON.stringify({ text: postText }) });
      setMessages(prev => prev.map(m => m.id === optimisticMessage.id ? postedMessage : m));
      toast.success('���言成功！');
    } catch (error) {
      toast.error('发布失败，请重新登录。');
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
      auth.logout();
    } finally {
      setIsPosting(false);
    }
  };
  const updateNestedState = (items: (Message | Reply)[], targetId: string, updateFn: (item: Message | Reply) => void): any[] => {
    return produce(items, draft => {
      const findAndUpdate = (nodes: any[]) => {
        for (let node of nodes) {
          if (node.id === targetId) {
            updateFn(node);
            return true;
          }
          if (node.replies && findAndUpdate(node.replies)) return true;
        }
        return false;
      };
      findAndUpdate(draft);
    });
  };
  const handleToggleLike = useCallback(async (targetId: string, type: 'message' | 'reply') => {
    if (!isLoggedIn) {
      toast.error("请先登录再��赞");
      setAuthSheetOpen(true);
      return;
    }
    // Optimistic update
    setMessages(prev => updateNestedState(prev, targetId, item => {
      if (item.likedByUser) {
        item.likes -= 1;
        item.likedByUser = false;
      } else {
        item.likes += 1;
        item.likedByUser = true;
      }
    }));
    try {
      await api(`/api/likes/${targetId}?type=${type}`, { method: 'PUT' });
    } catch (error) {
      toast.error("操作失败");
      // Revert
      setMessages(prev => updateNestedState(prev, targetId, item => {
        if (item.likedByUser) { // This is the new state, so revert it
          item.likes -= 1;
          item.likedByUser = false;
        } else {
          item.likes += 1;
          item.likedByUser = true;
        }
      }));
    }
  }, [isLoggedIn]);
  const handleReply = useCallback(async (parentId: string, text: string, messageId: string) => {
    if (!isLoggedIn) {
      toast.error("请先登录再回复");
      setAuthSheetOpen(true);
      return;
    }
    const optimisticReply: Reply = {
      id: `temp-reply-${Date.now()}`,
      parentId, messageId, text,
      userId: currentUser!.id,
      phoneMasked: MASK_PHONE(currentUser!.phone),
      ts: Date.now(),
      replies: [],
      likes: 0,
      likedByUser: false,
    };
    setMessages(prev => updateNestedState(prev, parentId, item => {
      item.replies.push(optimisticReply);
    }));
    try {
      const newReply = await api<Reply>('/api/replies', { method: 'POST', body: JSON.stringify({ parentId, text, messageId }) });
      setMessages(prev => updateNestedState(prev, parentId, item => {
        const replyIndex = item.replies.findIndex(r => r.id === optimisticReply.id);
        if (replyIndex > -1) item.replies[replyIndex] = newReply;
      }));
    } catch (error) {
      toast.error((error as Error).message || "回复失败");
      setMessages(prev => updateNestedState(prev, parentId, item => {
        item.replies = item.replies.filter(r => r.id !== optimisticReply.id);
      }));
    }
  }, [isLoggedIn, currentUser]);
  const handleOpenSettings = async () => {
    setSettingsSheetOpen(true);
    setIsSettingsLoading(true);
    try {
      const data = await api<AppSettings>('/api/settings/email');
      setSettings(data);
    } catch (error) {
      toast.error('无法加载设���。');
    } finally {
      setIsSettingsLoading(false);
    }
  };
  const handleSaveSettings = async () => {
    const result = settingsSchema.safeParse(settings);
    if (!result.success) {
      result.error.issues.forEach(err => toast.error(err.message));
      return;
    }
    setIsSettingsLoading(true);
    try {
      await api('/api/settings/email', { method: 'POST', body: JSON.stringify(settings) });
      toast.success('设置已保存。');
      setSettingsSheetOpen(false);
    } catch (error) {
      toast.error('保存失败。');
    } finally {
      setIsSettingsLoading(false);
    }
  };
  const handleSendNow = async () => {
    setIsSettingsLoading(true);
    try {
      const result = await api<{ status: string; sentCount: number }>('/api/send-weekly', { method: 'POST' });
      toast.success(`发送成功: ${result.sentCount}条新留言`, { description: result.status });
      handleOpenSettings(); // Refresh settings to show new log
    } catch (error) {
      toast.error((error as Error).message || '发送失败。');
    } finally {
      setIsSettingsLoading(false);
    }
  };
  const successRate = settings.sendLogs && settings.sendLogs.length > 0
    ? (settings.sendLogs.filter(l => l.status === 'success').length / settings.sendLogs.length * 100).toFixed(0)
    : 'N/A';
  return (
    <TooltipProvider>
      <div className="relative min-h-screen bg-background font-sans">
        <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#374151_1px,transparent_1px)]" />
        <div className="absolute inset-0 bg-gradient-mesh opacity-20 dark:opacity-30 -z-10" />
        <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-primary">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-display font-bold text-foreground">留声</h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle className="relative top-0 right-0" />
              <Button variant="ghost" size="icon" onClick={handleOpenSettings} aria-label="打开设置"><Settings className="h-5 w-5" /></Button>
              {isLoggedIn ? (
                <Button variant="outline" size="sm" onClick={auth.logout}>登出</Button>
              ) : (
                <Button size="sm" onClick={() => setAuthSheetOpen(true)} className="btn-gradient">���录</Button>
              )}
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8 md:py-10 lg:py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
              <motion.div className="md:col-span-2 space-y-4" variants={containerVariants} initial="hidden" animate="visible">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <motion.div key={i} variants={cardVariants}><MessageCard isLoading message={{} as Message} onReply={async ()=>{}} onLike={async ()=>{}} /></motion.div>
                  ))
                ) : messages.length > 0 ? (
                  messages.map((msg) => (
                    <motion.div key={msg.id} variants={cardVariants}>
                      <MessageCard message={msg} onReply={handleReply} onLike={handleToggleLike} />
                    </motion.div>
                  ))
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 border rounded-2xl bg-card/50">
                    <p className="text-muted-foreground">还没有留言，快��发布第一条吧！</p>
                  </motion.div>
                )}
              </motion.div>
              <div className="md:col-span-1 sticky top-24">
                <div className="p-6 rounded-2xl bg-card shadow-soft space-y-4">
                  <h2 className="text-xl font-semibold">记���此刻</h2>
                  {isLoggedIn ? (
                    <>
                      <p className="text-sm text-muted-foreground">欢迎, {currentUser?.phone ? MASK_PHONE(currentUser.phone) : '用户'}</p>
                      <Textarea placeholder="说点什么..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} rows={5} maxLength={500} className="resize-none" aria-label="留言输入框" />
                      <Button onClick={handlePostMessage} disabled={isPosting || !newMessage.trim()} className="w-full btn-gradient">
                        {isPosting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />} 发布
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-8 space-y-4">
                      <p className="text-muted-foreground">登录后即可发布留言</p>
                      <Button onClick={() => setAuthSheetOpen(true)} className="btn-gradient">
                        <LogIn className="mr-2 h-4 w-4" /> 手机号登录
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
        <Sheet open={isAuthSheetOpen} onOpenChange={setAuthSheetOpen}>
          <SheetContent><SheetHeader><SheetTitle>登录 / 注册</SheetTitle><SheetDescription>通过手机验��码登录，体验完整功能。</SheetDescription></SheetHeader>
            <div className="py-8 space-y-6">
              {authStep === 'phone' && (<div className="space-y-4"><div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><Input type="tel" placeholder="请输入手机号" value={phone} onChange={e => setPhone(e.target.value)} className="pl-10" aria-label="手机号输入框" /></div><Button onClick={handleRequestOtp} disabled={isOtpLoading || countdown > 0} className="w-full btn-gradient">{isOtpLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{countdown > 0 ? `${countdown}s ��重试` : '获取验证码'}</Button></div>)}
              {authStep === 'otp' && (<div className="space-y-4 text-center"><p className="text-sm text-muted-foreground">验证码已发送至 {phone}</p><div className="flex justify-center"><InputOTP maxLength={6} value={otp} onChange={setOtp} aria-label="验证码输入框"><InputOTPGroup><InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} /><InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} /></InputOTPGroup></InputOTP></div><Button onClick={handleVerifyOtp} disabled={isOtpLoading} className="w-full btn-gradient">{isOtpLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}验证并登录</Button><Button variant="link" size="sm" onClick={() => { setAuthStep('phone'); setOtp(''); }}>返回</Button></div>)}
            </div>
          </SheetContent>
        </Sheet>
        <Sheet open={isSettingsSheetOpen} onOpenChange={setSettingsSheetOpen}>
          <SheetContent className="sm:max-w-lg overflow-y-auto"><SheetHeader><SheetTitle>邮���设置</SheetTitle><SheetDescription>配置留言接收邮箱。留言将在工作日晚 8 点汇总发送。</SheetDescription></SheetHeader>
            <div className="py-8 space-y-6">
              {isSettingsLoading && !settings.recipient ? <Skeleton className="h-48 w-full" /> : (<div className="space-y-4"><div className="space-y-2"><label className="text-sm font-medium">收件邮箱</label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><Input type="email" placeholder="your-email@example.com" value={settings.recipient || ''} onChange={e => setSettings(s => ({ ...s, recipient: e.target.value }))} className="pl-10" aria-label="收件邮箱" /></div></div><div className="space-y-2"><label className="text-sm font-medium">发送方式</label><Select value={settings.provider} onValueChange={(v) => setSettings(s => ({ ...s, provider: v as 'mock' | 'http' }))}><SelectTrigger aria-label="选择发送方式"><SelectValue placeholder="选择发送方式" /></SelectTrigger><SelectContent><SelectItem value="mock">Mock (演示)</SelectItem><SelectItem value="http">HTTP Provider</SelectItem></SelectContent></Select></div>{settings.provider === 'http' && (<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 overflow-hidden"><div className="space-y-2"><label className="text-sm font-medium">API URL</label><Input placeholder="https://api.sendgrid.com/v3/mail/send" value={settings.apiUrl || ''} onChange={e => setSettings(s => ({ ...s, apiUrl: e.target.value }))} aria-label="API URL" /></div><div className="space-y-2"><label className="text-sm font-medium">API Key</label><Tooltip><TooltipTrigger asChild><div className="relative"><Input type="password" placeholder="••••••••••••••••" value={settings.apiKey || ''} onChange={e => setSettings(s => ({ ...s, apiKey: e.target.value }))} aria-label="API Key" /><Info className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /></div></TooltipTrigger><TooltipContent><p className="text-xs">仅���于演示。生产环境请使用 Worker Secrets。</p></TooltipContent></Tooltip></div></motion.div>)}<div className="space-y-2"><label className="text-sm font-medium">时区</label><Select value={settings.timezone} onValueChange={(v) => setSettings(s => ({ ...s, timezone: v }))}><SelectTrigger aria-label="选择时区"><SelectValue placeholder="选择时区" /></SelectTrigger><SelectContent><SelectItem value="UTC">UTC</SelectItem><SelectItem value="Asia/Shanghai">Asia/Shanghai (UTC+8)</SelectItem></SelectContent></Select></div></div>)}
              <div className="space-y-2"><Button onClick={handleSaveSettings} disabled={isSettingsLoading} className="w-full">{isSettingsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} 保存设置</Button><Button onClick={handleSendNow} disabled={isSettingsLoading} variant="outline" className="w-full">{isSettingsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} 立即发送测试</Button></div>
              <Accordion type="single" collapsible className="w-full"><AccordionItem value="logs"><AccordionTrigger>最近发送记录</AccordionTrigger><AccordionContent>{isSettingsLoading && !settings.sendLogs ? <Skeleton className="h-20 w-full" /> : settings.sendLogs && settings.sendLogs.length > 0 ? (<div className="space-y-4"><div className="flex items-center text-sm font-medium text-muted-foreground"><Percent className="h-4 w-4 mr-2" /><span>成功率: {successRate}%</span></div>{settings.sendLogs.slice(0, 5).map(log => (<motion.div key={log.ts} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm border-l-2 pl-3" style={{ borderColor: log.status === 'success' ? 'hsl(var(--primary))' : 'hsl(var(--destructive))' }}><p className="font-medium">{log.messageCount} 条留言 - <span className={log.status === 'success' ? 'text-primary' : 'text-destructive'}>{log.status}</span></p><p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(log.ts), { addSuffix: true, locale: zhCN })}</p><p className="text-xs text-muted-foreground truncate" title={log.responseSnippet}>{log.responseSnippet}</p></motion.div>))}</div>) : <p className="text-sm text-muted-foreground text-center py-4">暂无记录</p>}</AccordionContent></AccordionItem></Accordion>
            </div>
          </SheetContent>
        </Sheet>
        <Toaster richColors closeButton />
        <footer className="py-8 text-center text-muted-foreground/80 text-sm">
          <p>Built with ���️ at Cloudflare</p>
        </footer>
      </div>
    </TooltipProvider>
  );
}