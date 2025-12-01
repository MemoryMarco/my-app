import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Message, Reply } from "@shared/types";
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { UserCircle2, Heart, MessageCircle, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
type MessageOrReply = (Message | Reply) & { messageId?: string };
interface MessageCardProps {
  message: MessageOrReply;
  isLoading?: boolean;
  level?: number;
  onReply: (parentId: string, text: string, messageId: string) => Promise<void>;
  onLike: (targetId: string, type: 'message' | 'reply') => Promise<void>;
}
export function MessageCard({ message, isLoading, level = 0, onReply, onLike }: MessageCardProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isPostingReply, setIsPostingReply] = useState(false);
  const isMobile = useIsMobile();
  if (isLoading || !message) {
    return (
      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2 pt-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </CardContent>
      </Card>
    );
  }
  const handleReplySubmit = async () => {
    if (!replyText.trim()) return;
    setIsPostingReply(true);
    try {
      const rootMessageId = level === 0 ? message.id : (message as Reply).messageId;
      await onReply(message.id, replyText, rootMessageId);
      setReplyText('');
      setIsReplying(false);
    } catch (error) {
      console.error("Reply submission failed:", error);
    } finally {
      setIsPostingReply(false);
    }
  };
  const isReply = level > 0;
  const targetType = isReply ? 'reply' : 'message';
  const renderReplies = () => {
    if (!message.replies || message.replies.length === 0) return null;
    const repliesContent = (
      <div className={cn("mt-2 space-y-3", level > 0 ? "ml-4 pl-4 border-l-2" : "md:ml-8 ml-4 pl-4 border-l-2 border-border/80")}>
        {message.replies.map(reply => (
          <MessageCard key={reply.id} message={reply} level={level + 1} onReply={onReply} onLike={onLike} />
        ))}
      </div>
    );
    if (isMobile && level >= 1) {
      return (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="replies" className="border-none">
            <AccordionTrigger className="text-xs text-muted-foreground hover:no-underline py-1">
              {message.replies.length} 条回复
            </AccordionTrigger>
            <AccordionContent>{repliesContent}</AccordionContent>
          </AccordionItem>
        </Accordion>
      );
    }
    return repliesContent;
  };
  return (
    <motion.div layout="position">
      <Card className="rounded-2xl bg-card shadow-soft transition-all duration-200 hover:shadow-glow hover:-translate-y-0.5">
        <CardHeader className="flex flex-row items-center gap-4 pb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <UserCircle2 className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">{message.phoneMasked}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(message.ts), { addSuffix: true, locale: zhCN })}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-base leading-relaxed text-foreground/90 text-pretty">{message.text}</p>
          <div className="mt-3 flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => onLike(message.id, targetType)} className={cn("flex items-center gap-1.5 p-1 h-auto text-muted-foreground hover:text-red-500", message.likedByUser && "text-red-500")} aria-label={`点赞 (${message.likes})`}>
              <motion.div whileTap={{ scale: 1.2 }} whileHover={{ scale: 1.1 }}>
                <Heart className={cn("h-4 w-4 transition-colors", message.likedByUser && "fill-current")} />
              </motion.div>
              <span className="text-xs font-medium">{message.likes}</span>
            </Button>
            {level < 3 && (
              <Button variant="ghost" size="sm" onClick={() => setIsReplying(!isReplying)} className="flex items-center gap-1.5 p-1 h-auto text-muted-foreground hover:text-primary" aria-label="回复">
                <MessageCircle className="h-4 w-4" />
                <span className="text-xs font-medium">回复</span>
              </Button>
            )}
          </div>
          <AnimatePresence>
            {isReplying && level < 3 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-2 overflow-hidden"
              >
                <Textarea
                  placeholder={`回复 ${message.phoneMasked}...`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
                <div className="flex justify-end">
                  <Button size="sm" onClick={handleReplySubmit} disabled={isPostingReply || !replyText.trim()}>
                    {isPostingReply ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    发送
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
      {renderReplies()}
    </motion.div>
  );
}