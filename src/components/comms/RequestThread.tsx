import { useState } from "react";
import { Mail, CheckCircle2, Copy, Check } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { GuestConversation, getRelativeTime } from "@/data/commsData";
import { toast } from "sonner";

interface RequestThreadProps {
  conversation: GuestConversation;
  propertyName?: string;
  onResolve?: (guestEmail: string) => void;
}

export default function RequestThread({ conversation, onResolve }: RequestThreadProps) {
  const [copied, setCopied] = useState(false);
  const initials = conversation.guestName.split(" ").map(n => n[0]).join("").toUpperCase();

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(conversation.guestEmail);
    setCopied(true);
    toast.success("Email copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResolve = () => {
    onResolve(conversation.guestEmail);
    toast.success("Requests marked as resolved");
  };

  return (
    <Card className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <CardHeader className="border-b py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-base">{conversation.guestName}</h3>
              {conversation.guestEmail && (
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-xs text-muted-foreground">{conversation.guestEmail}</span>
                  <button
                    onClick={handleCopyEmail}
                    className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded"
                    title="Copy email"
                  >
                    {copied ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
          {conversation.status !== "resolved" && onResolve && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleResolve}>
              <CheckCircle2 className="h-4 w-4" />
              Mark as Resolved
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
          {conversation.requests.map(request => (
            <div key={request.id} className="space-y-3">
              {/* Guest message */}
              <div className="flex justify-start">
                <div className="max-w-md rounded-2xl rounded-bl-sm bg-muted p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs font-medium">{request.guestName}</span>
                    <Mail className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <p className="text-sm">{request.message}</p>
                  <span className="text-[10px] text-muted-foreground mt-1 block">
                    {getRelativeTime(request.timestamp)}
                  </span>
                </div>
              </div>

              {/* Staff replies for this request */}
              {request.replies.map(reply => (
                <div key={reply.id} className="flex justify-end">
                  <div className="max-w-md rounded-2xl rounded-br-sm bg-[#0F1B2D] text-white p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs font-medium">{reply.sentBy}</span>
                      <Mail className="h-3 w-3 text-white/60" />
                    </div>
                    <p className="text-sm">{reply.body}</p>
                    <span className="text-[10px] text-white/50 mt-1 block">
                      {getRelativeTime(reply.sentAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
