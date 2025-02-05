import { Metadata } from "next";
import WeeklyCommissionList from "@/components/weekly-commission/weekly-commission-list";

export const metadata: Metadata = {
  title: "Weekly Commission List | BK8 MLM System",
  description: "Export Weekly Commission Data",
};

export default function WeeklyCommissionPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Weekly Commission List</h1>
      </div>
      <WeeklyCommissionList />
    </div>
  );
} 