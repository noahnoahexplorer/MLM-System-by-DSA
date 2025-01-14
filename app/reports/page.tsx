import { Metadata } from "next";
import ReportsOverview from "@/components/reports/reports-overview";

export const metadata: Metadata = {
  title: "Reports | BK8 MLM System",
  description: "Comprehensive MLM System Reports and Analytics",
};

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Reports</h1>
      </div>
      <ReportsOverview />
    </div>
  );
} 