"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DailyCommission, ReferralNetwork } from "@/lib/types";
import { UserPlus, DollarSign, ArrowUpRight } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Activity {
  id: string;
  type: 'new_member' | 'commission' | 'referral';
  user: string;
  time: string;
  icon: typeof UserPlus | typeof DollarSign | typeof ArrowUpRight;
  description: string;
}

export default function RecentActivities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/mlm-network');
        const { commission, network } = await response.json();

        // Process and combine activities
        const allActivities: Activity[] = [];

        // Process new member registrations
        network.forEach((item: ReferralNetwork) => {
          allActivities.push({
            id: `new-${item.REFEREE_ID}`,
            type: 'new_member',
            user: item.REFEREE_LOGIN,
            time: new Date(item.CREATED_DATE).toLocaleString(),
            icon: UserPlus,
            description: 'joined the network'
          });
        });

        // Process commissions
        const commissionsByMember = new Map<string, number>();
        commission.forEach((item: DailyCommission) => {
          const currentTotal = commissionsByMember.get(item.MEMBER_LOGIN) || 0;
          commissionsByMember.set(
            item.MEMBER_LOGIN, 
            currentTotal + (item.LOCAL_COMMISSION_AMOUNT || 0)
          );
        });

        commissionsByMember.forEach((total, memberLogin) => {
          if (total > 0) {
            allActivities.push({
              id: `commission-${memberLogin}`,
              type: 'commission',
              user: memberLogin,
              time: new Date().toLocaleString(), // Using current date as commission is aggregated
              icon: DollarSign,
              description: `earned ${total.toLocaleString(undefined, { 
                style: 'currency', 
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })} commission`
            });
          }
        });

        // Process referrals
        const referralCounts = new Map<string, number>();
        network.forEach((item: ReferralNetwork) => {
          const currentCount = referralCounts.get(item.REFERRER_LOGIN) || 0;
          referralCounts.set(item.REFERRER_LOGIN, currentCount + 1);
        });

        referralCounts.forEach((count, referrer) => {
          allActivities.push({
            id: `referral-${referrer}`,
            type: 'referral',
            user: referrer,
            time: new Date().toLocaleString(), // Using current date as referrals are aggregated
            icon: ArrowUpRight,
            description: `referred ${count} new member${count > 1 ? 's' : ''}`
          });
        });

        // Sort by time (most recent first) and take top 10
        const sortedActivities = allActivities
          .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
          .slice(0, 10);

        setActivities(sortedActivities);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activities</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-[400px] items-center justify-center">
            Loading...
          </div>
        ) : (
          <div className="space-y-8">
            {activities.map(activity => (
              <div key={activity.id} className="flex items-center">
                <Avatar className="h-9 w-9">
                  <AvatarFallback>
                    <activity.icon className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {activity.user}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {activity.description}
                  </p>
                </div>
                <div className="ml-auto text-sm text-muted-foreground">
                  {new Date(activity.time).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}