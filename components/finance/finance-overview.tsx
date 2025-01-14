"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Calendar, ChevronDown, ChevronRight } from "lucide-react";
import { MLMNetworkData } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { subDays } from "date-fns";
import { useSearchParams } from "next/navigation";
import { DailyCommission } from "@/lib/types";

// Helper function to format currency
const formatCurrency = (value: number | null) => {
  if (value === null || value === undefined) return "$0.00";
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

interface TierStats {
  ngr: number;
  commission: number;
  members: Set<string>;
}

interface DailyStats {
  ngr: number;
  commission: number;
  tierDetails: {
    [tier: number]: {
      ngr: number;
      commission: number;
    };
  };
}

const DATE_RANGES = {
  "7d": "Last 7 Days",
  "30d": "Last 30 Days",
  "90d": "Last 90 Days",
  "all": "All Time"
};

export default function FinanceOverview() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<MLMNetworkData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [dateRange, setDateRange] = useState("30d");
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [memberStats, setMemberStats] = useState<{
    tiers: {
      [key: number]: TierStats;
    };
    totalNGR: number;
    totalCommission: number;
    dailyStats: {
      [date: string]: DailyStats;
    };
  } | null>(null);

  const getDateRangeFilter = () => {
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
        startDate = new Date(0); // All time
    }

    return { startDate, endDate };
  };

  // Move handleSearch to useCallback to avoid recreation
  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/mlm-network");
      const result = await response.json();
      const searchLower = searchTerm.toLowerCase();

      // Get date range filter
      const { startDate, endDate } = getDateRangeFilter();

      // Filter data by date range
      const filteredData = result.data.filter((m: MLMNetworkData) => {
        const date = new Date(m.SUMMARIZE_DATE);
        return date >= startDate && date <= endDate;
      });

      // Find the searched member's latest record
      const memberRecords = filteredData.filter((m: MLMNetworkData) => 
        m.MEMBER_LOGIN.toLowerCase() === searchLower ||
        m.MEMBER_ID.toLowerCase() === searchLower
      );

      if (memberRecords.length > 0) {
        // Use the latest record for member information
        const latestMember = memberRecords.reduce((latest: MLMNetworkData, current: MLMNetworkData) => {
          const latestDate = new Date(latest.SUMMARIZE_DATE);
          const currentDate = new Date(current.SUMMARIZE_DATE);
          return currentDate > latestDate ? current : latest;
        });

        setData(filteredData);
        setMemberStats(calculateStats(latestMember, filteredData));
      } else {
        setData([]);
        setMemberStats(null);
      }

      setHasSearched(true);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, dateRange]); // Update dependencies to include dateRange instead of getDateRangeFilter

  // Handle URL parameters on component mount
  useEffect(() => {
    const memberParam = searchParams.get('member');
    const dateRangeParam = searchParams.get('dateRange');

    if (memberParam) {
      setSearchTerm(memberParam);
      if (dateRangeParam && Object.keys(DATE_RANGES).includes(dateRangeParam)) {
        setDateRange(dateRangeParam);
      }
    }
  }, [searchParams]);

  // Separate effect for auto-search when parameters change
  useEffect(() => {
    if (searchTerm) {
      handleSearch();
    }
  }, [searchTerm, dateRange, handleSearch]);

  const toggleDateExpansion = (date: string) => {
    const newExpandedDates = new Set(expandedDates);
    if (newExpandedDates.has(date)) {
      newExpandedDates.delete(date);
    } else {
      newExpandedDates.add(date);
    }
    setExpandedDates(newExpandedDates);
  };

  const calculateStats = (memberLogin: string, commissionData: DailyCommission[]) => {
    const tiers: { [key: number]: TierStats } = {
      1: { ngr: 0, commission: 0, members: new Set<string>() },
      2: { ngr: 0, commission: 0, members: new Set<string>() },
      3: { ngr: 0, commission: 0, members: new Set<string>() },
    };

    const dailyStats: { [date: string]: DailyStats } = {};

    // Filter for the specific member's data
    const memberData = commissionData.filter(
      record => record.MEMBER_LOGIN === memberLogin
    );

    memberData.forEach(record => {
      const month = record.SUMMARY_MONTH;
      const tier = record.RELATIVE_LEVEL;

      // Skip if not in tier 1-3
      if (tier < 1 || tier > 3) return;

      // Initialize daily stats if not exists
      if (!dailyStats[month]) {
        dailyStats[month] = {
          ngr: 0,
          commission: 0,
          tierDetails: {
            1: { ngr: 0, commission: 0 },
            2: { ngr: 0, commission: 0 },
            3: { ngr: 0, commission: 0 },
          },
        };
      }

      // Update tier statistics
      tiers[tier].ngr += record.TOTAL_WIN_LOSS || 0;
      tiers[tier].commission += record.LOCAL_COMMISSION_AMOUNT || 0;
      tiers[tier].members.add(record.RELATIVE_LEVEL_REFEREE);

      // Update daily stats
      dailyStats[month].tierDetails[tier].ngr += record.TOTAL_WIN_LOSS || 0;
      dailyStats[month].tierDetails[tier].commission += record.LOCAL_COMMISSION_AMOUNT || 0;
      
      // Update daily totals
      dailyStats[month].ngr += record.TOTAL_WIN_LOSS || 0;
      dailyStats[month].commission += record.LOCAL_COMMISSION_AMOUNT || 0;
    });

    const totalNGR = Object.values(dailyStats).reduce((sum, day) => sum + day.ngr, 0);
    const totalCommission = Object.values(dailyStats).reduce((sum, day) => sum + day.commission, 0);

    return {
      tiers,
      totalNGR,
      totalCommission,
      dailyStats,
    };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by member ID or login..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
          />
        </div>
        <Select
          value={dateRange}
          onValueChange={(value) => {
            setDateRange(value);
            if (hasSearched) {
              handleSearch();
            }
          }}
        >
          <SelectTrigger className="w-[180px]">
            <Calendar className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Select date range" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(DATE_RANGES).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleSearch} disabled={!searchTerm.trim()}>
          Search
        </Button>
      </div>

      {loading ? (
        <div className="flex h-[600px] items-center justify-center">
          Loading...
        </div>
      ) : hasSearched ? (
        memberStats ? (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total NGR
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(memberStats.totalNGR)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Commission
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(memberStats.totalCommission)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tier Details Table */}
            <Card>
              <CardHeader>
                <CardTitle>Tier Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tier</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead className="text-right">NGR</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                      <TableHead className="text-right">Commission Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(memberStats.tiers).map(([tier, stats]) => (
                      <TableRow key={tier}>
                        <TableCell>Tier {tier}</TableCell>
                        <TableCell>{stats.members.size}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(stats.ngr)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(stats.commission)}
                        </TableCell>
                        <TableCell className="text-right">
                          {stats.ngr > 0
                            ? `${((stats.commission / stats.ngr) * 100).toFixed(2)}%`
                            : "0.00%"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Daily Stats Table */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead></TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">NGR</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                      <TableHead className="text-right">Commission Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(memberStats.dailyStats)
                      .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
                      .map(([date, stats]) => (
                        <>
                          <TableRow 
                            key={date}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => toggleDateExpansion(date)}
                          >
                            <TableCell>
                              {expandedDates.has(date) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </TableCell>
                            <TableCell>{date}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(stats.ngr)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(stats.commission)}
                            </TableCell>
                            <TableCell className="text-right">
                              {stats.ngr > 0
                                ? `${((stats.commission / stats.ngr) * 100).toFixed(2)}%`
                                : "0.00%"}
                            </TableCell>
                          </TableRow>
                          {expandedDates.has(date) && (
                            <>
                              {[1, 2, 3].map((tier) => (
                                <TableRow key={`${date}-tier-${tier}`} className="bg-muted/50">
                                  <TableCell></TableCell>
                                  <TableCell className="pl-8">Tier {tier}</TableCell>
                                  <TableCell className="text-right">
                                    {formatCurrency(stats.tierDetails[tier].ngr)}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {formatCurrency(stats.tierDetails[tier].commission)}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {stats.tierDetails[tier].ngr > 0
                                      ? `${((stats.tierDetails[tier].commission / stats.tierDetails[tier].ngr) * 100).toFixed(2)}%`
                                      : "0.00%"}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </>
                          )}
                        </>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex h-[600px] items-center justify-center text-muted-foreground">
            No results found
          </div>
        )
      ) : (
        <div className="flex h-[600px] items-center justify-center text-muted-foreground">
          Enter a member ID or login to view finance details
        </div>
      )}
    </div>
  );
} 