"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Search, Clock, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AuditLogEntry {
  ID: number;
  REFEREE_LOGIN: string;
  ACTION_TYPE: string;
  ACTION_BY: string;
  ACTION_DETAILS: string;
  PREVIOUS_STATE: string;
  NEW_STATE: string;
  ACTION_DATE: string;
}

export default function ExclusionAuditLog() {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredLogs, setFilteredLogs] = useState<AuditLogEntry[]>([]);
  
  // Format the date to a more readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });
  };
  
  // Fetch audit logs
  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/exclusion-audit');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setAuditLogs(data.auditLogs || []);
      applyFilters(data.auditLogs || [], searchQuery);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch audit logs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Apply filters to the audit logs
  const applyFilters = (data: AuditLogEntry[], query: string) => {
    if (!query.trim()) {
      setFilteredLogs(data);
      return;
    }
    
    const lowerQuery = query.toLowerCase();
    const filtered = data.filter(log => 
      log.REFEREE_LOGIN.toLowerCase().includes(lowerQuery) ||
      log.ACTION_BY.toLowerCase().includes(lowerQuery) ||
      log.ACTION_TYPE.toLowerCase().includes(lowerQuery) ||
      log.ACTION_DETAILS.toLowerCase().includes(lowerQuery)
    );
    
    setFilteredLogs(filtered);
  };
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    applyFilters(auditLogs, query);
  };
  
  // Get badge colors based on action type
  const getActionTypeBadge = (actionType: string) => {
    switch (actionType.toUpperCase()) {
      case 'CREATE':
        return <Badge className="bg-green-500">CREATE</Badge>;
      case 'UPDATE':
        return <Badge className="bg-blue-500">UPDATE</Badge>;
      case 'DELETE':
        return <Badge className="bg-red-500">DELETE</Badge>;
      case 'SUBMIT':
        return <Badge className="bg-purple-500">SUBMIT</Badge>;
      default:
        return <Badge>{actionType}</Badge>;
    }
  };
  
  // Load data on component mount
  useEffect(() => {
    fetchAuditLogs();
  }, []);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 w-full max-w-sm">
          <div className="relative w-full">
            <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <Input
              placeholder="Search audit logs..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-8"
            />
          </div>
        </div>
        
        <Button onClick={fetchAuditLogs} variant="outline" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Exclusion Audit Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredLogs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Referee</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>By</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Previous State</TableHead>
                  <TableHead>New State</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.ID}>
                    <TableCell className="font-mono text-xs">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDate(log.ACTION_DATE).split(',')[1]}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {formatDate(log.ACTION_DATE)}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="font-medium">{log.REFEREE_LOGIN}</TableCell>
                    <TableCell>{getActionTypeBadge(log.ACTION_TYPE)}</TableCell>
                    <TableCell>{log.ACTION_BY}</TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate">{log.ACTION_DETAILS}</div>
                    </TableCell>
                    <TableCell className="max-w-xs text-xs text-muted-foreground">
                      <div className="truncate">{log.PREVIOUS_STATE}</div>
                    </TableCell>
                    <TableCell className="max-w-xs text-xs">
                      <div className="truncate">{log.NEW_STATE}</div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No audit logs found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 