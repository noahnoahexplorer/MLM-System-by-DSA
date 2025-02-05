"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Users, ArrowUpRight } from "lucide-react";

interface DashboardStats {
  currentWeekCommission: number;
  previousWeekCommission: number;
  averageCommission: number;
  totalMembers: number;
  activeMembers: number;
  highestCommission: number;
}

export default function DashboardMetrics() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    currentWeekCommission: 0,
    previousWeekCommission: 0,
    averageCommission: 0,
    totalMembers: 0,
    activeMembers: 0,
    highestCommission: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

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
            {formatCurrency(stats.currentWeekCommission, 'PHP')}
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <ArrowUpRight className="mr-1 h-4 w-4" />
            {calculateGrowth(stats.currentWeekCommission, stats.previousWeekCommission).toFixed(1)}%
            <span className="ml-1">vs last week</span>
          </div>
        </CardContent>
      </Card>
      
      {/* Similar cards for Average Commission, Active Members, and Highest Commission */}
    </div>
  );
} 