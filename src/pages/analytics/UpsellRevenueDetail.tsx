import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, ShoppingBag, Utensils, Sparkles, Calendar } from "lucide-react";
import { analyticsData } from "@/data/analyticsData";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, parse } from "date-fns";
import { cn } from "@/lib/utils";

export default function UpsellRevenueDetail() {
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
    navigate(`/analytics/upsell-revenue?${params.toString()}`, { replace: true });
  }, [dateRange, isCustomRange, fromDate, toDate, navigate]);
  
  const handleDateRangeChange = (value: string) => {
    if (value === 'custom') {
      setIsCustomRange(true);
    } else {
      setIsCustomRange(false);
      setDateRange(value);
    }
  };
  
  const { commerce } = analyticsData;
  
  // Calculate totals from gmvByDay
  const totalFnb = commerce.gmvByDay.reduce((sum, d) => sum + d.fnb, 0);
  const totalActivities = commerce.gmvByDay.reduce((sum, d) => sum + d.activities, 0);
  const totalAddons = commerce.gmvByDay.reduce((sum, d) => sum + d.addons, 0);
  const grandTotal = totalFnb + totalActivities + totalAddons;
  
  // Prepare chart data
  const chartData = commerce.gmvByDay.map((d) => ({
    day: d.day,
    total: d.fnb + d.activities + d.addons,
    fnb: d.fnb,
    activities: d.activities,
    addons: d.addons,
  }));

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
          <h1 className="text-3xl font-bold text-foreground">Upsell Revenue</h1>
          <p className="text-muted-foreground mt-1">
            Track revenue from activities, F&B orders, and add-ons
          </p>
        </div>

        {/* Main Metric */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue (7 days)</p>
              <p className="text-4xl font-bold text-foreground">₹{grandTotal.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        {/* Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Daily Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, '']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="total" 
                    stroke="hsl(var(--accent))" 
                    fill="hsl(var(--accent))" 
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Source */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Utensils className="h-5 w-5 text-primary" />
              </div>
              <span className="font-medium text-foreground">F&B Orders</span>
            </div>
            <p className="text-2xl font-bold text-foreground">₹{totalFnb.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {((totalFnb / grandTotal) * 100).toFixed(0)}% of total
            </p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-accent" />
              </div>
              <span className="font-medium text-foreground">Activities</span>
            </div>
            <p className="text-2xl font-bold text-foreground">₹{totalActivities.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {((totalActivities / grandTotal) * 100).toFixed(0)}% of total
            </p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-muted-foreground" />
              </div>
              <span className="font-medium text-foreground">Add-ons</span>
            </div>
            <p className="text-2xl font-bold text-foreground">₹{totalAddons.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {((totalAddons / grandTotal) * 100).toFixed(0)}% of total
            </p>
          </Card>
        </div>

        {/* Top Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Selling Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {commerce.itemMixPareto.map((item, index) => (
                <div key={item.item} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground w-6">{index + 1}.</span>
                    <span className="text-foreground">{item.item}</span>
                  </div>
                  <span className="font-semibold text-foreground">₹{item.gmv.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
