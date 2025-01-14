"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MLMNetworkData } from "@/lib/types";
import { ArrowLeft, Users, DollarSign, TrendingUp, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface MemberDetailsProps {
  memberId: string;
}

// Helper function to format currency
const formatCurrency = (value: number | null) => {
  if (value === null || value === undefined) return "$0.00";
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export default function MemberDetails({ memberId }: MemberDetailsProps) {
  const [data, setData] = useState<MLMNetworkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState<MLMNetworkData[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/mlm-network");
        const result = await response.json();
        const memberData = result.data.find(
          (m: MLMNetworkData) => m.MEMBER_ID === memberId
        );
        const referralData = result.data.filter(
          (m: MLMNetworkData) => m.REFERRER_ID === memberId
        );
        setData(memberData || null);
        setReferrals(referralData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [memberId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!data) {
    return <div>Member not found</div>;
  }

  const totalCommission = (data.TIER1_COMMISSION || 0) + 
    (data.TIER2_COMMISSION || 0) + 
    (data.TIER3_COMMISSION || 0);

  const metrics = [
    {
      title: "Self NGR",
      value: formatCurrency(data.SELF_NGR),
      icon: DollarSign,
    },
    {
      title: "Total Commission",
      value: formatCurrency(totalCommission),
      icon: TrendingUp,
    },
    {
      title: "Direct Referrals",
      value: referrals.length.toString(),
      icon: Users,
    },
    {
      title: "Member Since",
      value: data.CREATED_DATE 
        ? new Date(data.CREATED_DATE).toLocaleDateString()
        : 'N/A',
      icon: Calendar,
    },
  ];

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/members" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Members
        </Link>
      </Button>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Member Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Member ID</div>
                  <div className="font-medium">{data.MEMBER_ID || 'N/A'}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Username</div>
                  <div className="font-medium">{data.MEMBER_LOGIN || 'N/A'}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Level</div>
                  <div className="font-medium">{data.MEMBERSHIP_LEVEL || 'N/A'}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Currency</div>
                  <div className="font-medium">{data.CURRENCY || 'N/A'}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Referrer</div>
                  <div className="font-medium">
                    {data.REFERRER_LOGIN || "None"}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">FTD Amount</div>
                  <div className="font-medium">
                    {data.FTD_AMOUNT ? formatCurrency(data.FTD_AMOUNT) : "N/A"}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Network Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">
                    Tier 1 Daily NGR
                  </div>
                  <div className="font-medium">
                    {formatCurrency(data.TIER1_DAILY_NGR)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">
                    Tier 1 Commission
                  </div>
                  <div className="font-medium">
                    {formatCurrency(data.TIER1_COMMISSION)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">
                    Tier 2 Daily NGR
                  </div>
                  <div className="font-medium">
                    {formatCurrency(data.TIER2_DAILY_NGR)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">
                    Tier 2 Commission
                  </div>
                  <div className="font-medium">
                    {formatCurrency(data.TIER2_COMMISSION)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">
                    Tier 3 Daily NGR
                  </div>
                  <div className="font-medium">
                    {formatCurrency(data.TIER3_DAILY_NGR)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">
                    Tier 3 Commission
                  </div>
                  <div className="font-medium">
                    {formatCurrency(data.TIER3_COMMISSION)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Direct Referrals</CardTitle>
        </CardHeader>
        <CardContent>
          {referrals.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead className="text-right">Self NGR</TableHead>
                  <TableHead className="text-right">Total Deposit</TableHead>
                  <TableHead className="text-right">Join Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals.map((referral) => (
                  <TableRow key={referral.MEMBER_ID}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{referral.MEMBER_LOGIN || 'N/A'}</div>
                        <div className="text-sm text-muted-foreground">
                          ID: {referral.MEMBER_ID || 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{referral.MEMBERSHIP_LEVEL || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(referral.SELF_NGR)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(referral.TOTAL_DEPOSIT)}
                    </TableCell>
                    <TableCell className="text-right">
                      {referral.CREATED_DATE 
                        ? new Date(referral.CREATED_DATE).toLocaleDateString()
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/members/${referral.MEMBER_ID}`}>
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center text-muted-foreground py-4">
              No direct referrals found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 