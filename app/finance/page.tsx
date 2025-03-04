import { Metadata } from "next";
import FinanceOverview from "@/components/finance/finance-overview";

export const metadata: Metadata = {
  title: "Finance | Profit Buddies",
  description: "Commission and NGR Overview",
};

export default function FinancePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Finance</h1>
      </div>
      <FinanceOverview />
    </div>
  );
} 