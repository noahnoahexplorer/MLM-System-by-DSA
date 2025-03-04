import { Metadata } from "next";
import ComplianceCheckList from "@/components/compliance-checklist/compliance-checklist";

export const metadata: Metadata = {
  title: "Compliance Check List | Profit Buddies",
  description: "Verify compliance for commission payments",
};

export default function ComplianceCheckListPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Compliance Check List</h1>
      </div>
      <ComplianceCheckList />
    </div>
  );
} 