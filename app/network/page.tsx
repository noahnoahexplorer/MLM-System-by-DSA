import { Metadata } from "next";
import NetworkGraph from "@/components/network/network-graph";

export const metadata: Metadata = {
  title: "Network | Profit Buddies",
  description: "MLM Network Visualization",
};

export default function NetworkPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Network</h1>
      </div>
      <NetworkGraph />
    </div>
  );
} 