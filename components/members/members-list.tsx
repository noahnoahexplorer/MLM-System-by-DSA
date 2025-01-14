"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Calendar } from "lucide-react";
import { DailyCommission, ReferralNetwork } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { subMonths } from "date-fns";
import { useRouter } from "next/navigation";

const formatCurrency = (value: number | null) => {
  if (value === null || value === undefined) return "$0.00";
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

interface MemberStats {
  memberId: string;
  memberLogin: string;
  currency: string;
  totalNGR: number;
  totalCommission: number;
  referralCount: number;
  lastActive: string;
  tierStats: {
    [key: number]: {
      ngr: number;
      commission: number;
    };
  };
}

const DATE_RANGES = {
  "3m": "Last 3 Months",
  "6m": "Last 6 Months",
  "12m": "Last 12 Months",
  "all": "All Time"
};

export default function MembersList() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [dateRange, setDateRange] = useState("6m");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof MemberStats;
    direction: "asc" | "desc";
  }>({ key: "lastActive", direction: "desc" });
  const [sortedData, setSortedData] = useState<MemberStats[]>([]);

  const getDateRangeFilter = () => {
    const endDate = new Date();
    let startDate: Date;

    switch (dateRange) {
      case "3m":
        startDate = subMonths(endDate, 3);
        break;
      case "6m":
        startDate = subMonths(endDate, 6);
        break;
      case "12m":
        startDate = subMonths(endDate, 12);
        break;
      default:
        startDate = new Date(0); // All time
    }

    return { startDate, endDate };
  };

  const aggregateData = (
    commissionData: DailyCommission[], 
    networkData: ReferralNetwork[]
  ): MemberStats[] => {
    const memberMap = new Map<string, MemberStats>();

    // First, process commission data
    commissionData.forEach(record => {
      if (!memberMap.has(record.MEMBER_ID)) {
        memberMap.set(record.MEMBER_ID, {
          memberId: record.MEMBER_ID,
          memberLogin: record.MEMBER_LOGIN,
          currency: record.MEMBER_CURRENCY,
          totalNGR: 0,
          totalCommission: 0,
          referralCount: 0,
          lastActive: record.SUMMARY_MONTH,
          tierStats: {},
        });
      }

      const stats = memberMap.get(record.MEMBER_ID)!;
      const tier = record.RELATIVE_LEVEL;

      // Initialize tier stats if not exists
      if (!stats.tierStats[tier]) {
        stats.tierStats[tier] = {
          ngr: 0,
          commission: 0,
        };
      }

      // Update NGR and commission for the tier
      stats.tierStats[tier].ngr += record.TOTAL_WIN_LOSS || 0;
      stats.tierStats[tier].commission += record.LOCAL_COMMISSION_AMOUNT || 0;

      // Update totals
      stats.totalNGR += record.TOTAL_WIN_LOSS || 0;
      stats.totalCommission += record.LOCAL_COMMISSION_AMOUNT || 0;

      // Update last active if current record is more recent
      if (record.SUMMARY_MONTH > stats.lastActive) {
        stats.lastActive = record.SUMMARY_MONTH;
      }
    });

    // Then, process network data for referral counts
    networkData.forEach(record => {
      const referrerId = record.REFERRER_ID;
      if (memberMap.has(referrerId)) {
        memberMap.get(referrerId)!.referralCount++;
      }
    });

    return Array.from(memberMap.values());
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/mlm-network");
      const { commission, network } = await response.json();
      const searchLower = searchTerm.toLowerCase();

      // Get date range filter
      const { startDate, endDate } = getDateRangeFilter();
      const startMonth = startDate.toISOString().slice(0, 7); // YYYY-MM format

      // Filter commission data by date range and search term
      const filteredCommission = commission.filter((m: DailyCommission) => {
        const matchesSearch = 
          m.MEMBER_LOGIN.toLowerCase().includes(searchLower) ||
          m.MEMBER_ID.toLowerCase().includes(searchLower);
        
        return m.SUMMARY_MONTH >= startMonth && matchesSearch;
      });

      // Filter network data by search term
      const filteredNetwork = network.filter((m: ReferralNetwork) => 
        m.REFERRER_LOGIN.toLowerCase().includes(searchLower) ||
        m.REFEREE_LOGIN.toLowerCase().includes(searchLower)
      );

      const aggregatedData = aggregateData(filteredCommission, filteredNetwork);
      setSortedData(aggregatedData);
      setHasSearched(true);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: keyof MemberStats) => {
    const direction = sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    setSortConfig({ key, direction });

    const sorted = [...sortedData].sort((a, b) => {
      let aValue = a[key];
      let bValue = b[key];

      if (typeof aValue === 'object') {
        // Handle nested objects (like tierStats)
        aValue = Object.values(aValue as object).reduce((sum: number, val: any) => 
          sum + (val.commission || 0), 0);
        bValue = Object.values(bValue as object).reduce((sum: number, val: any) => 
          sum + (val.commission || 0), 0);
      }

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === "string" && typeof bValue === "string") {
        return direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return direction === "asc"
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

    setSortedData(sorted);
  };

  const handleViewDetails = (memberId: string, memberLogin: string) => {
    const searchParams = new URLSearchParams({
      member: memberLogin,
      dateRange: dateRange
    });
    router.push(`/finance?${searchParams.toString()}`);
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
        sortedData.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort("memberLogin")}
                  >
                    Member
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort("currency")}
                  >
                    Currency
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-right"
                    onClick={() => handleSort("totalNGR")}
                  >
                    Total NGR
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-right"
                    onClick={() => handleSort("totalCommission")}
                  >
                    Total Commission
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-right"
                    onClick={() => handleSort("referralCount")}
                  >
                    Referrals
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-right"
                    onClick={() => handleSort("lastActive")}
                  >
                    Last Active
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((member) => (
                  <TableRow key={member.memberId}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{member.memberLogin}</div>
                        <div className="text-sm text-muted-foreground">
                          ID: {member.memberId}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{member.currency}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(member.totalNGR)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(member.totalCommission)}
                    </TableCell>
                    <TableCell className="text-right">
                      {member.referralCount}
                    </TableCell>
                    <TableCell className="text-right">
                      {member.lastActive}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(member.memberId, member.memberLogin)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex h-[600px] items-center justify-center text-muted-foreground">
            No results found
          </div>
        )
      ) : (
        <div className="flex h-[600px] items-center justify-center text-muted-foreground">
          Enter a member ID or login to view member details
        </div>
      )}
    </div>
  );
} 