"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { subDays } from "date-fns";
import { MLMNetworkData } from "@/lib/types";
import { DollarSign, Users, TrendingUp, ArrowUpRight } from "lucide-react";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ChartContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "@/components/ui/chart";

// Helper function to format currency
const formatCurrency = (value: number | null) => {
  if (value === null || value === undefined) return "$0.00";
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

interface DailyStats {
  date: string;
  revenue: number;
  newMembers: number;
  activeMembers: number;
  commission: number;
}

interface MemberPerformance {
  memberId: string;
  memberLogin: string;
  level: string;
  totalNGR: number;
  commission: number;
  activeReferrals: number;
}

interface NetworkStats {
  level: string;
  members: number;
}

// Add a custom tick style for better axis appearance
const CustomAxisTick = (props: any) => {
  const { x, y, payload } = props;
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={16}
        textAnchor="middle"
        fill="hsl(var(--muted-foreground))"
        className="text-xs font-medium"
      >
        {payload.value}
      </text>
    </g>
  );
};

// Add custom Y axis tick for currency values
const CurrencyAxisTick = (props: any) => {
  const { x, y, payload } = props;
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dx={-10}
        textAnchor="end"
        fill="hsl(var(--muted-foreground))"
        className="text-xs font-medium"
      >
        {formatCurrency(payload.value)}
      </text>
    </g>
  );
};

export default function ReportsOverview() {
  const [dateRange, setDateRange] = useState("7d");
  const [data, setData] = useState<MLMNetworkData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [topPerformers, setTopPerformers] = useState<MemberPerformance[]>([]);
  const [networkStats, setNetworkStats] = useState<NetworkStats[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/mlm-network');
        const result = await response.json();
        
        // Get date range
        const endDate = new Date();
        let startDate: Date;
        
        switch (dateRange) {
          case "7d":
            startDate = subDays(endDate, 7);
            break;
          case "30d":
            startDate = subDays(endDate, 30);
            break;
          case "90d":
            startDate = subDays(endDate, 90);
            break;
          default:
            startDate = new Date(0);
        }

        // Filter data by date range
        const filteredData = result.data.filter((m: MLMNetworkData) => {
          const date = new Date(m.SUMMARIZE_DATE);
          return date >= startDate && date <= endDate;
        });

        setData(filteredData);

        // Process daily stats
        const dailyStatsMap = new Map<string, DailyStats>();
        const memberPerformanceMap = new Map<string, MemberPerformance>();
        const networkLevels = new Map<string, number>();

        filteredData.forEach((record: MLMNetworkData) => {
          // Daily stats processing
          const date = new Date(record.SUMMARIZE_DATE).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric'
          });

          const dailyStat = dailyStatsMap.get(date) || {
            date,
            revenue: 0,
            newMembers: 0,
            activeMembers: 0,
            commission: 0
          };

          dailyStat.revenue += (record.TIER1_DAILY_NGR || 0) + 
                             (record.TIER2_DAILY_NGR || 0) + 
                             (record.TIER3_DAILY_NGR || 0);
          dailyStat.commission += (record.TIER1_COMMISSION || 0) + 
                                (record.TIER2_COMMISSION || 0) + 
                                (record.TIER3_COMMISSION || 0);

          // Check if member is active
          if (dailyStat.revenue > 0 || dailyStat.commission > 0) {
            dailyStat.activeMembers++;
          }

          // Check if this is a new member
          const createdDate = new Date(record.CREATED_DATE);
          if (
            createdDate.toDateString() === new Date(record.SUMMARIZE_DATE).toDateString()
          ) {
            dailyStat.newMembers++;
          }

          dailyStatsMap.set(date, dailyStat);

          // Member performance processing
          const memberPerf = memberPerformanceMap.get(record.MEMBER_ID) || {
            memberId: record.MEMBER_ID,
            memberLogin: record.MEMBER_LOGIN,
            level: record.MEMBERSHIP_LEVEL,
            totalNGR: 0,
            commission: 0,
            activeReferrals: 0
          };

          memberPerf.totalNGR += (record.TIER1_DAILY_NGR || 0) + 
                                (record.TIER2_DAILY_NGR || 0) + 
                                (record.TIER3_DAILY_NGR || 0);
          memberPerf.commission += (record.TIER1_COMMISSION || 0) + 
                                 (record.TIER2_COMMISSION || 0) + 
                                 (record.TIER3_COMMISSION || 0);

          if (record.DESCENDANTS_LOGIN && record.DESCENDANTS_LOGIN !== '[]') {
            const referrals = new Set(
              record.DESCENDANTS_LOGIN
                .replace('[', '')
                .replace(']', '')
                .split(',')
                .map(path => path.split(':')[1])
                .filter(Boolean)
            );
            memberPerf.activeReferrals = referrals.size;
          }

          memberPerformanceMap.set(record.MEMBER_ID, memberPerf);

          // Network level processing
          if (record.DESCENDANTS_LOGIN && record.DESCENDANTS_LOGIN !== '[]') {
            record.DESCENDANTS_LOGIN
              .replace('[', '')
              .replace(']', '')
              .split(',')
              .forEach(path => {
                const level = path.split(':').length - 1;
                networkLevels.set(
                  `Level ${level}`, 
                  (networkLevels.get(`Level ${level}`) || 0) + 1
                );
              });
          }
        });

        // Sort and set the processed data
        setDailyStats(Array.from(dailyStatsMap.values())
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));

        setTopPerformers(Array.from(memberPerformanceMap.values())
          .sort((a, b) => b.totalNGR - a.totalNGR)
          .slice(0, 10));

        setNetworkStats(Array.from(networkLevels.entries())
          .map(([level, members]) => ({ level, members }))
          .sort((a, b) => parseInt(a.level.split(' ')[1]) - parseInt(b.level.split(' ')[1])));

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    }

    fetchData();
  }, [dateRange]);

  const totalRevenue = dailyStats.reduce((sum, day) => sum + day.revenue, 0);
  const totalCommission = dailyStats.reduce((sum, day) => sum + day.commission, 0);
  const totalNewMembers = dailyStats.reduce((sum, day) => sum + day.newMembers, 0);
  const averageActiveMembers = Math.round(
    dailyStats.reduce((sum, day) => sum + day.activeMembers, 0) / (dailyStats.length || 1)
  );

  // Format data for shadcn charts
  const revenueChartData = dailyStats.map(stat => ({
    name: stat.date,
    revenue: stat.revenue,
    commission: stat.commission,
  }));

  const memberActivityData = dailyStats.map(stat => ({
    name: stat.date,
    "Active Members": stat.activeMembers,
    "New Members": stat.newMembers,
  }));

  const networkStatsData = networkStats.map(stat => ({
    name: stat.level,
    total: stat.members,
  }));

  // Update the chart configurations
  const chartConfig = {
    revenue: {
      color: "hsl(var(--primary))",
      label: "Revenue",
    },
    commission: {
      color: "hsl(var(--success))",
      label: "Commission",
    },
    "Active Members": {
      color: "hsl(var(--primary))",
      label: "Active Members",
    },
    "New Members": {
      color: "hsl(var(--success))",
      label: "New Members",
    },
    total: {
      color: "hsl(var(--primary))",
      label: "Total",
    },
  };

  return (
    <Tabs defaultValue="financial" className="space-y-4">
      <div className="flex items-center justify-between">
        <TabsList>
          <TabsTrigger value="financial">Financial Reports</TabsTrigger>
          <TabsTrigger value="members">Member Activity</TabsTrigger>
          <TabsTrigger value="network">Network Analysis</TabsTrigger>
        </TabsList>
        <Select
          value={dateRange}
          onValueChange={setDateRange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Financial Reports Tab */}
      <TabsContent value="financial" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "Loading..." : formatCurrency(totalRevenue)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Commission
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "Loading..." : formatCurrency(totalCommission)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                New Members
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "Loading..." : totalNewMembers}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg. Active Members
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "Loading..." : averageActiveMembers}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer className="h-[300px]" config={chartConfig}>
                <LineChart data={revenueChartData} margin={{ top: 20, right: 30, left: 60, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="name" 
                    tick={CustomAxisTick}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    tick={CurrencyAxisTick}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    strokeWidth={2}
                    activeDot={{ r: 6, strokeWidth: 2 }}
                    dot={{ r: 4 }}
                    name="Revenue"
                  />
                  <Line
                    type="monotone"
                    dataKey="commission"
                    strokeWidth={2}
                    activeDot={{ r: 6, strokeWidth: 2 }}
                    dot={{ r: 4 }}
                    name="Commission"
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Member Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer className="h-[300px]" config={chartConfig}>
                <BarChart data={memberActivityData} margin={{ top: 20, right: 30, left: 40, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="name" 
                    tick={CustomAxisTick}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    tick={CustomAxisTick}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Bar
                    dataKey="Active Members"
                    radius={[6, 6, 0, 0]}
                    name="Active Members"
                  />
                  <Bar
                    dataKey="New Members"
                    radius={[6, 6, 0, 0]}
                    name="New Members"
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Top Performing Members</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead className="text-right">Total NGR</TableHead>
                  <TableHead className="text-right">Commission Earned</TableHead>
                  <TableHead className="text-right">Active Referrals</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topPerformers.map((member) => (
                  <TableRow key={member.memberId}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{member.memberLogin}</div>
                        <div className="text-sm text-muted-foreground">
                          ID: {member.memberId}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{member.level}</TableCell>
                    <TableCell className="text-right">{formatCurrency(member.totalNGR)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(member.commission)}</TableCell>
                    <TableCell className="text-right">{member.activeReferrals}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Member Activity Tab */}
      <TabsContent value="members" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Member Registration Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer className="h-[300px]" config={chartConfig}>
                <LineChart 
                  data={dailyStats.map(stat => ({
                    name: stat.date,
                    total: stat.newMembers,
                  }))}
                  margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="name" 
                    tick={CustomAxisTick}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    tick={CustomAxisTick}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    strokeWidth={2}
                    activeDot={{ r: 6, strokeWidth: 2 }}
                    dot={{ r: 4 }}
                    name="New Members"
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Members Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer className="h-[300px]" config={chartConfig}>
                <LineChart 
                  data={dailyStats.map(stat => ({
                    name: stat.date,
                    total: stat.activeMembers,
                  }))}
                  margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="name" 
                    tick={CustomAxisTick}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    tick={CustomAxisTick}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    strokeWidth={2}
                    activeDot={{ r: 6, strokeWidth: 2 }}
                    dot={{ r: 4 }}
                    name="Active Members"
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Network Analysis Tab */}
      <TabsContent value="network" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Network Depth Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer className="h-[300px]" config={chartConfig}>
                <BarChart data={networkStatsData} margin={{ top: 20, right: 30, left: 40, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="name" 
                    tick={CustomAxisTick}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    tick={CustomAxisTick}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Bar
                    dataKey="total"
                    radius={[6, 6, 0, 0]}
                    name="Members"
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Recruiters</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead className="text-right">Direct Referrals</TableHead>
                    <TableHead className="text-right">Total NGR</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topPerformers
                    .sort((a, b) => b.activeReferrals - a.activeReferrals)
                    .slice(0, 5)
                    .map((member) => (
                      <TableRow key={member.memberId}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{member.memberLogin}</div>
                            <div className="text-sm text-muted-foreground">
                              ID: {member.memberId}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{member.level}</TableCell>
                        <TableCell className="text-right">{member.activeReferrals}</TableCell>
                        <TableCell className="text-right">{formatCurrency(member.totalNGR)}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
} 