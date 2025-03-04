import { Metadata } from "next";
import ReportsOverview from "@/components/reports/reports-overview";

export const metadata: Metadata = {
  title: "Commission Reports | Profit Buddies",
  description: "Detailed Commission Analysis and Reports",
};

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
      </div>
      <ReportsOverview />
    </div>
  );
} 