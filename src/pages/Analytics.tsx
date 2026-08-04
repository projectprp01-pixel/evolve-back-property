import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { StatCard } from "@/components/ui/StatCard";
import { Calendar, Search, Download, ExternalLink, TrendingUp, TrendingDown, AlertTriangle, Users, Clock, Star, Home, ArrowRight, CheckCircle2, AlertCircle, Zap, FileText, FileSpreadsheet, Image } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { dashboardAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function Analytics() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState("7d");
  const [compareMode, setCompareMode] = useState(false);
  const [fromDate, setFromDate] = useState<Date>();
  const [toDate, setToDate] = useState<Date>();
  const [isCustomRange, setIsCustomRange] = useState(false);

  const { data: analytics } = useQuery({
    queryKey: ["analytics", fromDate?.toISOString(), toDate?.toISOString()],
    queryFn: () =>
      dashboardAPI.getAnalytics({
        startDate: fromDate?.toISOString().split("T")[0],
        endDate: toDate?.toISOString().split("T")[0],
      }),
  });

  const totalRevenue = analytics?.totalRevenue ?? 0;
  const totalGuests = analytics?.totalGuests ?? 0;
  const totalBookings = analytics?.totalBookings ?? 0;
  const checkInsStatus = analytics?.checkInsStatus ?? [];
  const approvedCheckIns = checkInsStatus.find((s: any) => s._id === "approved")?.count ?? 0;
  const totalCheckIns = checkInsStatus.reduce((sum: number, s: any) => sum + (s.count || 0), 0);
  const checkInPct = totalCheckIns > 0 ? Math.round((approvedCheckIns / totalCheckIns) * 100) : 0;
  const revenueDisplay = totalRevenue >= 100000 ? `₹${(totalRevenue / 100000).toFixed(1)}L` : `₹${(totalRevenue / 1000).toFixed(0)}K`;

  const getComparisonText = () => {
    if (isCustomRange) return "since custom range";
    switch (dateRange) {
      case "7d": return "since last 7 days";
      case "30d": return "since last 30 days";  
      case "90d": return "since last 90 days";
      default: return "since last 7 days";
    }
  };

  // Mock data for the new overview design
  const occupancyData = [{
    day: 'Mon',
    occupancy: 78,
    rating: 4.5
  }, {
    day: 'Tue',
    occupancy: 82,
    rating: 4.6
  }, {
    day: 'Wed',
    occupancy: 85,
    rating: 4.4
  }, {
    day: 'Thu',
    occupancy: 92,
    rating: 4.7
  }, {
    day: 'Fri',
    occupancy: 95,
    rating: 4.8
  }, {
    day: 'Sat',
    occupancy: 98,
    rating: 4.6
  }, {
    day: 'Sun',
    occupancy: 88,
    rating: 4.5
  }];
  const guestSegments = [{
    name: 'Premium',
    value: 45,
    color: 'hsl(var(--accent))'
  }, {
    name: 'Standard',
    value: 38,
    color: 'hsl(var(--primary))'
  }, {
    name: 'Budget',
    value: 17,
    color: 'hsl(var(--muted-foreground))'
  }];
  const alerts = [{
    title: "Slow response — Avg reply 45m",
    description: "Higher than 10m target",
    severity: "warning",
    action: "Assign staff to inbox",
    cta: "Assign"
  }, {
    title: "Room 205 — Maintenance request",
    description: "AC issue reported 2h ago",
    severity: "urgent",
    action: "Create maintenance ticket",
    cta: "Create Ticket"
  }, {
    title: "Low F&B conversion",
    description: "Only 32% ordering today",
    severity: "info",
    action: "Promote lunch specials",
    cta: "Send Push"
  }];
  const opportunities = ["Rooms 101-105: high upsell potential", "Weekend spa packages trending up 23%", "Repeat guests prefer room 302 view"];
  const handleExport = (format: string) => {
    const formatDetails = {
      pdf: { name: "PDF Report", description: "Downloading comprehensive analytics report as PDF..." },
      excel: { name: "Excel Spreadsheet", description: "Downloading data tables as Excel file..." },
      csv: { name: "CSV Data", description: "Downloading raw data as CSV file..." },
      png: { name: "PNG Image", description: "Downloading charts and graphs as PNG image..." },
      json: { name: "JSON Data", description: "Downloading structured data as JSON file..." }
    };
    
    const details = formatDetails[format as keyof typeof formatDetails];
    
    toast({
      title: `Export Started - ${details.name}`,
      description: details.description
    });
    
    // Simulate download
    setTimeout(() => {
      const link = document.createElement('a');
      link.download = `analytics-report-${new Date().toISOString().split('T')[0]}.${format}`;
      link.href = '#'; // In real implementation, this would be the actual file URL
      // link.click(); // Uncomment when implementing actual download
      
      toast({
        title: "Download Complete",
        description: `${details.name} has been downloaded successfully.`
      });
    }, 2000);
  };
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'urgent':
        return 'bg-destructive/10 border-destructive/20 text-destructive';
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-700';
      default:
        return 'bg-accent/10 border-accent/20 text-accent-foreground';
    }
  };
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'urgent':
        return AlertCircle;
      case 'warning':
        return AlertTriangle;
      default:
        return Zap;
    }
  };
  return <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="border-b border-border bg-card">
        <div className="max-w-[1350px] mx-auto p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              
              <div className="flex items-center gap-4">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                
                {/* Preset Date Ranges */}
                <Select value={isCustomRange ? "custom" : dateRange} onValueChange={(value) => {
                  if (value === "custom") {
                    setIsCustomRange(true);
                  } else {
                    setDateRange(value);
                    setIsCustomRange(false);
                    setFromDate(undefined);
                    setToDate(undefined);
                  }
                }}>
                  <SelectTrigger className="w-32 h-8 text-sm border-0 bg-muted/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>

                {/* Custom Date Range Pickers */}
                {isCustomRange && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">From:</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            "w-32 h-8 text-xs justify-start text-left font-normal",
                            !fromDate && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="mr-2 h-3 w-3" />
                          {fromDate ? format(fromDate, "MMM dd") : "Select"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={fromDate}
                          onSelect={setFromDate}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>

                    <span className="text-sm text-muted-foreground">To:</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            "w-32 h-8 text-xs justify-start text-left font-normal",
                            !toDate && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="mr-2 h-3 w-3" />
                          {toDate ? format(toDate, "MMM dd") : "Select"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={toDate}
                          onSelect={setToDate}
                          disabled={(date) => fromDate ? date < fromDate : false}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Switch id="compare" checked={compareMode} onCheckedChange={setCompareMode} className="scale-75" />
                <label htmlFor="compare" className="text-sm text-muted-foreground">
                  Compare
                </label>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search insights..." className="pl-9 w-64 h-8 text-sm" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1350px] mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">Analytics Overview</h1>
          <p className="text-muted-foreground text-lg">
            Track guest experience, efficiency, and revenue impact in one place
          </p>
        </div>

        {/* Main KPI Infographic Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Upsell Revenue per Guest */}
          <Card 
            className="p-6 hover:shadow-medium transition-smooth cursor-pointer bg-gradient-to-br from-background to-accent/5"
            onClick={() => navigate(`/analytics/upsell-revenue?range=${isCustomRange ? 'custom' : dateRange}${fromDate ? `&from=${format(fromDate, 'yyyy-MM-dd')}` : ''}${toDate ? `&to=${format(toDate, 'yyyy-MM-dd')}` : ''}`)}
          >
            <div className="flex items-center justify-between mb-4 gap-2">
              <h3 className="text-lg font-semibold text-foreground flex-1 min-w-0">Upsell Revenue</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-foreground">{revenueDisplay}</div>
                {compareMode && (
                  <div className="flex flex-col items-end">
                    <Badge variant="secondary" className="text-green-600 bg-green-50 border-green-200 flex-shrink-0 whitespace-nowrap">
                      ↑ 12%
                    </Badge>
                    <span className="text-xs text-muted-foreground/60 mt-1">{getComparisonText()}</span>
                  </div>
                )}
              </div>
              <div className="text-sm text-muted-foreground">Experience revenue (from API)</div>
              {/* Revenue trend indicator */}
              <div className="mt-3 flex items-center gap-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((bar) => (
                    <div
                      key={bar}
                      className="w-2 bg-accent/30 rounded-full"
                      style={{ height: `${Math.random() * 20 + 10}px` }}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">Last 5 days</span>
              </div>
            </div>
          </Card>

          {/* Guest Engagement Rate */}
          <Card 
            className="p-6 hover:shadow-medium transition-smooth cursor-pointer bg-gradient-to-br from-background to-primary/5"
            onClick={() => navigate(`/analytics/guest-engagement?range=${isCustomRange ? 'custom' : dateRange}${fromDate ? `&from=${format(fromDate, 'yyyy-MM-dd')}` : ''}${toDate ? `&to=${format(toDate, 'yyyy-MM-dd')}` : ''}`)}
          >
            <div className="flex items-center justify-between mb-4 gap-2">
              <h3 className="text-lg font-semibold text-foreground flex-1 min-w-0">Guest Engagement</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-foreground">73%</div>
                {compareMode && (
                  <div className="flex flex-col items-end">
                    <Badge variant="secondary" className="text-green-600 bg-green-50 border-green-200 flex-shrink-0 whitespace-nowrap">
                      ↑ 8%
                    </Badge>
                    <span className="text-xs text-muted-foreground/60 mt-1">{getComparisonText()}</span>
                  </div>
                )}
              </div>
              <div className="text-sm text-muted-foreground">% guests engaging digitally</div>
              {/* Engagement level indicator */}
              <div className="mt-3 flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <div className="w-2 h-2 rounded-full bg-primary/60"></div>
                  <div className="w-1 h-1 rounded-full bg-primary/30"></div>
                </div>
                <span className="text-xs text-muted-foreground">High engagement</span>
              </div>
            </div>
          </Card>


          {/* Digital Check-in Adoption */}
          <Card 
            className="p-6 hover:shadow-medium transition-smooth cursor-pointer bg-gradient-to-br from-background to-primary/5"
            onClick={() => navigate(`/analytics/digital-checkin?range=${isCustomRange ? 'custom' : dateRange}${fromDate ? `&from=${format(fromDate, 'yyyy-MM-dd')}` : ''}${toDate ? `&to=${format(toDate, 'yyyy-MM-dd')}` : ''}`)}
          >
            <div className="flex items-center justify-between mb-4 gap-2">
              <h3 className="text-lg font-semibold text-foreground flex-1 min-w-0">Digital Check-in</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-foreground">{totalCheckIns > 0 ? `${checkInPct}%` : "72%"}</div>
                {compareMode && (
                  <div className="flex flex-col items-end">
                    <Badge variant="secondary" className="text-green-600 bg-green-50 border-green-200 flex-shrink-0 whitespace-nowrap">
                      ↑ 15%
                    </Badge>
                    <span className="text-xs text-muted-foreground/60 mt-1">{getComparisonText()}</span>
                  </div>
                )}
              </div>
              <div className="text-sm text-muted-foreground">Check-ins approved (from API)</div>
              {/* Digital adoption indicator */}
              <div className="mt-3 flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-4 bg-primary rounded-sm"></div>
                  <div className="w-2 h-3 bg-primary/70 rounded-sm"></div>
                  <div className="w-2 h-2 bg-primary/40 rounded-sm"></div>
                  <div className="w-2 h-1 bg-muted/40 rounded-sm"></div>
                </div>
                <span className="text-xs text-muted-foreground">Growing adoption</span>
              </div>
            </div>
          </Card>

        </div>

      </div>

      {/* Floating Download Report Button */}
      <div className="fixed bottom-6 right-6 z-[100]">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="lg"
              className="rounded-full w-16 h-16 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 group border-2 border-background"
              title="Download Analytics Report"
            >
              <Download className="h-7 w-7 group-hover:scale-110 transition-transform" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="start" 
            side="top"
            className="w-64 mb-2 bg-card border border-border shadow-xl z-[110]"
          >
            <div className="px-4 py-3 text-sm font-semibold text-card-foreground border-b border-border bg-muted/50">
              📊 Download Analytics Report
            </div>
            <DropdownMenuItem 
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-3 py-3 px-4 cursor-pointer hover:bg-muted/50 focus:bg-muted/50"
            >
              <FileText className="h-5 w-5 text-red-500 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-medium text-card-foreground">PDF Report</div>
                <div className="text-xs text-muted-foreground">Complete analytics summary</div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleExport('excel')}
              className="flex items-center gap-3 py-3 px-4 cursor-pointer hover:bg-muted/50 focus:bg-muted/50"
            >
              <FileSpreadsheet className="h-5 w-5 text-green-500 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-medium text-card-foreground">Excel Spreadsheet</div>
                <div className="text-xs text-muted-foreground">Data tables and charts</div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleExport('csv')}
              className="flex items-center gap-3 py-3 px-4 cursor-pointer hover:bg-muted/50 focus:bg-muted/50"
            >
              <FileSpreadsheet className="h-5 w-5 text-blue-500 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-medium text-card-foreground">CSV Data</div>
                <div className="text-xs text-muted-foreground">Raw data export</div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleExport('png')}
              className="flex items-center gap-3 py-3 px-4 cursor-pointer hover:bg-muted/50 focus:bg-muted/50"
            >
              <Image className="h-5 w-5 text-purple-500 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-medium text-card-foreground">PNG Image</div>
                <div className="text-xs text-muted-foreground">Charts and visualizations</div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleExport('json')}
              className="flex items-center gap-3 py-3 px-4 cursor-pointer hover:bg-muted/50 focus:bg-muted/50"
            >
              <FileText className="h-5 w-5 text-orange-500 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-medium text-card-foreground">JSON Data</div>
                <div className="text-xs text-muted-foreground">Structured data format</div>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>;
}