"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Users, ArrowUpRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface CommissionMetrics {
  weeklyCommission: number;
  weeklyGrowth: number;
  activeMembers: number;
  averageCommission: number;
  topCommission: number;
}

export default function DashboardMetrics() {
  const [metrics, setMetrics] = useState<CommissionMetrics>({
    weeklyCommission: 0,
    weeklyGrowth: 0,
    activeMembers: 0,
    averageCommission: 0,
    topCommission: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const response = await fetch('/api/dashboard/metrics');
        const data = await response.json();
        setMetrics(data);
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Weekly Commission
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(metrics.weeklyCommission, 'PHP')}
          </div>
          <p className="text-xs text-muted-foreground">
            {metrics.weeklyGrowth > 0 ? '+' : ''}{metrics.weeklyGrowth}% from last week
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Active Members
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.activeMembers}</div>
          <p className="text-xs text-muted-foreground">
            Members with commission this week
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Average Commission
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(metrics.averageCommission, 'PHP')}
          </div>
          <p className="text-xs text-muted-foreground">
            Per active member
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Highest Commission
          </CardTitle>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(metrics.topCommission, 'PHP')}
          </div>
          <p className="text-xs text-muted-foreground">
            Top earner this week
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 