import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, FileWarning, ArrowDown, Calendar } from "lucide-react";
import { analyticsData } from "@/data/analyticsData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, parse } from "date-fns";
import { cn } from "@/lib/utils";

export default function DigitalCheckinDetail() {
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
    navigate(`/analytics/digital-checkin?${params.toString()}`, { replace: true });
  }, [dateRange, isCustomRange, fromDate, toDate, navigate]);
  
  const handleDateRangeChange = (value: string) => {
    if (value === 'custom') {
      setIsCustomRange(true);
    } else {
      setIsCustomRange(false);
      setDateRange(value);
    }
  };
  
  const { funnels, checkin } = analyticsData;
  
  const completionRate = checkin.completionTminus1Pct;
  const funnelSteps = funnels.checkin;
  const docIssues = checkin.docIssues;
  
  // Calculate total issues
  const totalIssues = docIssues.reduce((sum, issue) => sum + issue.count, 0);

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
          <h1 className="text-3xl font-bold text-foreground">Digital Check-in</h1>
          <p className="text-muted-foreground mt-1">
            Track check-in completion and identify drop-off points
          </p>
        </div>

        {/* Main Metric */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Completion Rate (T-1)</p>
              <p className="text-4xl font-bold text-foreground">{completionRate}%</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-muted/20 rounded-full h-3">
              <div 
                className="bg-primary h-3 rounded-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Check-in Funnel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Check-in Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {funnelSteps.map((step, index) => {
                  const maxCount = funnelSteps[0].count;
                  const widthPct = (step.count / maxCount) * 100;
                  const prevCount = index > 0 ? funnelSteps[index - 1].count : step.count;
                  const dropoff = index > 0 ? prevCount - step.count : 0;
                  
                  return (
                    <div key={step.step}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-foreground">{step.step}</span>
                        <span className="text-muted-foreground">{step.count}</span>
                      </div>
                      <div className="w-full bg-muted/20 rounded h-6 relative">
                        <div 
                          className="bg-primary/80 h-6 rounded transition-all duration-500 flex items-center justify-end pr-2"
                          style={{ width: `${widthPct}%` }}
                        >
                          {widthPct > 20 && (
                            <span className="text-xs text-primary-foreground font-medium">
                              {widthPct.toFixed(0)}%
                            </span>
                          )}
                        </div>
                      </div>
                      {dropoff > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1 ml-2">
                          <ArrowDown className="h-3 w-3" />
                          <span>{dropoff} dropped</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Document Issues */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileWarning className="h-5 w-5" />
                Document Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-sm text-amber-700">
                  <span className="font-semibold">{totalIssues}</span> documents flagged for review
                </p>
              </div>
              
              <div className="space-y-3">
                {docIssues.map((issue) => (
                  <div key={issue.type} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <span className="text-foreground">{issue.type}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-muted/20 rounded-full h-2">
                        <div 
                          className="bg-amber-500 h-2 rounded-full"
                          style={{ width: `${(issue.count / totalIssues) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-foreground w-8 text-right">{issue.count}</span>
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
