import { Metadata } from "next";
import DashboardMetrics from "@/components/dashboard/metrics";
import MembershipChart from "@/components/dashboard/membership-chart";
import RecentActivities from "@/components/dashboard/recent-activities";

export const metadata: Metadata = {
  title: "Dashboard | BK8 MLM System",
  description: "MLM System Dashboard Overview",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>
      <DashboardMetrics />
      <div className="grid gap-6 md:grid-cols-2">
        <MembershipChart />
        <RecentActivities />
      </div>
    </div>
  );
}