"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Users, TrendingUp, ArrowUpRight, ChevronUp, ChevronDown, Info } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ComposedChart,
  Area,
  Legend,
  PieChart,
  Pie,
  Cell,
  LabelList
} from "recharts";
import { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CommissionReport {
  month: string;
  totalCommission: number;
  uniqueReferees: number;
  averageCommission: number;
  totalNGR: number;
  refereePerformance: {
    totalDeposit: number;
    totalTurnover: number;
    totalWinLoss: number;
  };
  levelBreakdown: LevelData[];
}

interface LevelData {
  level: number;
  commission: number;
  referees: number;
}

interface TrendData {
  date: string;
  totalCommission: number;
  uniqueReferees: number;
  totalNGR: number;
}

interface ComparisonData {
  month: string;
  totalCommission: number;
  uniqueReferees: number;
  totalDeposits: number;
  totalTurnover: number;
  totalNGR: number;
  averageCommission: number;
}

interface RefereeActivityData {
  month: string;
  monthDate: string;
  totalDeposit: number;
  totalWithdrawal: number;
  totalBonusAmount: number;
  totalReward: number;
  totalValidTurnover: number;
  ngr: number;
  activeReferees: number;
}

// Add ExpandableRow interface to track which months are expanded
interface RefereeRowData {
  refereeId: string;
  refereeLogin: string;
  totalDeposit: number;
  totalWithdrawal: number;
  totalBonusAmount: number;
  totalReward: number;
  totalValidTurnover: number;
  ngr: number;
}

const CHART_COLORS = {
  primary: '#8884d8',
  secondary: '#82ca9d',
  tertiary: '#ffc658',
  quaternary: '#ff8042',
  background: '#ffffff',
  grid: '#f0f0f0',
  text: '#64748b', // Slate-500 for text
  growth: '#22c55e', // Green for positive growth
  decline: '#ef4444', // Red for negative growth
  // Additional colors for level breakdown
  level: [
    '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#da70d6',
    '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd'
  ]
};

const CHART_STYLES = {
  tooltip: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0', // Slate-200
    borderRadius: '8px',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    padding: '8px',
  },
  fontSize: {
    small: '12px',
    normal: '14px',
  }
};

// Custom formatter for Y-axis values in thousands (K)
const formatYAxisInThousands = (value: number) => {
  if (value === 0) return '₱0';
  if (Math.abs(value) < 1000) return `₱${value}`;
  return `₱${(value / 1000).toFixed(0)}K`;
};

// Custom formatter for Y-axis values in millions (M)
const formatYAxisInMillions = (value: number) => {
  if (value === 0) return '₱0';
  if (Math.abs(value) < 1000000) return `₱${(value / 1000).toFixed(0)}K`;
  return `₱${(value / 1000000).toFixed(1)}M`;
};

// Custom formatter for Y-axis values that switches between K and M appropriately
const formatYAxisDynamic = (value: number) => {
  if (value === 0) return '₱0';
  if (Math.abs(value) < 1000) return `₱${value}`;
  if (Math.abs(value) < 1000000) return `₱${(value / 1000).toFixed(0)}K`;
  return `₱${(value / 1000000).toFixed(1)}M`;
};

// Add this function to calculate percentage change
const calculatePercentageChange = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
};

export default function ReportsOverview() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
  const [reportData, setReportData] = useState<CommissionReport | null>(null);
  const [monthlyTrends, setMonthlyTrends] = useState<TrendData[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
  const [refereeActivityData, setRefereeActivityData] = useState<RefereeActivityData[]>([]);
  const [expandedMonths, setExpandedMonths] = useState<{[key: string]: boolean}>({});
  const [refereeDetails, setRefereeDetails] = useState<{[key: string]: RefereeRowData[]}>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/reports/commission?year=${selectedYear}&month=${selectedMonth}&view=monthly`
      );
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data); // For debugging
      
      setReportData(data.report);
      setMonthlyTrends(data.trends || []);
      setComparisonData(data.comparison || []);
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRefereeActivityData = async () => {
    try {
      const response = await fetch(
        `/api/reports/referee-activity?year=${selectedYear}&month=${selectedMonth}`
      );
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Referee Activity API Response:', data); // For debugging
      
      // Sort data chronologically by month
      const sortedData = [...(data.monthly || [])].sort((a, b) => 
        new Date(a.monthDate).getTime() - new Date(b.monthDate).getTime()
      );
      
      setRefereeActivityData(sortedData);
    } catch (error) {
      console.error("Error fetching referee activity data:", error);
    }
  };

  // Add new function to fetch referee details for a specific month
  const fetchRefereeDetails = async (month: string, monthDate: string) => {
    try {
      // Parse the month date to get year and month
      const date = new Date(monthDate);
      const year = date.getFullYear().toString();
      const monthNum = (date.getMonth() + 1).toString().padStart(2, '0');
      
      const response = await fetch(
        `/api/reports/referee-details?year=${year}&month=${monthNum}`
      );
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Referee Details API Response:', data); // For debugging
      
      setRefereeDetails(prev => ({
        ...prev,
        [month]: data.referees || []
      }));
    } catch (error) {
      console.error("Error fetching referee details:", error);
    }
  };
  
  // Add function to toggle expanded state
  const toggleMonthExpand = (month: string, monthDate: string) => {
    setExpandedMonths(prev => {
      const newState = {
        ...prev,
        [month]: !prev[month]
      };
      
      // If expanding and we don't have details yet, fetch them
      if (newState[month] && (!refereeDetails[month] || refereeDetails[month].length === 0)) {
        fetchRefereeDetails(month, monthDate);
      }
      
      return newState;
    });
  };

  useEffect(() => {
    fetchReportData();
    fetchRefereeActivityData();
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    if (reportData === null && monthlyTrends.length > 0) {
      console.log("Report data is null but trends data exists:", monthlyTrends);
      
      // Create report data from the current month's trend data
      const currentMonthTrend = monthlyTrends.find(trend => {
        const trendDate = new Date(trend.date);
        return trendDate.getFullYear() === parseInt(selectedYear) && 
               trendDate.getMonth() + 1 === parseInt(selectedMonth);
      });
      
      if (currentMonthTrend) {
        console.log("Found current month in trends:", currentMonthTrend);
        // Use the trend data to populate the report data
        setReportData({
          month: currentMonthTrend.date,
          totalCommission: currentMonthTrend.totalCommission,
          uniqueReferees: currentMonthTrend.uniqueReferees,
          averageCommission: currentMonthTrend.uniqueReferees > 0 ? 
            currentMonthTrend.totalCommission / currentMonthTrend.uniqueReferees : 0,
          totalNGR: currentMonthTrend.totalNGR,
          refereePerformance: {
            totalDeposit: 0, // We don't have this in trends
            totalTurnover: 0, // We don't have this in trends
            totalWinLoss: currentMonthTrend.totalNGR
          },
          levelBreakdown: []
        });
      }
    }
  }, [reportData, monthlyTrends, selectedYear, selectedMonth]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PHP',
    }).format(value);
  };

  // Special formatter for NGR - show as positive from company perspective
  const formatNGR = (value: number) => {
    // For NGR, we show the absolute value from company perspective
    // If NGR is positive for the user, it's negative for the company and vice versa
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PHP',
    }).format(Math.abs(value));
  };

  const calculateGrowthPercentage = (current: number, previous: number) => {
    if (!previous) return 100;
    return ((current - previous) / previous) * 100;
  };

  // Add this function to get the previous month's data
  const getPreviousMonthData = () => {
    if (!comparisonData || comparisonData.length < 2) return null;
    
    // Find the current month in the comparison data
    const currentMonthStr = `${selectedYear}-${selectedMonth.padStart(2, '0')}`;
    
    // Find the index of the current month in the comparison data
    const currentMonthIndex = comparisonData.findIndex(item => 
      item.month.startsWith(currentMonthStr)
    );
    
    // If found and there's a previous month, return it
    if (currentMonthIndex > 0) {
      return comparisonData[currentMonthIndex - 1];
    }
    
    return null;
  };

  // Add this function to get the current month's data from comparison data
  const getCurrentMonthFromComparison = () => {
    if (!comparisonData || comparisonData.length === 0) return null;
    
    const currentMonthStr = `${selectedYear}-${selectedMonth.padStart(2, '0')}`;
    return comparisonData.find(item => item.month.startsWith(currentMonthStr)) || null;
  };

  // Format levels data for the chart
  const formatLevelData = () => {
    if (!reportData?.levelBreakdown) return [];
    
    return reportData.levelBreakdown.map(level => ({
      name: `Level ${level.level}`,
      commission: level.commission,
      referees: level.referees
    }));
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-2">Loading report data...</p>
      </div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Commission Reports</h2>
        <div className="flex gap-4">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <SelectItem key={month} value={month.toString()}>
                  {new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="comparison">Monthly Comparison</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {(() => {
                  // Try to get data from reportData first, then fall back to comparison data
                  const currentData = reportData || getCurrentMonthFromComparison();
                  const totalCommission = currentData?.totalCommission || 0;
                  
                  return (
                    <>
                      <div className="text-2xl font-bold">{formatCurrency(totalCommission)}</div>
                      {(() => {
                        const prevMonth = getPreviousMonthData();
                        if (prevMonth) {
                          const change = calculatePercentageChange(
                            totalCommission, 
                            prevMonth.totalCommission
                          );
                          return (
                            <p className={`text-xs ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {change >= 0 ? '+' : ''}{change.toFixed(1)}% vs prev month
                            </p>
                          );
                        }
                        return null;
                      })()}
                    </>
                  );
                })()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unique Referees</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {(() => {
                  const currentData = reportData || getCurrentMonthFromComparison();
                  const uniqueReferees = currentData?.uniqueReferees || 0;
                  
                  return (
                    <>
                      <div className="text-2xl font-bold">{uniqueReferees}</div>
                      {(() => {
                        const prevMonth = getPreviousMonthData();
                        if (prevMonth) {
                          const change = calculatePercentageChange(
                            uniqueReferees, 
                            prevMonth.uniqueReferees
                          );
                          return (
                            <p className={`text-xs ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {change >= 0 ? '+' : ''}{change.toFixed(1)}% vs prev month
                            </p>
                          );
                        }
                        return null;
                      })()}
                    </>
                  );
                })()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Commission</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {(() => {
                  const currentData = reportData || getCurrentMonthFromComparison();
                  const avgCommission = currentData?.averageCommission || 0;
                  
                  return (
                    <>
                      <div className="text-2xl font-bold">{formatCurrency(avgCommission)}</div>
                      {(() => {
                        const prevMonth = getPreviousMonthData();
                        if (prevMonth) {
                          const change = calculatePercentageChange(
                            avgCommission, 
                            prevMonth.averageCommission
                          );
                          return (
                            <p className={`text-xs ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {change >= 0 ? '+' : ''}{change.toFixed(1)}% vs prev month
                            </p>
                          );
                        }
                        return null;
                      })()}
                    </>
                  );
                })()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total NGR</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {(() => {
                  const currentData = reportData || getCurrentMonthFromComparison();
                  const totalNGR = currentData?.totalNGR || 0;
                  
                  return (
                    <>
                      <div className="text-2xl font-bold">{formatNGR(totalNGR)}</div>
                      {(() => {
                        const prevMonth = getPreviousMonthData();
                        if (prevMonth) {
                          // For NGR, we need to handle the company perspective
                          const change = calculatePercentageChange(
                            -totalNGR, 
                            -prevMonth.totalNGR
                          );
                          return (
                            <p className={`text-xs ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {change >= 0 ? '+' : ''}{change.toFixed(1)}% vs prev month
                            </p>
                          );
                        }
                        return null;
                      })()}
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          </div>

          {/* Commission Trends Chart or Daily Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Commission & Referee Trends (Monthly)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full">
                <ResponsiveContainer>
                  <ComposedChart data={monthlyTrends}>
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke={CHART_COLORS.grid} 
                      vertical={false}
                    />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: CHART_COLORS.text, fontSize: CHART_STYLES.fontSize.small }}
                      tickFormatter={(value: string) => new Date(value).toLocaleDateString('default', { month: 'short' })}
                      axisLine={{ stroke: CHART_COLORS.grid }}
                    />
                    <YAxis 
                      yAxisId="left"
                      tick={{ fill: CHART_COLORS.text, fontSize: CHART_STYLES.fontSize.small }}
                      tickFormatter={(value) => formatCurrency(value)}
                      axisLine={{ stroke: CHART_COLORS.grid }}
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right"
                      tick={{ fill: CHART_COLORS.text, fontSize: CHART_STYLES.fontSize.small }}
                      axisLine={{ stroke: CHART_COLORS.grid }}
                    />
                    <RechartsTooltip 
                      contentStyle={CHART_STYLES.tooltip}
                      labelStyle={{ color: CHART_COLORS.text, fontWeight: 600 }}
                      formatter={(value, name) => [
                        name === "Commission" ? formatCurrency(Number(value)) : `${value} referees`,
                        name
                      ]}
                      labelFormatter={(value: string) => new Date(value).toLocaleDateString('default', { year: 'numeric', month: 'long' })}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: CHART_STYLES.fontSize.normal }}
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="totalCommission"
                      name="Commission"
                      fill={CHART_COLORS.primary}
                      stroke={CHART_COLORS.primary}
                      fillOpacity={0.3}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="uniqueReferees"
                      name="Active Referees"
                      stroke={CHART_COLORS.secondary}
                      strokeWidth={2}
                      dot={{ r: 4, fill: CHART_COLORS.secondary }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Performance Distribution - REMOVED */}
            {/* Commission Distribution by Level - REMOVED */}
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Growth Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full">
                <ResponsiveContainer>
                  <ComposedChart data={comparisonData.map((item, index) => {
                    // Find matching referee data for this month
                    const refereeData = refereeActivityData.find(data => data.month === item.month);
                    return {
                      ...item,
                      // Use NGR from referee data if available, otherwise fallback to original
                      totalNGR: refereeData ? refereeData.ngr : item.totalNGR
                    };
                  })}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                    <XAxis 
                      dataKey="month" 
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear().toString().slice(2)}`;
                      }}
                      stroke={CHART_COLORS.text}
                    />
                    <YAxis 
                      yAxisId="left"
                      tickFormatter={formatYAxisDynamic}
                      stroke={CHART_COLORS.primary}
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      stroke={CHART_COLORS.secondary}
                    />
                    <RechartsTooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-4 rounded-md shadow-md border border-gray-200">
                              <p className="font-bold">{new Date(data.month).toLocaleDateString('default', { month: 'long', year: 'numeric' })}</p>
                              <p className="text-purple-500">Commission : {data.totalCommission.toFixed(1)}</p>
                              {/* Show NGR without negation */}
                              <p className="text-amber-500">NGR : {data.totalNGR.toFixed(2)}</p>
                              <p className="text-green-500">Referees : {data.uniqueReferees}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    <Bar 
                      yAxisId="left" 
                      dataKey="totalCommission" 
                      name="Commission" 
                      fill={CHART_COLORS.primary} 
                    />
                    {/* For the NGR bar, display without negation */}
                    <Bar 
                      yAxisId="left" 
                      dataKey="totalNGR" 
                      name="NGR" 
                      fill={CHART_COLORS.tertiary} 
                    />
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="uniqueReferees" 
                      name="Referees" 
                      stroke={CHART_COLORS.secondary} 
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Commission Trend Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer>
                    <LineChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                      <XAxis 
                        dataKey="month" 
                        tickFormatter={(value: string) => new Date(value).toLocaleDateString('default', { month: 'short' })}
                      />
                      <YAxis 
                        tickFormatter={(value) => formatYAxisDynamic(value)} 
                      />
                      <RechartsTooltip 
                        formatter={(value) => formatCurrency(Number(value))}
                        labelFormatter={(value: string) => new Date(value).toLocaleDateString('default', { year: 'numeric', month: 'long' })}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="totalCommission" 
                        name="Total Commission" 
                        stroke={CHART_COLORS.primary} 
                        activeDot={{ r: 8 }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="averageCommission" 
                        name="Avg Commission" 
                        stroke={CHART_COLORS.quaternary} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Referee Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer>
                    <ComposedChart data={refereeActivityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                      <XAxis 
                        dataKey="month" 
                        tickFormatter={(value: string) => new Date(value).toLocaleDateString('default', { month: 'short' })}
                      />
                      <YAxis 
                        yAxisId="left" 
                        tickFormatter={(value) => formatYAxisDynamic(value)} 
                      />
                      <YAxis yAxisId="right" orientation="right" />
                      <RechartsTooltip 
                        formatter={(value: number, name: string) => {
                          if (name === "Deposits" || name === "NGR") {
                            return [formatCurrency(value), name];
                          }
                          return [value, name];
                        }}
                        labelFormatter={(value: string) => new Date(value).toLocaleDateString('default', { year: 'numeric', month: 'long' })}
                      />
                      <Legend />
                      <Bar 
                        yAxisId="left" 
                        dataKey="totalDeposit" 
                        name="Deposits" 
                        fill={CHART_COLORS.tertiary} 
                      />
                      <Bar 
                        yAxisId="left" 
                        dataKey="ngr" 
                        name="NGR" 
                        fill={CHART_COLORS.primary} 
                      />
                      <Line
                        yAxisId="right" 
                        type="monotone" 
                        dataKey="activeReferees" 
                        name="Active Referees" 
                        stroke={CHART_COLORS.secondary} 
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <CardTitle>Monthly Commission Data</CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="inline-flex items-center justify-center rounded-full w-5 h-5 text-muted-foreground hover:text-foreground hover:bg-muted">
                        <Info className="h-3.5 w-3.5" />
                        <span className="sr-only">Info</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p>Transactions occurring between March 31, 2025, and April 6, 2025, are included in the March 2025 data, as the data is categorized by week, and this week falls within March.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Referees</TableHead>
                      <TableHead>Avg Commission</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comparisonData.map((month, index) => {
                      return (
                        <TableRow key={month.month}>
                          <TableCell>{new Date(month.month).toLocaleDateString('default', { year: 'numeric', month: 'long' })}</TableCell>
                          <TableCell>{formatCurrency(month.totalCommission)}</TableCell>
                          <TableCell>{month.uniqueReferees}</TableCell>
                          <TableCell>{formatCurrency(month.averageCommission)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Referee Activity Table - Update to show monthly data */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <CardTitle>Referee Performance Data</CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="inline-flex items-center justify-center rounded-full w-5 h-5 text-muted-foreground hover:text-foreground hover:bg-muted">
                        <Info className="h-3.5 w-3.5" />
                        <span className="sr-only">Info</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p>This table displays aggregated referee activity metrics by month. Click on a month row to see individual referee performance for that period.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead>Deposits</TableHead>
                      <TableHead>Withdrawals</TableHead>
                      <TableHead>Bonus Amount</TableHead>
                      <TableHead>Rewards</TableHead>
                      <TableHead>Valid Turnover</TableHead>
                      <TableHead>NGR</TableHead>
                      <TableHead>Active Referees</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {refereeActivityData.map((data, index) => {
                      // Get previous month data for trend indicators
                      const prevMonthData = index > 0 ? refereeActivityData[index - 1] : null;
                      
                      // Calculate trends
                      const depositTrend = prevMonthData ? data.totalDeposit - prevMonthData.totalDeposit : 0;
                      const ngrTrend = prevMonthData ? data.ngr - prevMonthData.ngr : 0;
                      const refereeTrend = prevMonthData ? data.activeReferees - prevMonthData.activeReferees : 0;
                      
                      return (
                        <>
                          <TableRow 
                            key={data.month} 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => toggleMonthExpand(data.month, data.monthDate)}
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center">
                                {expandedMonths[data.month] ? 
                                  <ChevronDown className="mr-2 h-4 w-4" /> : 
                                  <ChevronUp className="mr-2 h-4 w-4 rotate-180" />
                                }
                                {new Date(data.monthDate).toLocaleDateString('default', { year: 'numeric', month: 'long' })}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                {formatCurrency(data.totalDeposit)}
                                {prevMonthData && (
                                  <span className={`ml-2 ${depositTrend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {depositTrend >= 0 ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{formatCurrency(data.totalWithdrawal)}</TableCell>
                            <TableCell>{formatCurrency(data.totalBonusAmount)}</TableCell>
                            <TableCell>{formatCurrency(data.totalReward)}</TableCell>
                            <TableCell>{formatCurrency(data.totalValidTurnover)}</TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                {formatCurrency(data.ngr)}
                                {prevMonthData && (
                                  <span className={`ml-2 ${ngrTrend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {ngrTrend >= 0 ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                {data.activeReferees}
                                {prevMonthData && (
                                  <span className={`ml-2 ${refereeTrend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {refereeTrend >= 0 ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                          
                          {/* Expanded referee details */}
                          {expandedMonths[data.month] && (
                            <>
                              <TableRow className="bg-muted/20">
                                <TableCell colSpan={8} className="p-0">
                                  <div className="p-2">
                                    <div className="rounded-md border">
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead>Referee</TableHead>
                                            <TableHead>Deposits</TableHead>
                                            <TableHead>Withdrawals</TableHead>
                                            <TableHead>Bonus Amount</TableHead>
                                            <TableHead>Rewards</TableHead>
                                            <TableHead>Valid Turnover</TableHead>
                                            <TableHead>NGR</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {refereeDetails[data.month] ? (
                                            refereeDetails[data.month].length > 0 ? (
                                              refereeDetails[data.month].map(referee => (
                                                <TableRow key={referee.refereeId}>
                                                  <TableCell>{referee.refereeLogin}</TableCell>
                                                  <TableCell>{formatCurrency(referee.totalDeposit)}</TableCell>
                                                  <TableCell>{formatCurrency(referee.totalWithdrawal)}</TableCell>
                                                  <TableCell>{formatCurrency(referee.totalBonusAmount)}</TableCell>
                                                  <TableCell>{formatCurrency(referee.totalReward)}</TableCell>
                                                  <TableCell>{formatCurrency(referee.totalValidTurnover)}</TableCell>
                                                  <TableCell>{formatCurrency(referee.ngr)}</TableCell>
                                                </TableRow>
                                              ))
                                            ) : (
                                              <TableRow>
                                                <TableCell colSpan={7} className="text-center py-4">
                                                  No referee data available for this month
                                                </TableCell>
                                              </TableRow>
                                            )
                                          ) : (
                                            <TableRow>
                                              <TableCell colSpan={7} className="text-center py-4">
                                                <div className="flex justify-center">
                                                  <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                  <span className="ml-2">Loading referee details...</span>
                                                </div>
                                              </TableCell>
                                            </TableRow>
                                          )}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            </>
                          )}
                        </>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}