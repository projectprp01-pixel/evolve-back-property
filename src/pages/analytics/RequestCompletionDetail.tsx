import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, RefreshCw, AlertTriangle, Calendar } from "lucide-react";
import { analyticsData } from "@/data/analyticsData";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, parse } from "date-fns";
import { cn } from "@/lib/utils";

export default function RequestCompletionDetail() {
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
    navigate(`/analytics/request-completion?${params.toString()}`, { replace: true });
  }, [dateRange, isCustomRange, fromDate, toDate, navigate]);
  
  const handleDateRangeChange = (value: string) => {
    if (value === 'custom') {
      setIsCustomRange(true);
    } else {
      setIsCustomRange(false);
      setDateRange(value);
    }
  };
  
  const { series, service } = analyticsData;
  
  // Prepare SLA compliance trend data
  const trendData = series.days.map((day, i) => ({
    day,
    completion: series.slaCompliancePct[i],
  }));
  
  const currentSla = analyticsData.kpis.slaCompliancePct;

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
          <h1 className="text-3xl font-bold text-foreground">Request Completion</h1>
          <p className="text-muted-foreground mt-1">
            Monitor request handling efficiency across departments
          </p>
        </div>

        {/* Main Metric */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">SLA Compliance</p>
              <p className="text-4xl font-bold text-foreground">{currentSla}%</p>
            </div>
          </div>
        </Card>

        {/* Completion Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Completion Rate Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis domain={[70, 100]} className="text-xs" unit="%" />
                  <Tooltip 
                    formatter={(value: number) => [`${value}%`, 'Completion']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="completion" 
                    stroke="hsl(142 76% 36%)" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(142 76% 36%)' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Department Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Department Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {service.deptBreaches.map((dept) => {
                const reopenData = service.reopenRateByDeptPct.find(r => r.department === dept.department);
                const reopenPct = reopenData?.reopenPct || 0;
                
                return (
                  <div key={dept.department} className="p-4 rounded-lg bg-muted/20 border border-border">
                    <h4 className="font-medium text-foreground mb-3">{dept.department}</h4>
                    
                    {/* SLA Compliance */}
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">SLA Compliance</span>
                        <span className={dept.slaCompliancePct >= 90 ? 'text-green-600' : 'text-amber-600'}>
                          {dept.slaCompliancePct}%
                        </span>
                      </div>
                      <div className="w-full bg-muted/30 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${dept.slaCompliancePct >= 90 ? 'bg-green-500' : 'bg-amber-500'}`}
                          style={{ width: `${dept.slaCompliancePct}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* Stats Row */}
                    <div className="flex justify-between text-sm pt-2 border-t border-border">
                      <div className="flex items-center gap-1 text-amber-600">
                        <AlertTriangle className="h-3 w-3" />
                        <span>{dept.breaches} breaches</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <RefreshCw className="h-3 w-3" />
                        <span>{reopenPct}% reopen</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
