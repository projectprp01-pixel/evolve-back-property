import { Users, Calendar, Activity, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { StatCard } from "@/components/ui/StatCard";
import { DataTable, StatusBadge } from "@/components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { dashboardAPI, Booking } from "@/services/api";
import { useProperty } from "@/context/PropertyContext";

const todayStr = format(new Date(), 'yyyy-MM-dd');
const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');

export default function Home() {
  const { selectedProperty } = useProperty();
  const navigate = useNavigate();

  const { data: apiArrivals = [], isLoading: arrivalsLoading } = useQuery({
    queryKey: ['arrivals', todayStr, selectedProperty.id],
    queryFn: () => dashboardAPI.getDailyArrivals(todayStr, selectedProperty.id),
  });

  const { data: prevArrivals = [] } = useQuery({
    queryKey: ['arrivals', yesterdayStr, selectedProperty.id],
    queryFn: () => dashboardAPI.getDailyArrivals(yesterdayStr, selectedProperty.id),
  });

  const { data: analytics } = useQuery({
    queryKey: ['analytics', todayStr, selectedProperty.id],
    queryFn: () => dashboardAPI.getAnalytics({ propertyId: selectedProperty.id, startDate: todayStr, endDate: todayStr }),
  });

  const { data: prevAnalytics } = useQuery({
    queryKey: ['analytics', yesterdayStr, selectedProperty.id],
    queryFn: () => dashboardAPI.getAnalytics({ propertyId: selectedProperty.id, startDate: yesterdayStr, endDate: yesterdayStr }),
  });

  const { data: apiActivityBookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['experienceBookings', todayStr, selectedProperty.id],
    queryFn: () => dashboardAPI.getExperienceBookings({ date: todayStr, propertyId: selectedProperty.id }),
  });

  const arrivals = apiArrivals as Booking[];
  const activityBookings = apiActivityBookings as any[];

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

  const activitiesGrouped = activityBookings.reduce((acc: Record<string, number>, booking: any) => {
    const title = booking.experienceName || booking.experienceId?.title || 'Unknown';
    acc[title] = (acc[title] || 0) + 1;
    return acc;
  }, {});
  const activitiesList = Object.entries(activitiesGrouped).map(([title, rsvp]) => ({ title, rsvp: rsvp as number }));

  const totalArrivals = arrivals.length;
  const approvedCount = arrivals.filter(a => a.checkInStatus === 'approved').length;
  const checkinCompletionPct = totalArrivals > 0 ? Math.round((approvedCount / totalArrivals) * 100) : 0;
  const inHouseGuests = analytics?.totalGuests ?? 0;
  const totalActivityBookings = activityBookings.length;

  const calcTrend = (
    current: number | undefined,
    previous: number | undefined
  ): { value: number; isPositive: boolean } | undefined => {
    if (current == null || previous == null || previous === 0) return undefined;
    const pct = ((current - previous) / previous) * 100;
    return { value: Math.round(pct * 10) / 10, isPositive: pct >= 0 };
  };

  const prevArrivalsCount = (prevArrivals as Booking[]).length;
  const arrivalsTrend = calcTrend(totalArrivals, prevArrivalsCount);
  const inHouseGuestsTrend = calcTrend(analytics?.totalGuests, prevAnalytics?.totalGuests);

  const prevApproved = (prevArrivals as Booking[]).filter(a => a.checkInStatus === 'approved').length;
  const prevCheckinPct = prevArrivalsCount > 0 ? (prevApproved / prevArrivalsCount) * 100 : undefined;
  const checkinTrend = calcTrend(checkinCompletionPct, prevCheckinPct);

  const arrivalsColumns = [
    { key: "primaryGuestName" as const, title: "Primary Guest Name", sortable: true },
    { key: "numberOfGuests" as const, title: "Guests" },
    { key: "bookingId" as const, title: "Booking ID" },
    { key: "roomType" as const, title: "Room Type" },
    {
      key: "checkInStatus" as const,
      title: "Online Checkin Status",
      render: (status: string) => {
        const checkinStatus = getCheckinStatus(status);
        const variant = checkinStatus === "Approved" ? "success" :
                        checkinStatus === "Approval Pending" ? "accent" :
                        checkinStatus === "Rejected" ? "danger" : "default";
        return <StatusBadge status={checkinStatus} variant={variant} />;
      }
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Overview</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening today.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StatCard
          title="In-House Guests"
          value={inHouseGuests}
          icon={Users}
          trend={inHouseGuestsTrend}
          variant="accent"
        />
        <StatCard
          title="Today's Arrivals"
          value={totalArrivals}
          icon={Calendar}
          trend={arrivalsTrend}
        />
        <StatCard
          title="Check-in Completion"
          value={`${checkinCompletionPct}%`}
          icon={Clock}
          trend={checkinTrend}
          variant={checkinCompletionPct < 50 ? "danger" : "accent"}
        />
      </div>

      <Card className="shadow-soft cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/checkin')}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Today's Arrivals
          </CardTitle>
          <Badge variant="secondary">{arrivals.length} total</Badge>
        </CardHeader>
        <CardContent>
          {arrivalsLoading ? (
            <p className="text-muted-foreground text-center py-4">Loading arrivals...</p>
          ) : arrivals.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No arrivals today</p>
          ) : (
            <DataTable
              data={arrivals as any[]}
              columns={arrivalsColumns as any}
            />
          )}
        </CardContent>
      </Card>

      <Card className="shadow-soft cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/activities?tab=bookings')}>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activities Today
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-foreground">{totalActivityBookings}</span>
            <span className="text-sm text-muted-foreground">total bookings</span>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {bookingsLoading ? (
            <p className="text-muted-foreground text-center py-4">Loading activities...</p>
          ) : activitiesList.length > 0 ? (
            <div className="divide-y divide-border">
              {activitiesList.map((activity) => (
                <div key={activity.title} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <span className="text-sm font-medium text-foreground">{activity.title}</span>
                  <span className="text-sm font-semibold text-muted-foreground">{activity.rsvp} bookings</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No activity bookings today</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
