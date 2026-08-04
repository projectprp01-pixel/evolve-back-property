import { useState } from "react";
import { useProperty } from "@/context/PropertyContext";
import { CheckCircle, AlertCircle, Clock, FileText, UserCheck, XCircle, Search, Eye, Download, MessageSquare } from "lucide-react";
import { format, isToday, isTomorrow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardAPI, Booking, CheckIn } from "@/services/api";
import { useWriteAccess } from "@/hooks/useWriteAccess";

export default function Checkin() {
  const { selectedProperty } = useProperty();
  const canWrite = useWriteAccess();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectCheckInId, setRejectCheckInId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [docsCheckIn, setDocsCheckIn] = useState<CheckIn | null>(null);
  const [guestSearch, setGuestSearch] = useState("");

  const statusColors: Record<string, string> = {
    "Not Done": "bg-gray-100 text-gray-800 hover:bg-gray-200",
    "Approval Pending": "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
    "Approved": "bg-green-100 text-green-800 hover:bg-green-200",
    "Rejected": "bg-red-100 text-red-800 hover:bg-red-200"
  };

  const getCheckinStatus = (status: string) => {
    switch (status) {
      case "pending": return "Not Done";
      case "in-progress": return "Approval Pending";
      case "submitted": return "Approval Pending";
      case "approved": return "Approved";
      case "rejected": return "Rejected";
      default: return "Not Done";
    }
  };

  // Fetch daily arrivals for selected date
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const { data: arrivalsRaw = [], isLoading: arrivalsLoading } = useQuery({
    queryKey: ['arrivals', selectedDateStr, selectedProperty.id],
    queryFn: () => dashboardAPI.getDailyArrivals(selectedDateStr, selectedProperty.id),
  });

  const arrivals = arrivalsRaw;

  // Fetch submitted check-ins
  const { data: submittedRaw = [], isLoading: submittedLoading } = useQuery({
    queryKey: ['submittedCheckIns', selectedProperty.id],
    queryFn: () => dashboardAPI.getSubmittedCheckIns(selectedProperty.id),
  });

  const submittedCheckIns = submittedRaw;

  // Mutation for reviewing a check-in
  const reviewMutation = useMutation({
    mutationFn: ({ checkInId, approvalStatus, reviewNotes }: {
      checkInId: string;
      approvalStatus: 'approved' | 'rejected' | 'needs-resubmission';
      reviewNotes?: string;
    }) => dashboardAPI.reviewCheckIn(checkInId, { approvalStatus, reviewNotes, staffId: 'staff' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submittedCheckIns'] });
      queryClient.invalidateQueries({ queryKey: ['arrivals'] });
    },
  });

  const handleApprove = (checkInId: string, displayId: string) => {
    reviewMutation.mutate(
      { checkInId, approvalStatus: 'approved' },
      {
        onSuccess: () => toast.success(`Check-in approved for ${displayId}`),
        onError: (err: any) => toast.error(err.message || 'Failed to approve check-in'),
      }
    );
  };

  const openRejectDialog = (checkInId: string) => {
    setRejectCheckInId(checkInId);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    if (!rejectCheckInId) return;

    const checkIn = (submittedCheckIns as CheckIn[]).find(ci => ci._id === rejectCheckInId);
    const guestId = checkIn?.guestId?._id ?? checkIn?.guestId ?? null;

    reviewMutation.mutate(
      { checkInId: rejectCheckInId, approvalStatus: 'rejected', reviewNotes: rejectReason },
      {
        onSuccess: () => {
          toast.success("Check-in rejected");
          setRejectDialogOpen(false);
          setRejectCheckInId(null);
          setRejectReason("");
          if (guestId) {
            dashboardAPI.createGuestNotification({
              guestId,
              title: 'Check-in Requires Attention',
              message: `Your online check-in could not be approved. Reason: ${rejectReason}. Please visit the front desk for assistance.`,
              type: 'warning',
              relatedId: rejectCheckInId,
              relatedType: 'check-in',
            }).catch(() => {});
          }
        },
        onError: (err: any) => toast.error(err.message || 'Failed to reject check-in'),
      }
    );
  };

  const downloadImage = async (url: string, filename: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch {
      window.open(url, '_blank');
    }
  };

  const getFilteredArrivals = () => {
    return (arrivals as Booking[]).filter(a => {
      if (!guestSearch.trim()) return true;
      return a.primaryGuestName?.toLowerCase().includes(guestSearch.toLowerCase());
    });
  };

const getCompletionRate = () => {
    const all = arrivals as Booking[];
    const completed = all.filter(a => a.checkInStatus === 'approved').length;
    return all.length > 0 ? Math.round(completed / all.length * 100) : 0;
  };

  const getDateLabel = () => {
    if (isToday(selectedDate)) return "Today";
    if (isTomorrow(selectedDate)) return "Tomorrow";
    return format(selectedDate, "MMM d, yyyy");
  };

  // Build a lookup from bookingId to submitted check-in data
  const checkInByBookingId = (submittedCheckIns as CheckIn[]).reduce((acc, ci) => {
    const bId = (ci as any).bookingId || ci.bookingData?.bookingId;
    if (bId) acc[bId] = ci;
    return acc;
  }, {} as Record<string, CheckIn>);

  const filteredArrivals = getFilteredArrivals();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Check-in Hub</h1>
          <p className="text-muted-foreground">Manage guest arrivals and document verification</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{getDateLabel()} Arrivals</p>
                <p className="text-xl font-semibold">{(arrivals as Booking[]).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">Approval Pending</p>
                <p className="text-xl font-semibold text-yellow-600">
                  {(arrivals as Booking[]).filter(a => ['in-progress', 'submitted'].includes(a.checkInStatus)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-xl font-semibold text-green-600">
                  {(arrivals as Booking[]).filter(a => a.checkInStatus === 'approved').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-xl font-semibold text-red-600">
                  {(arrivals as Booking[]).filter(a => a.checkInStatus === 'rejected').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Date Filter + Search */}
      <div className="flex flex-wrap items-center gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-[240px] justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={selectedDate} onSelect={date => date && setSelectedDate(date)} initialFocus className={cn("p-3 pointer-events-auto")} />
          </PopoverContent>
        </Popover>
        <div className="relative w-64">
          <Input
            placeholder="Search guest name..."
            value={guestSearch}
            onChange={(e) => setGuestSearch(e.target.value)}
            className="pl-9"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Arrivals — {getDateLabel()} ({format(selectedDate, "EEE")})</CardTitle>
        </CardHeader>
        <CardContent>
          {arrivalsLoading ? (
            <p className="text-center py-8 text-muted-foreground">Loading arrivals...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">Primary Guest Name</TableHead>
                  <TableHead className="text-center">Guests</TableHead>
                  <TableHead className="text-center">Booking ID</TableHead>
                  <TableHead className="text-center">Room Type</TableHead>
                  <TableHead className="text-center">Online Check-in Status</TableHead>
                  <TableHead className="text-center">Documents</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredArrivals.map(arrival => {
                  const matchedCheckIn = checkInByBookingId[arrival.bookingId];
                  const docsUploaded = matchedCheckIn?.guestDocuments?.length || matchedCheckIn?.documentsCompleted || 0;
                  const totalDocs = matchedCheckIn?.totalGuests || arrival.numberOfGuests || 1;
                  const hasCheckIn = !!matchedCheckIn;
                  const isPending = matchedCheckIn && !['approved', 'rejected'].includes(matchedCheckIn.approvalStatus || '');

                  return (
                    <TableRow key={arrival._id}>
                      <TableCell className="text-center font-medium">{arrival.primaryGuestName}</TableCell>
                      <TableCell className="text-center font-medium">{arrival.numberOfGuests}</TableCell>
                      <TableCell className="text-center">{arrival.bookingId}</TableCell>
                      <TableCell className="text-center">{arrival.roomType}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={`min-w-[110px] inline-flex justify-center ${statusColors[getCheckinStatus(arrival.checkInStatus) as keyof typeof statusColors]}`}>
                          {getCheckinStatus(arrival.checkInStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {hasCheckIn ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="flex items-center gap-1">
                              <FileText className={`h-4 w-4 ${docsUploaded > 0 ? "text-green-600" : "text-red-600"}`} />
                              <span className="text-xs">{docsUploaded}/{totalDocs}</span>
                            </div>
                            {docsUploaded > 0 && (
                              <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={() => setDocsCheckIn(matchedCheckIn)}>
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            )}
                            {matchedCheckIn.guestNotes && (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50" title="Guest notes">
                                    <MessageSquare className="h-4 w-4" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-72 p-3" side="left">
                                  <p className="text-xs font-semibold text-muted-foreground mb-1">Guest Instructions</p>
                                  <p className="text-sm whitespace-pre-wrap">{matchedCheckIn.guestNotes}</p>
                                </PopoverContent>
                              </Popover>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">No submission</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {matchedCheckIn?.approvalStatus === 'approved' ? (
                          <Badge className="min-w-[90px] inline-flex justify-center bg-green-100 text-green-800 border-green-200">
                            <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approved
                          </Badge>
                        ) : matchedCheckIn?.approvalStatus === 'rejected' ? (
                          <div className="flex items-center justify-center gap-1">
                            <Badge className="min-w-[90px] inline-flex justify-center bg-red-100 text-red-800 border-red-200">
                              <XCircle className="h-3.5 w-3.5 mr-1" /> Rejected
                            </Badge>
                            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => openRejectDialog(matchedCheckIn._id)}>
                              Re-review
                            </Button>
                          </div>
                        ) : isPending && canWrite ? (
                          <div className="flex items-center justify-center gap-1">
                            <Button size="sm" className="bg-accent hover:bg-accent/90 h-7 px-2 text-xs" onClick={() => handleApprove(matchedCheckIn._id, arrival.bookingId)} disabled={reviewMutation.isPending}>
                              <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
                            </Button>
                            <Button size="sm" variant="destructive" className="h-7 px-2 text-xs" onClick={() => openRejectDialog(matchedCheckIn._id)} disabled={reviewMutation.isPending}>
                              <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                            </Button>
                          </div>
                        ) : isPending ? (
                          <Badge className="min-w-[90px] inline-flex justify-center bg-amber-100 text-amber-800 border-amber-200">
                            <Clock className="h-3.5 w-3.5 mr-1" /> Pending
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredArrivals.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No arrivals found for {getDateLabel()}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Document Viewer Dialog */}
      <Dialog open={!!docsCheckIn} onOpenChange={(open) => { if (!open) setDocsCheckIn(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Uploaded ID Documents — {docsCheckIn?.bookingData?.primaryGuestName || docsCheckIn?.guestId?.fullName || 'Guest'}
            </DialogTitle>
            <DialogDescription>
              {docsCheckIn?.guestDocuments?.length || 0} document set(s) uploaded
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-2">
            {docsCheckIn?.guestDocuments?.map((doc, i) => (
              <div key={i} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">
                    Guest {doc.guestNumber}{doc.guestName ? ` — ${doc.guestName}` : ''}
                  </p>
                  <span className="text-xs text-muted-foreground capitalize">{doc.idType?.replace('-', ' ')}</span>
                </div>
                <div className="space-y-1">
                  {doc.idFrontUrl ? (
                    <>
                      {doc.idFrontUrl.toLowerCase().endsWith('.pdf') || doc.idFrontUrl.toLowerCase().includes('/pdf') ? (
                        <a href={doc.idFrontUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 rounded border bg-muted hover:bg-muted/80 transition-colors">
                          <FileText className="h-8 w-8 text-muted-foreground shrink-0" />
                          <span className="text-sm text-muted-foreground">PDF Document — click to open</span>
                        </a>
                      ) : (
                        <a href={doc.idFrontUrl} target="_blank" rel="noreferrer">
                          <img src={doc.idFrontUrl} alt="ID Document" className="w-full h-64 object-cover rounded border hover:opacity-90 transition-opacity" />
                        </a>
                      )}
                      <button
                        onClick={() => downloadImage(doc.idFrontUrl, `${doc.guestName || 'guest'}-id.jpg`)}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-1"
                      >
                        <Download className="h-3 w-3" /> Download
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-64 rounded border bg-muted flex items-center justify-center text-xs text-muted-foreground">Not uploaded</div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Uploaded {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleString('en-IN') : 'N/A'}
                </p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Reason Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Check-in</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this check-in. This will be shared with the guest.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="reject-reason">Rejection Reason</Label>
            <Textarea
              id="reject-reason"
              placeholder="e.g. ID document is expired, photo is unclear..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              maxLength={300}
              rows={4}
            />
            <p className="text-xs text-muted-foreground text-right">{rejectReason.length}/300</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmReject} disabled={!rejectReason.trim() || reviewMutation.isPending}>
              <XCircle className="h-4 w-4 mr-1" />
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
