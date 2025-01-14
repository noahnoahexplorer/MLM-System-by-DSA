"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DailyCommission, ReferralNetwork } from "@/lib/types";
import {
  Bar,
  BarChart,
  ChartContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "@/components/ui/chart";

interface DailyMembershipStats {
  date: string;
  totalMembers: number;
  newMembers: number;
  activeMembers: number;
}

export default function MembershipChart() {
  const [data, setData] = useState<DailyMembershipStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/mlm-network');
        const { commission, network } = await response.json();

        // Get last 7 months
        const endDate = new Date();
        const months = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(endDate);
          d.setMonth(d.getMonth() - i);
          return d.toISOString().slice(0, 7); // Format: YYYY-MM
        });

        // Process data by month
        const monthlyStats = months.map(month => {
          // Get all members created this month
          const newMembers = network.filter((m: ReferralNetwork) => 
            m.CREATED_DATE.startsWith(month)
          ).length;

          // Get active members for this month
          const activeMembers = new Set(
            commission
              .filter((c: DailyCommission) => 
                c.SUMMARY_MONTH === month &&
                (c.TOTAL_WIN_LOSS !== 0 || c.LOCAL_COMMISSION_AMOUNT !== 0)
              )
              .map((c: DailyCommission) => c.MEMBER_LOGIN)
          ).size;

          // Calculate total members up to this month
          const totalMembers = network.filter((m: ReferralNetwork) => 
            m.CREATED_DATE <= month + '-31'
          ).length;

          return {
            date: new Date(month + '-01').toLocaleDateString('en-US', { 
              month: 'short', 
              year: 'numeric'
            }),
            totalMembers,
            newMembers,
            activeMembers
          };
        });

        setData(monthlyStats.reverse()); // Most recent first
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const chartConfig = {
    "Total Members": {
      color: "hsl(var(--primary))",
      label: "Total Members",
    },
    "New Members": {
      color: "hsl(var(--success))",
      label: "New Members",
    },
    "Active Members": {
      color: "hsl(var(--warning))",
      label: "Active Members",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Membership Growth</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-[350px] items-center justify-center">
            Loading...
          </div>
        ) : (
          <ChartContainer className="h-[350px]" config={chartConfig}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 40, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date"
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis
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
                dataKey="totalMembers"
                radius={[4, 4, 0, 0]}
                name="Total Members"
              />
              <Bar
                dataKey="newMembers"
                radius={[4, 4, 0, 0]}
                name="New Members"
              />
              <Bar
                dataKey="activeMembers"
                radius={[4, 4, 0, 0]}
                name="Active Members"
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}