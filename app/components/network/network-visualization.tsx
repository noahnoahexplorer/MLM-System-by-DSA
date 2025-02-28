"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface NetworkNode {
  MEMBER_ID: string;
  MEMBER_LOGIN: string;
  REFERRER_LOGIN: string | null;
  TOTAL_COMMISSION: number;
  TOTAL_DEPOSIT: number;
  TOTAL_TURNOVER: number;
  TOTAL_NGR: number;
  LEVEL: number;
}

export default function NetworkVisualization() {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [networkData, setNetworkData] = useState<NetworkNode[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm) return;
    
    setLoading(true);
    setHasSearched(true);
    try {
      const response = await fetch(`/api/network?memberLogin=${searchTerm}`);
      const data = await response.json();
      setNetworkData(data.network || []);
    } catch (error) {
      console.error('Error fetching network data:', error);
      setNetworkData([]);
    } finally {
      setLoading(false);
    }
  };

  const renderNetworkTree = (nodes: NetworkNode[]) => {
    const renderNode = (node: NetworkNode, depth: number = 0) => {
      const children = nodes.filter(n => n.REFERRER_LOGIN === node.MEMBER_LOGIN);
      
      return (
        <div key={node.MEMBER_ID} className="ml-8">
          <div className={`
            flex items-center gap-4 p-4 rounded-lg border
            ${depth === 0 ? 'bg-primary/10 border-primary/20' : 'bg-secondary/10 border-secondary/20'}
          `}>
            <div className="flex flex-col gap-1">
              <span className="font-medium">{node.MEMBER_LOGIN}</span>
              <span className="text-xs text-muted-foreground">Level {node.LEVEL}</span>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs">
                <span>Commission: {node.TOTAL_COMMISSION.toFixed(2)}</span>
                <span>Deposit: {node.TOTAL_DEPOSIT.toFixed(2)}</span>
                <span>Turnover: {node.TOTAL_TURNOVER.toFixed(2)}</span>
                <span>NGR: {node.TOTAL_NGR.toFixed(2)}</span>
              </div>
            </div>
          </div>
          {children.length > 0 && (
            <div className="ml-4 mt-2 border-l-2 border-dashed border-muted-foreground/20 pl-4">
              {children.map(child => renderNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    };

    const rootNode = nodes.find(n => n.LEVEL === 1);
    return rootNode ? renderNode(rootNode) : null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search member..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
        />
        <Button onClick={handleSearch} disabled={loading}>
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="flex h-[400px] items-center justify-center">
          Loading...
        </div>
      ) : hasSearched ? (
        networkData.length > 0 ? (
          <div className="p-4 border rounded-lg">
            {renderNetworkTree(networkData)}
          </div>
        ) : (
          <div className="flex h-[400px] items-center justify-center text-muted-foreground">
            No network data found for {searchTerm}
          </div>
        )
      ) : null}
    </div>
  );
} 