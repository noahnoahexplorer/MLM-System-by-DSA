"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface CommissionTrendsProps {
  className?: string;
}

interface WeeklyData {
  week: string;
  totalCommission: number;
  activeMembers: number;
}

export default function CommissionTrends({ className }: CommissionTrendsProps) {
  const [data, setData] = useState<WeeklyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrends() {
      try {
        const response = await fetch('/api/dashboard/trends');
        const result = await response.json();
        setData(result.weeklyTrends);
      } catch (error) {
        console.error('Error fetching commission trends:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTrends();
  }, []);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Commission Trends</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-[350px] items-center justify-center">
            Loading...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={data}>
              <XAxis
                dataKey="week"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `₱${value.toLocaleString()}`}
              />
              <Tooltip 
                formatter={(value: number) => [`₱${value.toLocaleString()}`, 'Commission']}
                labelFormatter={(label) => `Week: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="totalCommission"
                stroke="#8884d8"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
} 