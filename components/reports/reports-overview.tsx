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
import { DollarSign, Users, TrendingUp, ArrowUpRight } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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
}

const CHART_COLORS = {
  primary: '#8884d8',
  secondary: '#82ca9d',
  tertiary: '#ffc658',
  background: '#ffffff',
  grid: '#f0f0f0',
  text: '#64748b', // Slate-500 for text
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

export default function ReportsOverview() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
  const [reportData, setReportData] = useState<CommissionReport | null>(null);
  const [monthlyTrends, setMonthlyTrends] = useState<CommissionReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, [selectedYear, selectedMonth]);

  const fetchReportData = async () => {
    try {
      const response = await fetch(
        `/api/reports/commission?year=${selectedYear}&month=${selectedMonth}`
      );
      const data = await response.json();
      setReportData(data.report);
      setMonthlyTrends(data.trends);
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Date Filter Controls */}
      <div className="flex gap-4">
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Year" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Month" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
              <SelectItem key={month} value={month.toString()}>
                {new Date(2000, month - 1).toLocaleString('default', { month: 'long' })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(reportData?.totalCommission || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Referees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData?.uniqueReferees || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Commission</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(reportData?.averageCommission || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total NGR</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(reportData?.totalNGR || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Commission Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Commission & Referee Trends</CardTitle>
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
                  dataKey="month" 
                  tick={{ fill: CHART_COLORS.text, fontSize: CHART_STYLES.fontSize.small }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('default', { month: 'short' })}
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
                <Tooltip 
                  contentStyle={CHART_STYLES.tooltip}
                  labelStyle={{ color: CHART_COLORS.text, fontWeight: 600 }}
                  formatter={(value, name) => [
                    name === "Commission" ? formatCurrency(Number(value)) : `${value} referees`,
                    name
                  ]}
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
        {/* Performance Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Referee Performance Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[reportData?.refereePerformance].filter(Boolean)}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                  <YAxis 
                    type="category" 
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value) => formatCurrency(Number(value))}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="totalDeposit" 
                    name="Deposits" 
                    fill="#0088FE"
                    radius={[0, 4, 4, 0]}
                  />
                  <Bar 
                    dataKey="totalTurnover" 
                    name="Turnover" 
                    fill="#00C49F"
                    radius={[0, 4, 4, 0]}
                  />
                  <Bar 
                    dataKey="totalWinLoss" 
                    name="Win/Loss" 
                    fill="#FFBB28"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Commission Distribution Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Commission Distribution by Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer>
                <BarChart
                  data={[
                    {
                      name: 'Level 1',
                      commission: reportData?.level1Commission || 0,
                      referees: reportData?.level1Referees || 0
                    },
                    {
                      name: 'Level 2',
                      commission: reportData?.level2Commission || 0,
                      referees: reportData?.level2Referees || 0
                    },
                    {
                      name: 'Level 3',
                      commission: reportData?.level3Commission || 0,
                      referees: reportData?.level3Referees || 0
                    }
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke={CHART_COLORS.grid}
                    vertical={false}
                  />
                  <XAxis 
                    dataKey="name"
                    tick={{ fill: CHART_COLORS.text, fontSize: CHART_STYLES.fontSize.small }}
                    axisLine={{ stroke: CHART_COLORS.grid }}
                  />
                  <YAxis 
                    yAxisId="left"
                    orientation="left"
                    tickFormatter={(value) => formatCurrency(value)}
                    tick={{ fill: CHART_COLORS.text, fontSize: CHART_STYLES.fontSize.small }}
                    axisLine={{ stroke: CHART_COLORS.grid }}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    tickFormatter={(value) => `${Math.round(value)} refs`}
                    tick={{ fill: CHART_COLORS.text, fontSize: CHART_STYLES.fontSize.small }}
                    axisLine={{ stroke: CHART_COLORS.grid }}
                  />
                  <Tooltip 
                    contentStyle={CHART_STYLES.tooltip}
                    labelStyle={{ color: CHART_COLORS.text, fontWeight: 600 }}
                    formatter={(value, name) => {
                      if (name === "Commission") {
                        return [formatCurrency(Number(value)), name];
                      }
                      return [`${Math.round(Number(value))} referees`, "Referees"];
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: CHART_STYLES.fontSize.normal }}
                  />
                  <Bar 
                    yAxisId="left"
                    dataKey="commission" 
                    fill={CHART_COLORS.primary}
                    name="Commission"
                    radius={[4, 4, 0, 0]}
                  >
                    <LabelList 
                      dataKey="commission" 
                      position="top" 
                      formatter={(value) => formatCurrency(Number(value))}
                      style={{ fontSize: CHART_STYLES.fontSize.small, fill: CHART_COLORS.text }}
                    />
                  </Bar>
                  <Bar 
                    yAxisId="right"
                    dataKey="referees" 
                    fill={CHART_COLORS.secondary}
                    name="Referees"
                    radius={[4, 4, 0, 0]}
                  >
                    <LabelList 
                      dataKey="referees" 
                      position="top"
                      formatter={(value) => `${Math.round(Number(value))}`}
                      style={{ fontSize: CHART_STYLES.fontSize.small, fill: CHART_COLORS.text }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}