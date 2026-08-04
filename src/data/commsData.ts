// Guest Request Data Model

export type RequestStatus = "open" | "replied" | "resolved";

export interface RequestReply {
  id: string;
  body: string;
  sentAt: string;
  sentBy: string;
}

export interface GuestRequest {
  id: string;
  guestName: string;
  guestEmail: string;
  roomNumber: string;
  bookingId: string;
  message: string;
  timestamp: string;
  status: RequestStatus;
  replies: RequestReply[];
}

export interface GuestConversation {
  guestEmail: string;      // unique key (falls back to guestName if email empty)
  guestName: string;
  bookingId: string;
  roomNumber: string;
  requests: GuestRequest[]; // sorted oldest → newest
  latestTimestamp: string;
  status: RequestStatus;    // "resolved" only if ALL requests are resolved
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export function getRelativeTime(ts: string): string {
  return timeAgo(ts);
}
