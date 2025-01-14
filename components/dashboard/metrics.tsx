"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, TrendingUp, ArrowUpRight } from "lucide-react";
import { DailyCommission, ReferralNetwork } from "@/lib/types";

const formatCurrency = (value: number | null) => {
  if (value === null || value === undefined) return "$0.00";
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

interface MonthlyStats {
  month: string;
  ngr: {
    tier1: number;
    tier2: number;
    tier3: number;
  };
  commission: {
    tier1: number;
    tier2: number;
    tier3: number;
  };
  activeMembers: Set<string>;
}

export default function DashboardMetrics() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    monthlyStats: { [key: string]: MonthlyStats };
    totalCommission: number;
    activeReferrals: Set<string>;
    totalMembers: number;
  }>({
    monthlyStats: {},
    totalCommission: 0,
    activeReferrals: new Set(),
    totalMembers: 0,
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/mlm-network');
        const { commission, network } = await response.json();

        const newStats = {
          monthlyStats: {} as { [key: string]: MonthlyStats },
          totalCommission: 0,
          activeReferrals: new Set<string>(),
          totalMembers: new Set(network.map((r: ReferralNetwork) => r.REFEREE_LOGIN)).size
        };

        // Process commission data
        commission.forEach((record: DailyCommission) => {
          const month = record.SUMMARY_MONTH;
          const tier = record.RELATIVE_LEVEL;
          
          // Skip if not in tier 1-3
          if (tier < 1 || tier > 3) return;
          
          // Initialize monthly stats if not exists
          if (!newStats.monthlyStats[month]) {
            newStats.monthlyStats[month] = {
              month,
              ngr: { tier1: 0, tier2: 0, tier3: 0 },
              commission: { tier1: 0, tier2: 0, tier3: 0 },
              activeMembers: new Set(),
            };
          }

          // Update monthly stats
          newStats.monthlyStats[month].ngr[`tier${tier}` as keyof typeof newStats.monthlyStats[typeof month]['ngr']] += record.TOTAL_WIN_LOSS || 0;
          newStats.monthlyStats[month].commission[`tier${tier}` as keyof typeof newStats.monthlyStats[typeof month]['commission']] += record.LOCAL_COMMISSION_AMOUNT || 0;
          
          // Track unique members
          newStats.monthlyStats[month].activeMembers.add(record.MEMBER_LOGIN);

          // Update total commission
          newStats.totalCommission += record.LOCAL_COMMISSION_AMOUNT || 0;

          // Track active referrals (members with any NGR or commission)
          if (record.TOTAL_WIN_LOSS !== 0 || record.LOCAL_COMMISSION_AMOUNT !== 0) {
            newStats.activeReferrals.add(record.MEMBER_LOGIN);
          }
        });

        setStats(newStats);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Calculate current month's stats
  const currentMonth = new Date().toISOString().slice(0, 7); // Format: YYYY-MM
  const currentMonthStats = stats.monthlyStats[currentMonth] || {
    ngr: { tier1: 0, tier2: 0, tier3: 0 },
    commission: { tier1: 0, tier2: 0, tier3: 0 },
    activeMembers: new Set()
  };

  const totalNGR = Object.values(currentMonthStats.ngr).reduce((sum, val) => sum + val, 0);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Monthly NGR
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalNGR)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Monthly Commission
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(
              Object.values(currentMonthStats.commission).reduce((sum, val) => sum + val, 0)
            )}
          </div>
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
          <div className="text-2xl font-bold">
            {currentMonthStats.activeMembers.size}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Network Size
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalMembers}</div>
        </CardContent>
      </Card>
    </div>
  );
}