"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { MLMNetworkData } from "@/lib/types";
import NetworkView from "@/components/members/network-view";

export default function NetworkGraph() {
  const [data, setData] = useState<MLMNetworkData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/mlm-network");
      const result = await response.json();
      
      // Store all data but only show relevant parts in the visualization
      setData(result.data);
      setHasSearched(true);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by member ID or login..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
          />
        </div>
        <Button onClick={handleSearch} disabled={!searchTerm.trim()}>
          Search
        </Button>
      </div>

      {loading ? (
        <div className="flex h-[600px] items-center justify-center">
          Loading...
        </div>
      ) : hasSearched ? (
        data.length > 0 ? (
          <NetworkView data={data} searchTerm={searchTerm} />
        ) : (
          <div className="flex h-[600px] items-center justify-center text-muted-foreground">
            No results found
          </div>
        )
      ) : (
        <div className="flex h-[600px] items-center justify-center text-muted-foreground">
          Enter a search term to view network
        </div>
      )}
    </div>
  );
} 