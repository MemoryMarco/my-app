import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Message } from "@shared/types";
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale/ja';
import { UserCircle2 } from "lucide-react";
interface MessageCardProps {
  message?: Message;
  isLoading?: boolean;
}
export function MessageCard({ message, isLoading }: MessageCardProps) {
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
  return (
    <Card className="rounded-2xl bg-card shadow-soft transition-all duration-200 hover:shadow-glow hover:-translate-y-1">
      <CardHeader className="flex flex-row items-center gap-4 pb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <UserCircle2 className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground">{message.phoneMasked}</p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(message.ts), { addSuffix: true, locale: ja })}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-base leading-relaxed text-foreground/90 text-pretty">{message.text}</p>
      </CardContent>
    </Card>
  );
}