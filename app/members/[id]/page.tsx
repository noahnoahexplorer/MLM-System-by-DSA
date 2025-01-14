import { Metadata } from "next";
import MemberDetails from "@/components/members/member-details";

export const metadata: Metadata = {
  title: "Member Details | BK8 MLM System",
  description: "Individual Member Performance Details",
};

export default function MemberPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Member Details</h1>
      </div>
      <MemberDetails memberId={params.id} />
    </div>
  );
} 