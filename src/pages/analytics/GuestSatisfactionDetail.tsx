import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star, ThumbsUp, ThumbsDown, MessageSquare, Calendar } from "lucide-react";
import { analyticsData } from "@/data/analyticsData";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, parse } from "date-fns";
import { cn } from "@/lib/utils";

export default function GuestSatisfactionDetail() {
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
    navigate(`/analytics/guest-satisfaction?${params.toString()}`, { replace: true });
  }, [dateRange, isCustomRange, fromDate, toDate, navigate]);
  
  const handleDateRangeChange = (value: string) => {
    if (value === 'custom') {
      setIsCustomRange(true);
    } else {
      setIsCustomRange(false);
      setDateRange(value);
    }
  };
  
  const { reviews, series } = analyticsData;
  
  // Prepare rating trend data
  const ratingTrend = series.days.map((day, i) => ({
    day,
    rating: reviews.avgRatingByDay[i],
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
          <h1 className="text-3xl font-bold text-foreground">Guest Satisfaction</h1>
          <p className="text-muted-foreground mt-1">
            Monitor ratings and review themes
          </p>
        </div>

        {/* Main Metric */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
              <Star className="h-6 w-6 text-accent fill-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Average Rating</p>
              <div className="flex items-center gap-3">
                <p className="text-4xl font-bold text-foreground">{analyticsData.kpis.avgRating}</p>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star 
                      key={star} 
                      className={`h-5 w-5 ${star <= Math.round(analyticsData.kpis.avgRating) ? 'fill-accent text-accent' : 'text-muted-foreground'}`} 
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Rating Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rating Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ratingTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis domain={[3.5, 5]} className="text-xs" />
                  <Tooltip 
                    formatter={(value: number) => [value.toFixed(1), 'Rating']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="rating" 
                    stroke="hsl(var(--accent))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--accent))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Review Themes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Review Themes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reviews.themes.map((theme) => (
                  <div key={theme.theme} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="font-medium text-foreground">{theme.theme}</span>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-green-600">
                        <ThumbsUp className="h-4 w-4" />
                        <span className="text-sm">{theme.positive}</span>
                      </div>
                      <div className="flex items-center gap-1 text-destructive">
                        <ThumbsDown className="h-4 w-4" />
                        <span className="text-sm">{theme.negative}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pending Reviews */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Pending Replies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reviews.pendingReplies.map((review) => (
                  <div key={review.id} className="p-3 rounded-lg bg-muted/30 border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{review.source}</Badge>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star 
                            key={star} 
                            className={`h-3 w-3 ${star <= review.rating ? 'fill-accent text-accent' : 'text-muted-foreground'}`} 
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-foreground">{review.text}</p>
                    <p className="text-xs text-muted-foreground mt-2">{review.date}</p>
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
