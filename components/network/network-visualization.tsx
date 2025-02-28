"use client";

import { useState, useCallback } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  ConnectionLineType,
} from "reactflow";
import "reactflow/dist/base.css";
import "reactflow/dist/style.css";

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

const CustomNode = ({ data }: { data: any }) => (
  <div className={`px-4 py-2 shadow-md rounded-md border-2 min-w-[200px]
    ${data.level === 0 
      ? 'bg-primary/10 border-primary' 
      : 'bg-white border-stone-400'}`}>
    <div className="flex flex-col">
      <div className="font-bold">{data.label}</div>
      <div className="text-xs text-gray-500">
        Level {data.level}
        {data.isSearched && " (Searched Member)"}
      </div>
      <div className="mt-2 text-xs">
        <div>Commission: {data.commission.toFixed(2)}</div>
        <div>Deposit: {data.deposit.toFixed(2)}</div>
        <div>Turnover: {data.turnover.toFixed(2)}</div>
        <div>NGR: {data.ngr.toFixed(2)}</div>
      </div>
    </div>
  </div>
);

const nodeTypes = {
  custom: CustomNode,
};

export default function NetworkVisualization() {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const processNetworkData = useCallback((networkData: NetworkNode[]) => {
    console.log("Processing network data:", networkData); // Debug log

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    const levelSpacing = 200;
    const nodeSpacing = 300;

    // Find the searched member (should be the root)
    const rootMember = networkData.find(node => node.LEVEL === 1);
    if (!rootMember) return;

    // Create a map of direct relationships
    const relationships = new Map<string, string[]>();
    networkData.forEach(node => {
      if (node.REFERRER_LOGIN) {
        if (!relationships.has(node.REFERRER_LOGIN)) {
          relationships.set(node.REFERRER_LOGIN, []);
        }
        relationships.get(node.REFERRER_LOGIN)?.push(node.MEMBER_LOGIN);
      }
    });

    console.log("Relationships map:", relationships); // Debug log

    // Process nodes level by level
    const processLevel = (member: NetworkNode, level: number, xPos: number) => {
      // Add node
      newNodes.push({
        id: member.MEMBER_LOGIN,
        type: 'custom',
        position: { x: xPos, y: level * levelSpacing },
        data: {
          label: member.MEMBER_LOGIN,
          level: level,
          commission: member.TOTAL_COMMISSION,
          deposit: member.TOTAL_DEPOSIT,
          turnover: member.TOTAL_TURNOVER,
          ngr: member.TOTAL_NGR,
          isSearched: level === 0,
        },
      });

      // Process children
      const children = relationships.get(member.MEMBER_LOGIN) || [];
      const childrenNodes = networkData.filter(node => 
        children.includes(node.MEMBER_LOGIN)
      );

      const childWidth = nodeSpacing * (children.length - 1);
      const startX = xPos - childWidth / 2;

      childrenNodes.forEach((child, index) => {
        // Add edge
        newEdges.push({
          id: `e${member.MEMBER_LOGIN}-${child.MEMBER_LOGIN}`,
          source: member.MEMBER_LOGIN,
          target: child.MEMBER_LOGIN,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#FF0000', strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#FF0000',
          },
        });

        // Process next level
        processLevel(
          child,
          level + 1,
          startX + index * nodeSpacing
        );
      });
    };

    // Start processing from root
    processLevel(rootMember, 0, 0);

    console.log("Generated nodes:", newNodes); // Debug log
    console.log("Generated edges:", newEdges); // Debug log

    setNodes(newNodes);
    setEdges(newEdges);
  }, [setNodes, setEdges]);

  const handleSearch = async () => {
    if (!searchTerm) return;
    
    setLoading(true);
    setHasSearched(true);
    try {
      const response = await fetch(`/api/network?memberLogin=${searchTerm}`);
      const data = await response.json();
      console.log("API response:", data); // Debug log
      if (data.network && data.network.length > 0) {
        processNetworkData(data.network);
      } else {
        setNodes([]);
        setEdges([]);
      }
    } catch (error) {
      console.error('Error fetching network data:', error);
      setNodes([]);
      setEdges([]);
    } finally {
      setLoading(false);
    }
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
        <div className="flex h-[600px] items-center justify-center">
          Loading...
        </div>
      ) : hasSearched ? (
        nodes.length > 0 ? (
          <div style={{ height: '600px', width: '100%' }} className="border rounded-lg">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              defaultEdgeOptions={{
                type: 'smoothstep',
                animated: true,
                style: { stroke: '#FF0000', strokeWidth: 2 },
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  color: '#FF0000',
                },
              }}
              fitView
              attributionPosition="bottom-left"
              minZoom={0.1}
              maxZoom={1.5}
            >
              <Controls />
              <Background color="#aaa" gap={16} />
            </ReactFlow>
          </div>
        ) : (
          <div className="flex h-[600px] items-center justify-center text-muted-foreground">
            No network data found for {searchTerm}
          </div>
        )
      ) : null}
    </div>
  );
} 