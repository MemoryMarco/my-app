import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageSquare, Send, Settings, X, Loader2, LogIn, Mail, Phone, KeyRound } from 'lucide-react';
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
import type { Message, Settings as AppSettings, AuthUser } from '@shared/types';
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
type AuthStep = 'phone' | 'otp';
export function HomePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(auth.isLoggedIn());
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(auth.getCurrentUser());
  const [isAuthSheetOpen, setAuthSheetOpen] = useState(false);
  const [isSettingsSheetOpen, setSettingsSheetOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  // Auth State
  const [authStep, setAuthStep] = useState<AuthStep>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  // Settings State
  const [settings, setSettings] = useState<Partial<AppSettings>>({});
  const [isSettingsLoading, setIsSettingsLoading] = useState(false);
  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api<{ items: Message[] }>('/api/messages');
      setMessages(data.items);
    } catch (error) {
      toast.error('Failed to load messages.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchMessages();
    const handleAuthChange = () => {
      setIsLoggedIn(auth.isLoggedIn());
      setCurrentUser(auth.getCurrentUser());
    };
    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, [fetchMessages]);
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);
  const handleRequestOtp = async () => {
    if (!/^\d{11}$/.test(phone)) {
      toast.error('请输入有效的 11 位手机号。');
      return;
    }
    setIsOtpLoading(true);
    try {
      const { demoCode } = await api<{ demoCode: string }>('/api/auth/request-otp', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      });
      toast.success(`[演示] 验证码已发送: ${demoCode}`);
      setAuthStep('otp');
      setCountdown(60);
    } catch (error) {
      toast.error('发送验证码失败，请稍后再试。');
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
      const { token, user } = await api<{ token: string; user: AuthUser }>('/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ phone, code: otp }),
      });
      auth.loginWithToken(token, user);
      toast.success('登录��功！');
      setAuthSheetOpen(false);
      setPhone('');
      setOtp('');
      setAuthStep('phone');
    } catch (error) {
      toast.error('验证码错误或已��期。');
    } finally {
      setIsOtpLoading(false);
    }
  };
  const handlePostMessage = async () => {
    if (!newMessage.trim()) return;
    setIsPosting(true);
    try {
      const postedMessage = await api<Message>('/api/messages', {
        method: 'POST',
        body: JSON.stringify({ text: newMessage }),
      });
      setMessages(prev => [postedMessage, ...prev]);
      setNewMessage('');
      toast.success('留言成功！');
    } catch (error) {
      toast.error('发布失败，请稍后重试。');
      auth.logout(); // Force logout on auth error
    } finally {
      setIsPosting(false);
    }
  };
  const handleOpenSettings = async () => {
    setSettingsSheetOpen(true);
    setIsSettingsLoading(true);
    try {
      const data = await api<AppSettings>('/api/settings/email');
      setSettings(data);
    } catch (error) {
      toast.error('无法加载��置。');
    } finally {
      setIsSettingsLoading(false);
    }
  };
  const handleSaveSettings = async () => {
    setIsSettingsLoading(true);
    try {
      await api('/api/settings/email', {
        method: 'POST',
        body: JSON.stringify({ recipient: settings.recipient }),
      });
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
    } catch (error) {
      toast.error('发送失败。');
    } finally {
      setIsSettingsLoading(false);
    }
  };
  return (
    <div className="relative min-h-screen bg-background font-sans">
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#374151_1px,transparent_1px)]" />
      <div className="absolute inset-0 bg-gradient-mesh opacity-20 dark:opacity-30 -z-10" />
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-primary">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">留声</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle className="relative top-0 right-0" />
            <Button variant="ghost" size="icon" onClick={handleOpenSettings}><Settings className="h-5 w-5" /></Button>
            {isLoggedIn ? (
              <Button variant="outline" size="sm" onClick={auth.logout}>登出</Button>
            ) : (
              <Button size="sm" onClick={() => setAuthSheetOpen(true)} className="btn-gradient">登录</Button>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {/* Messages List */}
            <div className="md:col-span-2 space-y-4">
              <AnimatePresence>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                      <MessageCard isLoading />
                    </motion.div>
                  ))
                ) : messages.length > 0 ? (
                  messages.map((msg, i) => (
                    <motion.div key={msg.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <MessageCard message={msg} />
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-16 border rounded-2xl bg-card/50">
                    <p className="text-muted-foreground">还没有留言，快来发布第一条���！</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
            {/* Post Message Form */}
            <div className="md:col-span-1 sticky top-24">
              <div className="p-6 rounded-2xl bg-card shadow-soft space-y-4">
                <h2 className="text-xl font-semibold">记录此刻</h2>
                {isLoggedIn ? (
                  <>
                    <p className="text-sm text-muted-foreground">欢迎, {currentUser?.phone ? `${currentUser.phone.substring(0, 3)}****${currentUser.phone.substring(7)}` : '用户'}</p>
                    <Textarea
                      placeholder="说点什么..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={5}
                      maxLength={500}
                      className="resize-none"
                    />
                    <Button onClick={handlePostMessage} disabled={isPosting || !newMessage.trim()} className="w-full btn-gradient">
                      {isPosting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                      发布
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-8 space-y-4">
                    <p className="text-muted-foreground">登录后即可发布留言</p>
                    <Button onClick={() => setAuthSheetOpen(true)} className="btn-gradient">
                      <LogIn className="mr-2 h-4 w-4" />
                      手机号登录
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      {/* Auth Sheet */}
      <Sheet open={isAuthSheetOpen} onOpenChange={setAuthSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>登录 / 注册</SheetTitle>
            <SheetDescription>通过手机验证码登录，体验完整功能。</SheetDescription>
          </SheetHeader>
          <div className="py-8 space-y-6">
            {authStep === 'phone' && (
              <div className="space-y-4">
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input type="tel" placeholder="请输入手机号" value={phone} onChange={e => setPhone(e.target.value)} className="pl-10" />
                </div>
                <Button onClick={handleRequestOtp} disabled={isOtpLoading || countdown > 0} className="w-full btn-gradient">
                  {isOtpLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {countdown > 0 ? `${countdown}s 后重试` : '获��验证码'}
                </Button>
              </div>
            )}
            {authStep === 'otp' && (
              <div className="space-y-4">
                <p className="text-sm text-center text-muted-foreground">验证码已发送至 {phone}</p>
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button onClick={handleVerifyOtp} disabled={isOtpLoading} className="w-full btn-gradient">
                  {isOtpLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                  验证并登录
                </Button>
                <Button variant="link" size="sm" onClick={() => { setAuthStep('phone'); setOtp(''); }}>���回</Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
      {/* Settings Sheet */}
      <Sheet open={isSettingsSheetOpen} onOpenChange={setSettingsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>邮箱设置</SheetTitle>
            <SheetDescription>配置留言���收邮箱。留言将在工作日晚 8 点汇总发送。</SheetDescription>
          </SheetHeader>
          <div className="py-8 space-y-6">
            {isSettingsLoading && !settings.recipient ? <Skeleton className="h-10 w-full" /> : (
              <div className="space-y-2">
                <label htmlFor="recipient-email" className="text-sm font-medium">收件邮箱</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input id="recipient-email" type="email" placeholder="your-email@example.com" value={settings.recipient || ''} onChange={e => setSettings(s => ({ ...s, recipient: e.target.value }))} className="pl-10" />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Button onClick={handleSaveSettings} disabled={isSettingsLoading} className="w-full">
                {isSettingsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                保存设置
              </Button>
              <Button onClick={handleSendNow} disabled={isSettingsLoading} variant="outline" className="w-full">
                {isSettingsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                立即发送测试
              </Button>
            </div>
            <div className="text-xs text-muted-foreground text-center">
              上次发送: {settings.lastSentTs ? new Date(settings.lastSentTs).toLocaleString() : '从未'}
            </div>
          </div>
        </SheetContent>
      </Sheet>
      <Toaster richColors closeButton />
      <footer className="py-8 text-center text-muted-foreground/80 text-sm">
        <p>Built with ❤️ at Cloudflare</p>
      </footer>
    </div>
  );
}