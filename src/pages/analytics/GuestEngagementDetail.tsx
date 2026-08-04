import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Activity, Calendar } from "lucide-react";
import { analyticsData } from "@/data/analyticsData";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, parse } from "date-fns";
import { cn } from "@/lib/utils";

export default function GuestEngagementDetail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Read from URL params
  const range = searchParams.get('range') || '7d';
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');
  
  // Local state for date range
  const [dateRange, setDateRange] = useState(range);
  const [isCustomRange, setIsCustomRange] = useState(range === 'custom');
  const [fromDate, setFromDate] = useState<Date | undefined>(
    fromParam ? parse(fromParam, 'yyyy-MM-dd', new Date()) : undefined
  );
  const [toDate, setToDate] = useState<Date | undefined>(
    toParam ? parse(toParam, 'yyyy-MM-dd', new Date()) : undefined
  );
  
  // Update URL when date range changes
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('range', isCustomRange ? 'custom' : dateRange);
    if (fromDate) params.set('from', format(fromDate, 'yyyy-MM-dd'));
    if (toDate) params.set('to', format(toDate, 'yyyy-MM-dd'));
    navigate(`/analytics/guest-engagement?${params.toString()}`, { replace: true });
  }, [dateRange, isCustomRange, fromDate, toDate, navigate]);
  
  const handleDateRangeChange = (value: string) => {
    if (value === 'custom') {
      setIsCustomRange(true);
    } else {
      setIsCustomRange(false);
      setDateRange(value);
    }
  };
  
  const { engagement, series } = analyticsData;
  
  // Prepare trend data (using dailyActiveInhouse as engagement proxy)
  const trendData = series.days.map((day, i) => ({
    day,
    active: series.dailyActiveInhouse[i],
  }));
  
  // Guest type engagement data
  const guestTypeData = engagement.actionsPerUserByGuestType;
  
  // Section adoption data
  const sectionData = engagement.sectionAdoptionShare;

  const handleBack = () => {
    const params = new URLSearchParams();
    params.set('range', isCustomRange ? 'custom' : dateRange);
    if (fromDate) params.set('from', format(fromDate, 'yyyy-MM-dd'));
    if (toDate) params.set('to', format(toDate, 'yyyy-MM-dd'));
    navigate(`/analytics?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-[1200px] mx-auto p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <Button variant="ghost" onClick={handleBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Analytics
            </Button>
            
            {/* Date Range Filters */}
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              
              <Select value={isCustomRange ? "custom" : dateRange} onValueChange={handleDateRangeChange}>
                <SelectTrigger className="w-36 h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
              
              {isCustomRange && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">From:</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-32 h-9 justify-start text-left text-sm font-normal",
                          !fromDate && "text-muted-foreground"
                        )}
                      >
                        {fromDate ? format(fromDate, "MMM d, yyyy") : "Select"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={fromDate}
                        onSelect={setFromDate}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  
                  <span className="text-sm text-muted-foreground">To:</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-32 h-9 justify-start text-left text-sm font-normal",
                          !toDate && "text-muted-foreground"
                        )}
                      >
                        {toDate ? format(toDate, "MMM d, yyyy") : "Select"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={toDate}
                        onSelect={setToDate}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto p-6 space-y-6">
        {/* Title */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Guest Engagement</h1>
          <p className="text-muted-foreground mt-1">
            Understand how guests interact with your digital services
          </p>
        </div>

        {/* Main Metric */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Engagement Rate</p>
              <p className="text-4xl font-bold text-foreground">73%</p>
            </div>
          </div>
        </Card>

        {/* Active Users Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Daily Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="active" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Engagement by Guest Type */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions by Guest Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {guestTypeData.map((item) => (
                  <div key={item.guestType} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground">{item.guestType}</span>
                      <span className="text-muted-foreground">{item.actions} actions/user</span>
                    </div>
                    <div className="w-full bg-muted/20 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${(item.actions / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Section Adoption */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Feature Adoption</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sectionData.map((item) => (
                  <div key={item.section} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground">{item.section}</span>
                      <span className="text-muted-foreground">{item.sharePct}%</span>
                    </div>
                    <div className="w-full bg-muted/20 rounded-full h-2">
                      <div 
                        className="bg-accent h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${item.sharePct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
