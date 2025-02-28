import { Metadata } from "next";
import FinalizedCommissionList from "@/components/finalized-commission/finalized-commission-list";

export const metadata: Metadata = {
  title: "Marketing Ops - Finalized MLM Comm List | BK8 MLM System",
  description: "Finalized commission list after compliance review",
};

export default function FinalizedCommissionPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Marketing Ops - Finalized MLM Comm List</h1>
      </div>
      <FinalizedCommissionList />
    </div>
  );
} 