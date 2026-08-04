import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { GuestConversation, getRelativeTime } from "@/data/commsData";

const tabs = [
  { key: "open" as const, label: "Unresolved" },
  { key: "resolved" as const, label: "Resolved" },
];

interface RequestListProps {
  conversations: GuestConversation[];
  selectedKey: string;
  activeTab: "open" | "resolved";
  onTabChange: (tab: "open" | "resolved") => void;
  onSelect: (conv: GuestConversation) => void;
}

export default function RequestList({ conversations, selectedKey, activeTab, onTabChange, onSelect }: RequestListProps) {
  const unrepliedCount = conversations.filter(
    c => c.status === "open" && c.requests.every(r => r.replies.length === 0)
  ).length;

  const filtered = useMemo(() => {
    if (activeTab === "open") return conversations.filter(c => c.status !== "resolved");
    return conversations.filter(c => c.status === "resolved");
  }, [conversations, activeTab]);

  return (
    <Card className="w-96 flex flex-col min-h-0">
      <CardHeader className="pb-3 space-y-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-xl font-semibold">Guest Requests</CardTitle>
          {unrepliedCount > 0 && (
            <Badge variant="destructive" className="text-xs px-2 py-0.5">
              {unrepliedCount}
            </Badge>
          )}
        </div>

        <div className="flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-0">
        {filtered.length === 0 && (
          <div className="p-6 text-center text-sm text-muted-foreground">
            No requests found
          </div>
        )}
        {filtered.map(conv => {
          const initials = conv.guestName.split(" ").map(n => n[0]).join("").toUpperCase();
          const latestRequest = conv.requests[conv.requests.length - 1];
          const isUnreplied = conv.status === "open" && conv.requests.every(r => r.replies.length === 0);

          return (
            <div
              key={conv.guestEmail}
              onClick={() => onSelect(conv)}
              className={`p-4 cursor-pointer hover:bg-muted/50 border-b transition-colors ${
                selectedKey === conv.guestEmail ? "bg-accent/10 border-l-4 border-l-primary" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-medium text-sm truncate">{conv.guestName}</h4>
                      {isUnreplied && (
                        <span className="h-2 w-2 rounded-full bg-destructive shrink-0" />
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap ml-2">
                      {getRelativeTime(conv.latestTimestamp)}
                    </span>
                  </div>

                  {conv.requests.length > 1 && (
                    <div className="mb-1">
                      <span className="text-[11px] text-muted-foreground">
                        {conv.requests.length} requests
                      </span>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground truncate">
                    {latestRequest.message.slice(0, 60)}{latestRequest.message.length > 60 ? "…" : ""}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
