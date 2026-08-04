import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import ActivityEditor from "@/components/activities/ActivityEditor";
import type { ActivityData } from "@/components/activities/ActivityEditor";
import AddLinkedListingDialog from "@/components/activities/AddLinkedListingDialog";
import { initialActivityData } from "@/components/activities/ActivityEditor";
import ActivityList from "@/components/activities/ActivityList";
import { dashboardAPI, Experience } from "@/services/api";
import { useProperty } from "@/context/PropertyContext";
import { useWriteAccess } from "@/hooks/useWriteAccess";

export interface ActivityBooking {
  id: string;
  guestName: string;
  roomNumber: string;
  activityId: string;
  activityTitle: string;
  date: string;
  time: string;
  adults: number;
  children: number;
  totalAmount: number;
  currency: string;
  status: "Confirmed" | "Pending" | "Cancelled";
  mainStayBookingId?: string;
}

// Map backend Experience → frontend ActivityData
function experienceToActivity(exp: Experience): ActivityData {
  const durationVal = exp.duration?.value ?? 60;
  const durationUnit = exp.duration?.unit ?? 'minutes';
  const durationInMin = durationUnit === 'hours' ? durationVal * 60 : durationVal;

  let days = [true, true, true, true, true, true, true];
  if (exp.availability === 'specific-days' && exp.specificDays?.length) {
    // Dashboard convention: index 0=Mon…6=Sun; specificDays stores these dashboard indices
    days = [0,1,2,3,4,5,6].map(d => exp.specificDays!.includes(d));
  }

  const times = exp.timeSlots?.map(ts => ts.time) ?? [];
  const timeSlotLabels: Record<string, string> = {};
  exp.timeSlots?.forEach(ts => {
    if ((ts as any).label) {
      timeSlotLabels[ts.time] = (ts as any).label;
    }
  });

  // Convert legacy time slots to new TimeSlotEntry format
  const timeSlotEntries: import("@/components/activities/ActivityEditor").TimeSlotEntry[] =
    exp.timeSlots?.map((ts, i) => {
      const [h, m] = ts.time.split(':');
      const endTime = (ts as any).endTime;
      const [eh, em] = endTime ? endTime.split(':') : [String(parseInt(h) + 1).padStart(2, '0'), m];
      return {
        id: String(i),
        label: (ts as any).label ?? '',
        startHour: h ?? '09',
        startMin: m ?? '00',
        endHour: eh ?? '10',
        endMin: em ?? '00',
      };
    }) ?? [];

  const adultPrice = exp.pricing?.basePrice ?? 0;

  return {
    id: exp._id,
    title: exp.title,
    subtitle: exp.shortDescription ?? '',
    description: exp.fullDescription ?? '',
    primaryImage: exp.imageUrl ?? '',
    isActive: exp.isActive,
    groupSizeMin: exp.groupSize?.min ?? 1,
    groupSizeMax: exp.groupSize?.max ?? 10,
    guestCanChooseGroupSize: (exp as any).guestCanChooseGroupSize ?? true,
    capacityUnit: (exp as any).capacityUnit ?? '',
    propertyScheduled: (exp as any).propertyScheduled ?? false,
    days,
    timeSlots: timeSlotEntries,
    cutoff: exp.advanceBookingRequired?.unit === 'hours'
      ? (exp.advanceBookingRequired?.value ?? 1) * 60
      : exp.advanceBookingRequired?.value ?? 60,
    blackoutDates: (exp as any).blackoutDates ?? [],
    slotsPerSession: (exp as any).slotsPerSession ?? 4,
    bookingsPerDay: (exp as any).bookingsPerDay ?? 10,
    complimentary: adultPrice === 0,
    pricingModel: exp.pricing?.pricePerPerson ? 'Per person' : 'Per group',
    currency: exp.pricing?.currency ?? 'INR',
    adultPrice,
    pricingLabel: (exp as any).pricingLabel ?? '',
    durationDisplayText: (exp as any).durationDisplayText ?? '',
    peopleAccommodatedMin: exp.groupSize?.min ?? 1,
    peopleAccommodatedMax: exp.groupSize?.max ?? 1,
    type: (exp as any).type ?? 'activity',
    ctaLabel: (exp as any).ctaLabel ?? 'Book Now',
    redirectPath: (exp as any).redirectPath ?? '',
    status: exp.isActive ? 'Published' : 'Draft',
    // Legacy fields
    summary: exp.shortDescription ?? '',
    overview: exp.fullDescription ?? '',
    noteDisclaimer: (exp as any).noteDisclaimer ?? '',
    categories: exp.category ? [exp.category] : [],
    durationMin: durationInMin,
    durationMax: durationInMin,
    difficulty: 'Easy',
    meetingPoint: exp.location?.name ?? '',
    imageAlt: exp.title,
    included: exp.inclusions ?? [],
    excluded: exp.exclusions ?? [],
    times,
    timeSlotLabels,
    buffer: 15,
    taxInclusive: true,
    childPrice: 0,
    childAgeRange: '',
    guestNote: '',
  };
}

// Map frontend ActivityData → backend Experience payload
function activityToExperience(activity: ActivityData, propertyId: string): Partial<Experience> {
  const specificDays = activity.days
    .map((enabled, idx) => enabled ? idx : -1)
    .filter(d => d >= 0);

  const allDays = specificDays.length === 7;
  const availability = allDays ? 'daily' : 'specific-days';

  return {
    propertyId,
    title: activity.title,
    shortDescription: activity.subtitle || activity.summary,
    fullDescription: activity.description || activity.overview,
    category: activity.categories[0] ?? 'General',
    imageUrl: activity.primaryImage,
    inclusions: activity.included,
    exclusions: activity.excluded,
    duration: { value: activity.durationMin, unit: 'minutes' },
    location: { name: activity.meetingPoint },
    pricing: {
      basePrice: activity.complimentary ? 0 : activity.adultPrice,
      currency: activity.currency,
      pricePerPerson: activity.pricingModel === 'Per person',
    },
    groupSize: {
      min: activity.groupSizeMin,
      max: activity.groupSizeMax,
    },
    timeSlots: (activity.timeSlots ?? []).map(ts => ({
      time: `${ts.startHour}:${ts.startMin}`,
      endTime: `${ts.endHour}:${ts.endMin}`,
      capacity: activity.slotsPerSession,
      available: activity.slotsPerSession,
      ...(ts.label ? { label: ts.label } : {}),
    } as any)),
    availability,
    specificDays: allDays ? [] : specificDays,
    advanceBookingRequired: { value: Math.ceil(activity.cutoff / 60), unit: 'hours' },
    isActive: activity.status === 'Published' && activity.isActive,
    isFeatured: false,
    isSpotlight: false,
    isCrafted: false,
    // Extended fields
    ...(({
      durationDisplayText: activity.durationDisplayText,
      guestCanChooseGroupSize: activity.guestCanChooseGroupSize,
      capacityUnit: activity.capacityUnit,
      pricingLabel: activity.pricingLabel,
      blackoutDates: activity.blackoutDates,
      slotsPerSession: activity.slotsPerSession,
      bookingsPerDay: activity.bookingsPerDay,
      propertyScheduled: activity.propertyScheduled,
      peopleAccommodatedMin: activity.peopleAccommodatedMin,
      peopleAccommodatedMax: activity.peopleAccommodatedMax,
    }) as any),
  };
}
function mapBooking(b: any): ActivityBooking {
  const statusMap: Record<string, ActivityBooking['status']> = {
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
    completed: 'Confirmed',
    'no-show': 'Cancelled',
  };
  return {
    id: b._id ?? b.bookingId,
    guestName: b.guestName ?? b.guestId?.fullName ?? 'Unknown',
    roomNumber: b.mainBookingId?.roomNumber ?? '',
    activityId: b.experienceId?._id ?? b.experienceId ?? '',
    activityTitle: b.experienceName ?? b.experienceId?.title ?? 'Unknown',
    date: b.date ? new Date(b.date).toISOString().split('T')[0] : '',
    time: b.timeSlot ?? '',
    adults: b.numberOfGuests ?? 1,
    children: 0,
    totalAmount: b.totalAmount ?? 0,
    currency: b.currency ?? 'INR',
    status: statusMap[b.bookingStatus] ?? 'Confirmed',
    mainStayBookingId: b.mainStayBookingId ?? undefined,
  };
}

export default function Activities() {
  const { selectedProperty } = useProperty();
  const canWrite = useWriteAccess();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [currentView, setCurrentView] = useState<'list' | 'editor'>('list');
  const [editingActivity, setEditingActivity] = useState<ActivityData | null>(null);
  const [linkedDialogOpen, setLinkedDialogOpen] = useState(false);
  const [editingLinked, setEditingLinked] = useState<ActivityData | null>(null);
  const [activeTab, setActiveTab] = useState<'activities' | 'bookings'>(
    searchParams.get('tab') === 'bookings' ? 'bookings' : 'activities'
  );

  useEffect(() => {
    if (searchParams.get('tab') === 'bookings') {
      setActiveTab('bookings');
    }
  }, [searchParams]);

  const { data: experiences = [], isLoading: experiencesLoading, isFetching: experiencesFetching, refetch: refetchExperiences } = useQuery({
    queryKey: ['experiences', selectedProperty.id],
    queryFn: () => dashboardAPI.getAllExperiences(selectedProperty.id),
    staleTime: 5 * 60_000,
  });

  // Prefetch so Add Banner / Link Listing dialogs open instantly
  useQuery({ queryKey: ['dashboard-spa', selectedProperty.id], queryFn: () => dashboardAPI.getAllSpaFacilities(selectedProperty.id), staleTime: 5 * 60_000 });
  useQuery({ queryKey: ['dashboard-restaurants', selectedProperty.id], queryFn: () => dashboardAPI.getAllRestaurants(selectedProperty.id), staleTime: 5 * 60_000 });

  const { data: rawBookings = [] } = useQuery({
    queryKey: ['experienceBookings', selectedProperty.id],
    queryFn: () => dashboardAPI.getExperienceBookings({ propertyId: selectedProperty.id }),
    staleTime: 30_000,
    enabled: activeTab === 'bookings',
  });

  const apiActivities: ActivityData[] = (experiences as Experience[]).map(experienceToActivity);

  const activities: ActivityData[] = apiActivities;
  const mappedBookings = (rawBookings as any[]).map(mapBooking);
  const bookings: ActivityBooking[] = mappedBookings;

  const createMutation = useMutation({
    mutationFn: (data: Partial<Experience>) => dashboardAPI.createExperience(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
      toast.success("Activity created successfully!");
    },
    onError: (err: any) => toast.error(err.message || 'Failed to create activity'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Experience> }) =>
      dashboardAPI.updateExperience(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
      toast.success("Activity updated successfully!");
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update activity'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => dashboardAPI.deleteExperience(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
      toast.success("Activity deleted");
    },
    onError: (err: any) => toast.error(err.message || 'Failed to delete activity'),
  });

  const handleAddNew = () => {
    setEditingActivity(null);
    setCurrentView('editor');
  };

  const handleEdit = (activity: ActivityData) => {
    setEditingActivity(activity);
    setCurrentView('editor');
  };

  const handleBack = () => {
    setCurrentView('list');
    setEditingActivity(null);
  };

  const handleSave = async (activityData: ActivityData) => {
    let imageUrl = activityData.primaryImage;

    // If image is a base64 data URL, upload to Cloudinary first
    if (imageUrl?.startsWith('data:')) {
      try {
        const blob = await fetch(imageUrl).then(r => r.blob());
        const file = new File([blob], 'activity-image.jpg', { type: blob.type });
        const result = await dashboardAPI.uploadExperienceImage(file);
        imageUrl = result.imageUrl;
      } catch {
        toast.error('Failed to upload image. Please try again.');
        return;
      }
    }

    const payload = activityToExperience({ ...activityData, primaryImage: imageUrl }, selectedProperty.id);
    if (editingActivity) {
      updateMutation.mutate({ id: editingActivity.id!, data: payload }, {
        onSuccess: () => setCurrentView('list'),
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => setCurrentView('list'),
      });
    }
  };

  const handleDuplicate = (activity: ActivityData) => {
    // Strip base64 images from duplicates — user can re-upload
    const payload = activityToExperience({
      ...activity,
      title: `${activity.title} (Copy)`,
      status: 'Draft',
      isActive: false,
      primaryImage: activity.primaryImage?.startsWith('data:') ? '' : activity.primaryImage,
    }, selectedProperty.id);
    createMutation.mutate(payload);
  };

  const handleToggleActive = (activityId: string, isActive: boolean) => {
    updateMutation.mutate({ id: activityId, data: { isActive } });
  };

  const handleDelete = (activityId: string) => {
    deleteMutation.mutate(activityId);
  };

  const handleScheduleOff = (activityId: string, dates: Date[]) => {
    toast.info("Blackout dates saved locally");
  };

  const cancelBookingMutation = useMutation({
    mutationFn: (bookingId: string) => dashboardAPI.cancelExperienceBooking(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experienceBookings'] });
      toast.success("Booking cancelled");
    },
    onError: () => toast.error("Failed to cancel booking"),
  });

  const createBookingMutation = useMutation({
    mutationFn: (data: Parameters<typeof dashboardAPI.createManualBooking>[0]) =>
      dashboardAPI.createManualBooking(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experienceBookings'] });
      toast.success("Booking created");
    },
    onError: () => toast.error("Failed to create booking"),
  });

  const handleUpdateBookingStatus = (bookingId: string, status: ActivityBooking['status']) => {
    if (status === 'Cancelled') {
      cancelBookingMutation.mutate(bookingId);
    }
  };

  const handleSaveLinked = (data: ActivityData) => {
    const payload = {
      ...activityToExperience(data, selectedProperty.id),
      type: 'linked',
      ctaLabel: (data as any).ctaLabel || 'Book Now',
      redirectPath: (data as any).redirectPath || '',
    } as any;
    const isExisting = data.id && !data.id.startsWith('linked-');
    if (isExisting) {
      updateMutation.mutate({ id: data.id!, data: payload }, {
        onSuccess: () => { setLinkedDialogOpen(false); setEditingLinked(null); }
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => { setLinkedDialogOpen(false); setEditingLinked(null); }
      });
    }
  };

  if (currentView === 'editor') {
    return (
      <ActivityEditor
        activityData={editingActivity || undefined}
        onBack={handleBack}
        onSave={handleSave}
        isSaving={createMutation.isPending || updateMutation.isPending} />
    );
  }

  return (
    <>
      <ActivityList
        activities={activities}
        onAddNew={canWrite ? handleAddNew : undefined}
        onAddLinked={canWrite ? () => { setEditingLinked(null); setLinkedDialogOpen(true); } : undefined}
        onEdit={canWrite ? handleEdit : undefined}
        onEditLinked={canWrite ? (a) => { setEditingLinked(a); setLinkedDialogOpen(true); } : undefined}
        onDuplicate={canWrite ? handleDuplicate : undefined}
        onDelete={canWrite ? handleDelete : undefined}
        onToggleActive={canWrite ? handleToggleActive : undefined}
        onScheduleOff={canWrite ? handleScheduleOff : undefined}
        bookings={bookings}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onUpdateBookingStatus={canWrite ? handleUpdateBookingStatus : undefined}
        onAddBooking={canWrite ? (data) => createBookingMutation.mutate(data) : undefined}
        isLoading={experiencesLoading || experiencesFetching}
        isUpdating={updateMutation.isPending || createMutation.isPending}
        isDeleting={deleteMutation.isPending}
        onRefresh={() => refetchExperiences()} />
      <AddLinkedListingDialog
        open={linkedDialogOpen}
        onOpenChange={setLinkedDialogOpen}
        onSave={handleSaveLinked}
        editData={editingLinked} />
    </>
  );
}
