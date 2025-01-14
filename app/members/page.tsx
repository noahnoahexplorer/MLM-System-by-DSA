import { Metadata } from "next";
import MembersList from "@/components/members/members-list";

export const metadata: Metadata = {
  title: "Members | BK8 MLM System",
  description: "Member Management and Performance Overview",
};

export default function MembersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Members</h1>
      </div>
      <MembersList />
    </div>
  );
} 