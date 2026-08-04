import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GuestRequest, GuestConversation } from "@/data/commsData";
import RequestList from "@/components/comms/RequestList";
import RequestThread from "@/components/comms/RequestThread";
import { Skeleton } from "@/components/ui/skeleton";
import { dashboardAPI } from "@/services/api";
import { useProperty } from "@/context/PropertyContext";
import { useWriteAccess } from "@/hooks/useWriteAccess";

const PROPERTY_NAME = "LUME Resort & Spa";

/** Map a raw ServiceRequest from the API to the GuestRequest shape used by Comms UI */
function mapServiceRequest(raw: any): GuestRequest {
  const statusMap: Record<string, GuestRequest["status"]> = {
    Pending: "open",
    Assigned: "replied",
    "In-progress": "replied",
    Completed: "resolved",
  };
  return {
    id: raw._id,
    guestName: raw.guestId?.fullName || raw.guestName || "Unknown Guest",
    guestEmail: raw.guestId?.email || "",
    roomNumber: raw.roomNumber || "",
    bookingId: raw.guestId?._id || raw._id,
    message: raw.item || "",
    timestamp: raw.createdAt || new Date().toISOString(),
    status: statusMap[raw.status] ?? "open",
    replies: (raw.replies || []).map((r: any, idx: number) => ({
      id: `${raw._id}-rep-${idx}`,
      body: r.body,
      sentAt: r.sentAt || new Date().toISOString(),
      sentBy: r.sentBy || "Front Desk",
    })),
  };
}

/** Group individual requests by guest (keyed on guestEmail or guestName) */
function groupByGuest(requests: GuestRequest[]): GuestConversation[] {
  const map = new Map<string, GuestRequest[]>();
  for (const req of requests) {
    const key = req.guestEmail || req.guestName;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(req);
  }

  const conversations: GuestConversation[] = Array.from(map.entries()).map(([key, reqs]) => {
    const sorted = [...reqs].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const allResolved = sorted.every(r => r.status === "resolved");
    const anyReplied = sorted.some(r => r.replies.length > 0);
    return {
      guestEmail: key,
      guestName: sorted[0].guestName,
      bookingId: sorted[0].bookingId,
      roomNumber: sorted[0].roomNumber,
      requests: sorted,
      latestTimestamp: sorted[sorted.length - 1].timestamp,
      status: allResolved ? "resolved" : anyReplied ? "replied" : "open",
    };
  });

  // Sort newest-first
  return conversations.sort(
    (a, b) => new Date(b.latestTimestamp).getTime() - new Date(a.latestTimestamp).getTime()
  );
}

export default function Comms() {
  const queryClient = useQueryClient();
  const canWrite = useWriteAccess();
  const { selectedProperty } = useProperty();
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"open" | "resolved">("open");

  const { data: rawRequests = [], isLoading } = useQuery({
    queryKey: ["comms-requests", selectedProperty.id],
    queryFn: () => dashboardAPI.getRequests(undefined, undefined, selectedProperty.id),
    refetchInterval: 30000,
  });

  const conversations: GuestConversation[] = useMemo(
    () => groupByGuest(rawRequests.map(mapServiceRequest)),
    [rawRequests]
  );

  // Auto-select first conversation
  const effectiveKey = selectedKey || conversations[0]?.guestEmail || "";
  const selectedConversation = conversations.find(c => c.guestEmail === effectiveKey) ?? conversations[0];

  const resolveMutation = useMutation({
    mutationFn: (id: string) =>
      dashboardAPI.updateRequestStatus(id, { status: "Completed" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comms-requests"] });
    },
  });

  const handleSelect = useCallback((conv: GuestConversation) => {
    setSelectedKey(conv.guestEmail);
  }, []);

  const handleResolve = useCallback((guestEmail: string) => {
    const conv = conversations.find(c => c.guestEmail === guestEmail);
    if (!conv) return;
    conv.requests
      .filter(r => r.status !== "resolved")
      .forEach(r => resolveMutation.mutate(r.id));
  }, [conversations, resolveMutation]);

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-8rem)] flex gap-4">
        <div className="w-96 space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
        <div className="flex-1 space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      <RequestList
        conversations={conversations}
        selectedKey={effectiveKey}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSelect={handleSelect}
      />
      {conversations.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          No guest requests yet. Requests submitted via the guest app will appear here.
        </div>
      ) : selectedConversation ? (
        <RequestThread
          conversation={selectedConversation}
          propertyName={PROPERTY_NAME}
          onResolve={canWrite ? handleResolve : undefined}
        />
      ) : null}
    </div>
  );
}
