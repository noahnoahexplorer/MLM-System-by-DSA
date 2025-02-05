"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/utils";

interface TopEarnersProps {
  className?: string;
}

interface TopEarner {
  memberLogin: string;
  commission: number;
  growth: number;
}

export default function TopEarners({ className }: TopEarnersProps) {
  const [topEarners, setTopEarners] = useState<TopEarner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTopEarners() {
      try {
        const response = await fetch('/api/dashboard/top-earners');
        const result = await response.json();
        setTopEarners(result.topEarners);
      } catch (error) {
        console.error('Error fetching top earners:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTopEarners();
  }, []);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Top Earners</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-[350px] items-center justify-center">
            Loading...
          </div>
        ) : (
          <div className="space-y-8">
            {topEarners.map((earner) => (
              <div key={earner.memberLogin} className="flex items-center">
                <Avatar className="h-9 w-9">
                  <AvatarFallback>
                    {earner.memberLogin.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {earner.memberLogin}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(earner.commission, 'PHP')}
                  </p>
                </div>
                <div className="ml-auto font-medium">
                  {earner.growth > 0 ? '+' : ''}{earner.growth}%
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 