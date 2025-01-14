"use client";

import { useCallback, useEffect } from "react";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";
import { Card } from "@/components/ui/card";
import { MLMNetworkData } from "@/lib/types";
import Image from "next/image";

interface NetworkViewProps {
  data: MLMNetworkData[];
  searchTerm: string;
}

// Array of avatar URLs
const avatarUrls = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=3',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=5',
];

const getRandomAvatar = () => {
  const randomIndex = Math.floor(Math.random() * avatarUrls.length);
  return avatarUrls[randomIndex];
};

// Custom node component with tier indication
const CustomNode = ({ data }: { data: any }) => (
  <div className="flex flex-col items-center">
    <div className="bg-white rounded-lg shadow p-2 text-center w-[150px]">
      <div className="flex flex-col items-center gap-2">
        <div className="relative">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100">
            <Image
              src={data.avatarUrl}
              alt="User avatar"
              width={48}
              height={48}
              className="object-cover"
            />
          </div>
        </div>
        <div className="text-xs font-medium text-gray-900">{data.label}</div>
        <div className="text-xs text-gray-600">Children: {data.childCount || 0}</div>
      </div>
    </div>
  </div>
);

const NetworkView = ({ data, searchTerm }: NetworkViewProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const processNetworkData = useCallback(() => {
    const processedNodes: Node[] = [];
    const processedEdges: Edge[] = [];
    const processedIds = new Set<string>();
    const childCountMap = new Map<string, number>();
    const nodesByLevel: { [key: number]: Node[] } = {};
    const searchLower = searchTerm.toLowerCase();

    // Build parent-child relationships and count children
    const parentChildMap = new Map<string, Set<string>>();
    
    data.forEach(member => {
      if (member.DESCENDANTS_LOGIN && member.DESCENDANTS_LOGIN !== '[]') {
        const paths = member.DESCENDANTS_LOGIN
          .replace(/[\[\]]/g, '')
          .split(',')
          .map(path => path.trim());
        
        paths.forEach(path => {
          const members = path.split(':').map(m => m.trim());
          members.forEach((memberLogin, index) => {
            if (index < members.length - 1) {
              const childLogin = members[index + 1];
              
              // Add to parent-child map
              if (!parentChildMap.has(memberLogin)) {
                parentChildMap.set(memberLogin, new Set());
              }
              parentChildMap.get(memberLogin)!.add(childLogin);
              
              // Update child count
              const currentCount = childCountMap.get(memberLogin) || 0;
              childCountMap.set(memberLogin, currentCount + 1);
            }
          });
        });
      }
    });

    // Function to add a node and its children recursively
    const addNodeAndChildren = (id: string, level: number, parentId: string | null) => {
      if (!id || processedIds.has(id)) return;

      // Create node
      if (!nodesByLevel[level]) {
        nodesByLevel[level] = [];
      }

      const newNode: Node = {
        id,
        type: 'custom',
        data: { 
          label: id,
          childCount: childCountMap.get(id) || 0,
          avatarUrl: getRandomAvatar(),
        },
        position: { x: 0, y: level * 150 },
      };

      processedNodes.push(newNode);
      nodesByLevel[level].push(newNode);
      processedIds.add(id);

      // Create edge from parent
      if (parentId) {
        processedEdges.push({
          id: `edge-${parentId}-${id}`,
          source: parentId,
          target: id,
          type: 'step',
          style: { 
            stroke: '#FF0000', 
            strokeWidth: 3,
          },
        });
      }

      // Process children
      const children = parentChildMap.get(id);
      if (children) {
        children.forEach(childId => {
          addNodeAndChildren(childId, level + 1, id);
        });
      }
    };

    // Find root nodes (nodes that match search and have no parents)
    const allChildren = new Set(Array.from(parentChildMap.values()).flatMap(set => Array.from(set)));
    const rootNodes = data
      .filter(member => 
        (member.MEMBER_LOGIN?.toLowerCase().includes(searchLower) ||
         member.MEMBER_ID?.toLowerCase().includes(searchLower)) &&
        !allChildren.has(member.MEMBER_LOGIN)
      )
      .map(member => member.MEMBER_LOGIN);

    // Process each root node and its descendants
    rootNodes.forEach(rootId => {
      addNodeAndChildren(rootId, 0, null);
    });

    // Calculate horizontal positions for each level
    Object.entries(nodesByLevel).forEach(([level, levelNodes]) => {
      const levelNum = parseInt(level);
      const totalWidth = levelNodes.length * 250;
      const startX = -totalWidth / 2;

      levelNodes.forEach((node, index) => {
        node.position = {
          x: startX + (index * 250),
          y: levelNum * 150
        };
      });
    });

    setNodes(processedNodes);
    setEdges(processedEdges);
  }, [data, searchTerm, setNodes, setEdges]);

  useEffect(() => {
    processNetworkData();
  }, [data, processNetworkData]);

  return (
    <Card className="h-[800px] bg-[#fafafa]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={{ custom: CustomNode }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={1.5}
        defaultEdgeOptions={{
          type: 'step',
          style: { 
            stroke: '#FF0000', 
            strokeWidth: 3,
          },
        }}
      >
        <Controls />
        <Background color="#E8E8E8" />
      </ReactFlow>
    </Card>
  );
};

export default NetworkView;
