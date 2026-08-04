import { useState } from "react";
import { allCountries } from 'country-telephone-data';
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  UserPlus,
  Upload,
  Bell,
  Search,
  CalendarDays,
  CalendarIcon,
  Users,
  Send,
  CheckCircle,
  Download,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardAPI, type Guest } from "@/services/api";
import { useProperty } from "@/context/PropertyContext";
import { useWriteAccess } from "@/hooks/useWriteAccess";

const ROOM_TYPE_OPTIONS_BY_PROPERTY: Record<string, string[]> = {
  default: ["Heritage Pool Villa", "Lily Pool Villa", "Lily Pool Bungalow", "Lily Pool Cottage", "Lily Pool Duplex"],
  kabini:  ["Safari Hut", "Pool Hut", "Pool Reserve"],
  hampi:   ["Jal Mahal", "Zenana", "Nilaya", "Nivasa"],
};

const ROOM_TYPE_MAP_BY_PROPERTY: Record<string, Record<string, string>> = {
  default: {
    "LPD": "Lily Pool Duplex",
    "LPC": "Lily Pool Cottage",
    "LPV": "Lily Pool Villa",
    "LPB": "Lily Pool Bungalow",
    "HPV": "Heritage Pool Villa",
  },
  kabini: {
    "SH":  "Safari Hut",
    "PH":  "Pool Hut",
    "PR":  "Pool Reserve",
  },
  hampi: {
    "JM":  "Jal Mahal",
    "ZEN": "Zenana",
    "NIL": "Nilaya",
    "NIV": "Nivasa",
  },
};

const PROPERTY_OPTIONS = [
  { label: "EBRC",  value: "Evolve Back Chikkana Halli Estate, Coorg" },
  { label: "EBRK",  value: "Evolve Back Resort Kabini" },
  { label: "EBRH",  value: "Evolve Back Resort Hampi" },
];

const PROPERTY_GUEST_APP_URL: Record<string, string> = JSON.parse(
  import.meta.env.VITE_PROPERTY_APP_URLS || '{"default":"https://webappcoorg.evolveback.com","kabini":"https://webappkabini.evolveback.com","hampi":"https://webapphampi.evolveback.com"}'
);

const PROPERTY_CODE_MAP: Record<string, string> = {
  "EBRC": "Evolve Back Chikkana Halli Estate, Coorg",
  "EBRK": "Evolve Back Resort Kabini",
  "EBRH": "Evolve Back Resort Hampi",
};

function excelDateToISO(serial: number): string {
  // Excel epoch is Dec 30 1899; convert serial to JS date
  const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
  return format(date, "yyyy-MM-dd");
}

function normalizePhone(raw: string): { mobileNumber: string; countryCode: string } {
  if (!raw) return { mobileNumber: "", countryCode: "+91" };
  // Strip spaces and dashes, keep leading +
  const cleaned = raw.trim().replace(/[\s-]/g, "");
  const sorted = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
  const match = sorted.find((c) => cleaned.startsWith(c.code));
  if (match) {
    return {
      countryCode: match.code,
      mobileNumber: cleaned.substring(match.code.length).replace(/\D/g, ""),
    };
  }
  return { countryCode: "+91", mobileNumber: cleaned.replace(/\D/g, "") };
}

function nameFromEmail(email: string): string {
  if (!email) return "Guest";
  const username = email.split("@")[0];
  return username.charAt(0).toUpperCase() + username.slice(1);
}

const COUNTRY_CODES = allCountries.map(c => ({
  code: `+${c.dialCode}`,
  country: c.name.replace(/\s*\(.*\)\s*$/, '').trim(),
  iso: c.iso2.toUpperCase(),
}));

const emptyFormData = {
  guestName: "",
  bookingId: "",
  propertyName: "",
  email: "",
  countryCode: "+91",
  phoneNumber: "",
  numberOfGuests: "",
  numberOfChildren: "",
  roomType: "",
  checkInDate: undefined as Date | undefined,
  checkOutDate: undefined as Date | undefined,
};

function parsePhone(phoneNumber: string): { mobileNumber: string; countryCode: string } {
  let mobileNumber = "";
  let countryCode = "+91";
  if (phoneNumber) {
    const trimmed = phoneNumber.trim();
    // Sort by code length descending so longer codes match first (e.g. +971 before +9)
    const sorted = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
    const match = sorted.find((c) => trimmed.startsWith(c.code));
    if (match) {
      countryCode = match.code;
      mobileNumber = trimmed.substring(match.code.length).trim();
    } else {
      mobileNumber = trimmed;
    }
  }
  return { mobileNumber, countryCode };
}

type FormData = typeof emptyFormData;

const GuestForm = ({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  submitLabel,
  isPending,
  roomTypeOptions,
}: {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
  isPending?: boolean;
  roomTypeOptions: string[];
}) => {
  const [countryOpen, setCountryOpen] = useState(false);
  const selectedCountry = COUNTRY_CODES.find((c) => c.code === formData.countryCode);

  return (
  <div className="grid gap-4 py-4">
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Primary Guest Name *</Label>
        <Input value={formData.guestName} onChange={(e) => setFormData((prev) => ({ ...prev, guestName: e.target.value }))} placeholder="Enter guest name" />
      </div>
      <div className="space-y-2">
        <Label>Booking ID <span className="text-muted-foreground text-xs">(optional — auto-generated if blank)</span></Label>
        <Input value={formData.bookingId} onChange={(e) => setFormData((prev) => ({ ...prev, bookingId: e.target.value }))} placeholder="e.g. BK-10234" />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Email <span className="text-destructive">*</span></Label>
        <Input value={formData.email} onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))} placeholder="guest@example.com" />
      </div>
      <div className="space-y-2">
        <Label>Phone Number *</Label>
        <div className="flex gap-2">
          <Popover open={countryOpen} onOpenChange={setCountryOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-24 shrink-0 justify-between px-2 font-normal">
                <span className="truncate text-sm">{selectedCountry ? selectedCountry.code : formData.countryCode}</span>
                <span className="text-muted-foreground ml-1">▾</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="start">
              <Command>
                <CommandInput placeholder="Search country..." />
                <CommandList className="max-h-[200px] overflow-y-auto">
                  <CommandEmpty>No country found.</CommandEmpty>
                  <CommandGroup>
                    {COUNTRY_CODES.map((c) => (
                      <CommandItem
                        key={c.code}
                        value={`${c.country} ${c.code} ${c.iso}`}
                        onSelect={() => {
                          setFormData((prev) => ({ ...prev, countryCode: c.code }));
                          setCountryOpen(false);
                        }}
                      >
                        <span className="font-mono text-xs w-10 text-muted-foreground">{c.iso}</span>
                        <span className="flex-1">{c.country}</span>
                        <span className="text-muted-foreground text-sm">{c.code}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <Input className="flex-1 min-w-0" inputMode="numeric" value={formData.phoneNumber} onChange={(e) => { const raw = e.target.value.replace(/[^0-9]/g, ""); setFormData((prev) => ({ ...prev, phoneNumber: raw })); }} placeholder="Phone number" />
        </div>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>No. of Adults *</Label>
        <Input
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="e.g. 2"
          value={formData.numberOfGuests}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9]/g, "");
            setFormData((prev) => ({ ...prev, numberOfGuests: raw }));
          }}
        />
      </div>
      <div className="space-y-2">
        <Label>Children</Label>
        <Input
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="0"
          value={formData.numberOfChildren}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9]/g, "");
            setFormData((prev) => ({ ...prev, numberOfChildren: raw }));
          }}
        />
      </div>
    </div>
    <div className="space-y-2">
      <Label>Room Type *</Label>
      <Select value={formData.roomType} onValueChange={(v) => setFormData((prev) => ({ ...prev, roomType: v }))}>
        <SelectTrigger>
          <SelectValue placeholder="Select room type" />
        </SelectTrigger>
        <SelectContent>
          {roomTypeOptions.map((rt) => (
            <SelectItem key={rt} value={rt}>{rt}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Check-in Date <span className="text-destructive">*</span></Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.checkInDate && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.checkInDate ? format(formData.checkInDate, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={formData.checkInDate} onSelect={(date) => setFormData((prev) => ({ ...prev, checkInDate: date }))} initialFocus className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>
      </div>
      <div className="space-y-2">
        <Label>Check-out Date <span className="text-destructive">*</span></Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.checkOutDate && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.checkOutDate ? format(formData.checkOutDate, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={formData.checkOutDate} onSelect={(date) => setFormData((prev) => ({ ...prev, checkOutDate: date }))} initialFocus disabled={(date) => (formData.checkInDate ? date <= formData.checkInDate : false)} className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>
      </div>
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={onCancel}>Cancel</Button>
      <Button onClick={onSubmit} disabled={isPending}>{isPending ? "Saving..." : submitLabel}</Button>
    </DialogFooter>
  </div>
  );
};

const GuestManagement = () => {
  const { selectedProperty } = useProperty();
  const queryClient = useQueryClient();
  const canWrite = useWriteAccess();
  const roomTypeOptions = ROOM_TYPE_OPTIONS_BY_PROPERTY[selectedProperty.id] ?? ROOM_TYPE_OPTIONS_BY_PROPERTY.default;
  const ROOM_TYPE_MAP   = ROOM_TYPE_MAP_BY_PROPERTY[selectedProperty.id]    ?? ROOM_TYPE_MAP_BY_PROPERTY.default;
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [formData, setFormData] = useState(emptyFormData);
  const [sendDialogGuest, setSendDialogGuest] = useState<Guest | null>(null);
  const [sendChannel, setSendChannel] = useState<"email" | "phone" | "both">("email");
  const [welcomeSentMap, setWelcomeSentMap] = useState<Record<string, "email" | "phone" | "both">>({});
  const [deleteDialogGuest, setDeleteDialogGuest] = useState<Guest | null>(null);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
const { data: allGuests = [], isLoading } = useQuery({
    queryKey: ["guests", selectedProperty.id],
    queryFn: () => dashboardAPI.getAllGuests({ propertyId: selectedProperty.id }),
  });

  const guests = allGuests.filter((g) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return g.fullName?.toLowerCase().includes(s) || g.email?.toLowerCase().includes(s) || g.mobileNumber?.includes(s) || (g as any).bookingId?.toLowerCase().includes(s);
  }).filter((g) => {
    return !g.bookingName || !g.bookingName.includes(" - Co Guest");
  });

  const filteredGuests = guests.filter((g) => {
    const checkInStr = (g as any).arrivalDate
      ? format(new Date((g as any).arrivalDate), "yyyy-MM-dd")
      : "";
    const matchesDate = dateFilter ? checkInStr === format(dateFilter, "yyyy-MM-dd") : true;
    return matchesDate;
  });

  const addGuestMutation = useMutation({
    mutationFn: (payload: Parameters<typeof dashboardAPI.addGuest>[0]) => dashboardAPI.addGuest(payload),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["guests"] });
      setAddDialogOpen(false);
      setFormData(emptyFormData);
      const guestAppUrl = PROPERTY_GUEST_APP_URL[selectedProperty.id] || 'https://webappcoorg.evolveback.com';
      const token = data?.bookingToken ?? "";
      const guestUrl = token ? `${guestAppUrl}?token=${token}` : "";
      toast({
        title: "Guest added successfully",
        description: guestUrl ? (
          <div className="mt-2 space-y-2">
            <p className="text-sm">Guest app link:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 block p-2 bg-muted rounded text-xs break-all">{guestUrl}</code>
              <button
                className="shrink-0 p-2 rounded hover:bg-muted transition-colors"
                onClick={() => {
                  navigator.clipboard.writeText(guestUrl);
                  toast({ title: "Link copied!", duration: 2000 });
                }}
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : undefined,
        duration: guestUrl ? 15000 : 5000,
      });
      const lsqStatus = data?.lsqStatus;
      if (lsqStatus === "pushed") {
        toast({ title: "LeadSquared updated", description: "Lead timeline updated successfully", duration: 5000 });
      } else if (lsqStatus === "not_found") {
        toast({ title: "LeadSquared: lead not found", description: "No matching lead found for this guest's email or phone", variant: "destructive", duration: 7000 });
      } else if (lsqStatus === "failed") {
        toast({ title: "LeadSquared update failed", description: "Could not update lead timeline — check backend logs", variant: "destructive", duration: 7000 });
      }
    },
    onError: (err: any) => {
      toast({ title: "Failed to add guest", description: err?.message || "Please try again", variant: "destructive" });
    },
  });

  const updateGuestMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof dashboardAPI.updateGuest>[1] }) =>
      dashboardAPI.updateGuest(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests"] });
      setEditingGuest(null);
      setFormData(emptyFormData);
      toast({ title: "Guest updated successfully" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to update guest", description: err?.message || "Please try again", variant: "destructive" });
    },
  });

  const deleteGuestMutation = useMutation({
    mutationFn: (id: string) => dashboardAPI.deleteGuest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests"] });
      setDeleteDialogGuest(null);
      toast({ title: "Guest removed" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to delete guest", description: err?.message || "Please try again", variant: "destructive" });
    },
  });

  const bulkImportMutation = useMutation({
    mutationFn: (guestList: Partial<Guest>[]) => dashboardAPI.bulkImportGuests(guestList),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests"] });
      setUploadDialogOpen(false);
      toast({ title: "Guests imported successfully" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to import guests", description: err?.message || "Please try again", variant: "destructive" });
    },
  });

  const handleAddGuest = () => {
    if (!formData.guestName?.trim()) {
      toast({ title: "Please enter the guest's name", variant: "destructive" });
      return;
    }
    if (!formData.phoneNumber?.trim()) {
      toast({ title: "Please enter a phone number", variant: "destructive" });
      return;
    }
    if (!formData.roomType) {
      toast({ title: "Please select a room type", variant: "destructive" });
      return;
    }
    if (!formData.checkInDate) {
      toast({ title: "Please select a check-in date", variant: "destructive" });
      return;
    }
    if (!formData.checkOutDate) {
      toast({ title: "Please select a check-out date", variant: "destructive" });
      return;
    }
    if (!formData.numberOfGuests || parseInt(formData.numberOfGuests) < 1) {
      toast({ title: "Please enter the number of adults", variant: "destructive" });
      return;
    }

    if (formData.email?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        toast({ title: "Please enter a valid email address", variant: "destructive" });
        return;
      }
    }
    const numberOfGuests = parseInt(formData.numberOfGuests);
    addGuestMutation.mutate({
      fullName: formData.guestName.trim(),
      email: formData.email?.trim() || "",
      mobileNumber: formData.phoneNumber || "0",
      countryCode: formData.countryCode,
      numberOfGuests,
      numberOfChildren: parseInt(formData.numberOfChildren) || 0,
      bookingId: formData.bookingId?.trim() || undefined,
      propertyName: selectedProperty.name,
      propertyId: selectedProperty.id,
      roomType: formData.roomType || undefined,
      arrivalDate: formData.checkInDate ? format(formData.checkInDate, "yyyy-MM-dd") : undefined,
      checkoutDate: formData.checkOutDate ? format(formData.checkOutDate, "yyyy-MM-dd") : undefined,
      checkInStatus: "no-id-uploaded",
    } as any);
  };

  const handleEditGuest = () => {
    if (!editingGuest) return;
    const numberOfGuests = parseInt(formData.numberOfGuests) || 1;
    updateGuestMutation.mutate({
      id: editingGuest._id,
      data: {
        fullName: formData.guestName.trim(),
        email: formData.email?.trim() || "",
        mobileNumber: formData.phoneNumber || "0",
        countryCode: formData.countryCode,
        numberOfGuests,
        numberOfChildren: parseInt(formData.numberOfChildren) || 0,
        bookingId: formData.bookingId?.trim() || undefined,
        propertyName: formData.propertyName?.trim() || undefined,
        roomType: formData.roomType || undefined,
        arrivalDate: formData.checkInDate ? format(formData.checkInDate, "yyyy-MM-dd") : undefined,
        checkoutDate: formData.checkOutDate ? format(formData.checkOutDate, "yyyy-MM-dd") : undefined,
      } as any,
    });
  };

  const openEdit = (guest: Guest) => {
    setEditingGuest(guest);
    const g = guest as any;
    setFormData({
      guestName: guest.fullName || "",
      bookingId: g.bookingId || "",
      propertyName: g.propertyName || "",
      email: guest.email || "",
      countryCode: guest.countryCode || "+91",
      phoneNumber: guest.mobileNumber || "",
      numberOfGuests: String(guest.numberOfGuests ?? 1),
      numberOfChildren: String(g.numberOfChildren ?? 0),
      roomType: g.roomType || "",
      checkInDate: g.arrivalDate ? new Date(g.arrivalDate) : undefined,
      checkOutDate: g.checkoutDate ? new Date(g.checkoutDate) : undefined,
    });
  };

  const handleSendWelcome = () => {
    if (!sendDialogGuest) return;
    const channelLabel = sendChannel === "both" ? "Email & Phone" : sendChannel === "email" ? "Email" : "Phone";
    setWelcomeSentMap((prev) => ({ ...prev, [sendDialogGuest._id]: sendChannel }));
    toast({ title: `Welcome message sent to ${sendDialogGuest.fullName} via ${channelLabel}` });
    setSendDialogGuest(null);
    setSendChannel("email");
  };

  const handleSendAllNudges = () => {
    toast({ title: "Send All Nudges", description: "Feature can be wired to backend when available." });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const isXlsx = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");

    const processRows = (rows: any[][], headers: string[]) => {
      const h = headers.map((x) => String(x).toLowerCase().trim());
      // Returns first matching column index across multiple possible substrings
      const col = (...names: string[]) => {
        for (const name of names) {
          const i = h.findIndex((x) => x.includes(name));
          if (i >= 0) return i;
        }
        return -1;
      };

      const firstNameCol = col("first name", "firstname");
      const lastNameCol  = col("last name", "lastname");
      const iCol         = col("property");
      const arrCol       = col("arrival", "check-in", "checkin");
      const depCol       = col("departure", "check-out", "checkout");
      const confCol      = col("confirmation", "booking id", "bookingid");
      const phoneCol     = col("phone");
      const emailCol     = col("email");
      const adultCol     = col("adult");
      const childCol     = col("child");
      const rtCol        = col("room type", "roomtype");

      const list: Partial<Guest>[] = [];

      for (const row of rows) {
        const get = (i: number) => (i >= 0 ? String(row[i] ?? "").trim() : "");

        const email = get(emailCol);
        const phone = get(phoneCol);
        if (!email && !phone) continue;

        const { mobileNumber, countryCode } = normalizePhone(phone);

        const rawProperty = get(iCol);
        const propertyName = PROPERTY_CODE_MAP[rawProperty.toUpperCase()] || rawProperty || undefined;

        const rawRoomType = get(rtCol);
        const roomType = ROOM_TYPE_MAP[rawRoomType.toUpperCase()] || rawRoomType || undefined;

        // Dates: may be Excel serial numbers or strings
        const rawArr = row[arrCol];
        const rawDep = row[depCol];
        const arrivalDate  = rawArr ? (typeof rawArr  === "number" ? excelDateToISO(rawArr)  : String(rawArr).trim())  : undefined;
        const checkoutDate = rawDep ? (typeof rawDep  === "number" ? excelDateToISO(rawDep)  : String(rawDep).trim())  : undefined;

        const firstName = get(firstNameCol);
        const lastName  = get(lastNameCol);
        const fullName  = [firstName, lastName].filter(Boolean).join(" ") || nameFromEmail(email);

        list.push({
          fullName,
          email: email || "",
          mobileNumber: mobileNumber || "0",
          countryCode,
          numberOfGuests: parseInt(get(adultCol)) || 1,
          numberOfChildren: parseInt(get(childCol)) || 0,
          bookingId: get(confCol) || undefined,
          propertyName,
          roomType,
          arrivalDate,
          checkoutDate,
          checkInStatus: "no-id-uploaded",
        } as any);
      }

      if (list.length === 0) {
        toast({ title: "No valid rows to import", variant: "destructive" });
        return;
      }
      bulkImportMutation.mutate(list);
    };

    const reader = new FileReader();

    if (isXlsx) {
      reader.onload = (ev) => {
        const wb = XLSX.read(ev.target?.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as any[][];
        if (rows.length < 2) { toast({ title: "No rows to import", variant: "destructive" }); return; }
        processRows(rows.slice(1), rows[0] as string[]);
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = () => {
        const lines = (reader.result as string).split(/\r?\n/).filter((l) => l.trim());
        if (lines.length < 2) { toast({ title: "No rows to import", variant: "destructive" }); return; }
        const parse = (line: string) => line.split(/,\s*/).map((c) => c.replace(/^"|"$/g, "").trim());
        const headers = parse(lines[0]);
        const rows = lines.slice(1).map(parse);
        processRows(rows, headers);
      };
      reader.readAsText(file);
    }
  };


  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Guest Management</h1>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-24 bg-muted animate-pulse rounded-lg" />
        </div>
        <div className="h-96 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Guest Management</h1>
        <p className="text-muted-foreground">Manage guest bookings and send app access notifications</p>
      </div>

      {canWrite && (
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => { setFormData(emptyFormData); setAddDialogOpen(true); }}>
            <UserPlus className="h-4 w-4" /> Add Guest Manually
          </Button>
          <Button variant="outline" onClick={() => setUploadDialogOpen(true)}>
            <Upload className="h-4 w-4" /> Upload Excel/CSV
          </Button>
        </div>
      )}

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by name, phone, email or booking ID..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[180px] justify-start text-left text-sm font-normal",
                !dateFilter && "text-muted-foreground"
              )}
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              {dateFilter ? format(dateFilter, "MMM d, yyyy") : "Filter by date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateFilter}
              onSelect={setDateFilter}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Primary Guest Name</TableHead>
                <TableHead>Booking ID</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Guests</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGuests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                    No guests found. Add guests manually or upload a CSV file.
                  </TableCell>
                </TableRow>
              ) : (
                filteredGuests.map((guest) => (
                  <TableRow key={guest._id} className="cursor-pointer" onClick={() => setSelectedGuest(guest)}>
                    <TableCell className="font-medium">{guest.fullName}</TableCell>
                    <TableCell className="text-muted-foreground text-sm font-mono">{(guest as any).bookingId || "—"}</TableCell>
                    <TableCell>{guest.email}</TableCell>
                    <TableCell>{[guest.countryCode, guest.mobileNumber].filter(Boolean).join(" ")}</TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-default">{(guest.numberOfGuests ?? 1) + ((guest as any).numberOfChildren ?? 0)}</span>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p className="text-xs">
                              Adults: {guest.numberOfGuests ?? 1}<br />
                              Children: {(guest as any).numberOfChildren ?? 0}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {(guest as any).arrivalDate ? format(new Date((guest as any).arrivalDate), "dd MMM yyyy") : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {(guest as any).checkoutDate ? format(new Date((guest as any).checkoutDate), "dd MMM yyyy") : "—"}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canWrite && <DropdownMenuItem onClick={() => openEdit(guest)}><Edit className="h-4 w-4 mr-2" /> Edit Booking</DropdownMenuItem>}
                          <DropdownMenuItem onClick={() => {
                            const token = guest.bookingToken;
                            if (!token) {
                              toast({ title: "No booking token found for this guest", variant: "destructive", duration: 3000 });
                              return;
                            }
                            const guestAppUrl = PROPERTY_GUEST_APP_URL[selectedProperty.id] || 'https://webappcoorg.evolveback.com';
                            const link = `${guestAppUrl}?token=${token}`;
                            navigator.clipboard.writeText(link);
                            toast({ title: "Web app link copied!", duration: 2000 });
                          }}><Copy className="h-4 w-4 mr-2" /> Copy Web App Link</DropdownMenuItem>
                          {canWrite && <DropdownMenuItem className="text-destructive" onClick={() => setDeleteDialogGuest(guest)}><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>Add New Guest</DialogTitle></DialogHeader>
          <GuestForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleAddGuest}
            onCancel={() => { setAddDialogOpen(false); setFormData(emptyFormData); }}
            submitLabel="Add Guest"
            isPending={addGuestMutation.isPending}
            roomTypeOptions={roomTypeOptions}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingGuest} onOpenChange={(open) => { if (!open) setEditingGuest(null); }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>Edit Guest</DialogTitle></DialogHeader>
          <GuestForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleEditGuest}
            onCancel={() => setEditingGuest(null)}
            submitLabel="Save Changes"
            isPending={updateGuestMutation.isPending}
            roomTypeOptions={roomTypeOptions}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!sendDialogGuest} onOpenChange={(open) => { if (!open) setSendDialogGuest(null); }}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader><DialogTitle>Send Welcome Message</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Send check-in link to <span className="font-medium text-foreground">{sendDialogGuest?.fullName}</span>
          </p>
          <RadioGroup value={sendChannel} onValueChange={(v) => setSendChannel(v as "email" | "phone" | "both")} className="gap-3 py-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="email" id="ch-email" />
              <Label htmlFor="ch-email">Email</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="phone" id="ch-phone" />
              <Label htmlFor="ch-phone">Phone (SMS)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="both" id="ch-both" />
              <Label htmlFor="ch-both">Both</Label>
            </div>
          </RadioGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialogGuest(null)}>Cancel</Button>
            <Button onClick={handleSendWelcome}><Send className="h-4 w-4 mr-1" /> Send</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteDialogGuest} onOpenChange={(open) => { if (!open) setDeleteDialogGuest(null); }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle>Delete Guest</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Remove <span className="font-medium text-foreground">{deleteDialogGuest?.fullName}</span>? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogGuest(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteDialogGuest && deleteGuestMutation.mutate(deleteDialogGuest._id)} disabled={deleteGuestMutation.isPending}>
              {deleteGuestMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader><DialogTitle>Upload Excel/CSV</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Upload the Lume Report (.xlsx) or a .csv file. Supported columns: Property, Arrival Date, Departure Date, Confirmation Number, Phone, Email, Adults, Child, Room Type.
            </p>
            <Input type="file" accept=".xlsx,.xls,.csv,.txt" onChange={handleFileUpload} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Guest Preview Dialog */}
      <Dialog open={!!selectedGuest} onOpenChange={(open) => { if (!open) setSelectedGuest(null); }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedGuest?.fullName}</DialogTitle>
          </DialogHeader>
          {selectedGuest && (
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 py-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Booking ID</p>
                <p className="text-sm font-medium">{(selectedGuest as any).bookingId || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{selectedGuest.email || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm font-medium">{[selectedGuest.countryCode, selectedGuest.mobileNumber].filter(Boolean).join(" ") || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Room Type</p>
                <p className="text-sm font-medium">{(selectedGuest as any).roomType || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Room Number</p>
                <p className="text-sm font-medium">{selectedGuest.roomNumber || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">No. of Adults</p>
                <p className="text-sm font-medium">{selectedGuest.numberOfGuests ?? 1}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Children</p>
                <p className="text-sm font-medium">{(selectedGuest as any).numberOfChildren ?? 0}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Property Name</p>
                <p className="text-sm font-medium">{(selectedGuest as any).propertyName || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Check-in</p>
                <p className="text-sm font-medium">{(selectedGuest as any).arrivalDate ? format(new Date((selectedGuest as any).arrivalDate), "dd MMM yyyy") : "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Check-out</p>
                <p className="text-sm font-medium">{(selectedGuest as any).checkoutDate ? format(new Date((selectedGuest as any).checkoutDate), "dd MMM yyyy") : "—"}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              const token = selectedGuest?.bookingToken;
              if (!token) {
                toast({ title: "No booking token found", variant: "destructive", duration: 3000 });
                return;
              }
              const guestAppUrl = PROPERTY_GUEST_APP_URL[selectedProperty.id] || 'https://webappcoorg.evolveback.com';
              navigator.clipboard.writeText(`${guestAppUrl}?token=${token}`);
              toast({ title: "Web app link copied!", duration: 2000 });
            }}>
              <Copy className="h-4 w-4 mr-2" /> Copy Web App Link
            </Button>
            <Button onClick={() => {
              if (selectedGuest) {
                openEdit(selectedGuest);
                setSelectedGuest(null);
              }
            }}>
              <Edit className="h-4 w-4 mr-2" /> Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GuestManagement;
