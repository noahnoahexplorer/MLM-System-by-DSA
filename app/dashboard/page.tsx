import { Metadata } from "next";
import DashboardMetrics from "@/components/dashboard/commission-metrics";
import CommissionTrends from "@/components/dashboard/commission-trends";
import TopEarners from "@/components/dashboard/top-earners";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Commission performance overview and analytics",
};

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <div className="space-y-4">
        <DashboardMetrics />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <CommissionTrends className="col-span-4" />
          <TopEarners className="col-span-3" />
        </div>
      </div>
    </div>
  );
}