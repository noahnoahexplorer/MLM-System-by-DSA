import { Metadata } from "next";
import ExclusionListManager from "@/components/exclusion-list/exclusion-list-manager";

export const metadata: Metadata = {
  title: "Exclusion List | Profit Buddies",
  description: "Manage excluded referees for commission calculations",
};

export default function ExclusionListPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Exclusion List Management</h1>
      </div>
      <ExclusionListManager />
    </div>
  );
} 