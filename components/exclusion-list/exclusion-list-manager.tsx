"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, RefreshCw, Search, AlertCircle } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ExclusionAuditLog from "./exclusion-audit-log";

interface ExcludedReferee {
  ID: number;
  REFEREE_LOGIN: string;
  REFERRER_LOGIN?: string;
  EXCLUDED_BY: string;
  EXCLUSION_REASON: string | null;
  EXCLUSION_DATE: string;
  START_DATE: string;
  END_DATE: string;
  IS_ACTIVE: boolean;
}

// Helper function to format date to GMT+8
const formatToGMT8 = (date: Date): string => {
  const offset = 8 * 60; // GMT+8 offset in minutes
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const gmt8Date = new Date(utc + (offset * 60000));
  return gmt8Date.toISOString().split('T')[0];
};

// Get current date in GMT+8
const getCurrentDateGMT8 = (): string => {
  return formatToGMT8(new Date());
};

// Get date one month from now in GMT+8
const getOneMonthLaterGMT8 = (): string => {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return formatToGMT8(date);
};

export default function ExclusionListManager() {
  const [exclusions, setExclusions] = useState<ExcludedReferee[]>([]);
  const [filteredExclusions, setFilteredExclusions] = useState<ExcludedReferee[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("exclusions");
  
  // Form states
  const [newExclusion, setNewExclusion] = useState({
    refereeLogin: '',
    excludedBy: '',
    exclusionReason: '',
    startDate: getCurrentDateGMT8(),
    endDate: getOneMonthLaterGMT8()
  });
  
  const [editingExclusion, setEditingExclusion] = useState<ExcludedReferee | null>(null);

  // Fetch exclusions data
  const fetchExclusions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/exclusion-referees');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setExclusions(data.exclusions || []);
      applyFilters(data.exclusions || [], searchQuery, showActiveOnly);
    } catch (error) {
      console.error('Error fetching exclusions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch exclusion list. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Apply filters to the exclusion list
  const applyFilters = (data: ExcludedReferee[], query: string, activeOnly: boolean) => {
    let filtered = [...data];
    
    // Filter by active status
    if (activeOnly) {
      filtered = filtered.filter(item => item.IS_ACTIVE);
    }
    
    // Filter by search query
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(item => 
        item.REFEREE_LOGIN.toLowerCase().includes(lowerQuery) ||
        item.EXCLUDED_BY.toLowerCase().includes(lowerQuery) ||
        (item.EXCLUSION_REASON && item.EXCLUSION_REASON.toLowerCase().includes(lowerQuery))
      );
    }
    
    setFilteredExclusions(filtered);
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    applyFilters(exclusions, query, showActiveOnly);
  };

  // Handle active filter toggle
  const handleActiveFilterChange = (checked: boolean) => {
    setShowActiveOnly(checked);
    applyFilters(exclusions, searchQuery, checked);
  };

  // Handle adding a new exclusion
  const handleAddExclusion = async () => {
    if (!newExclusion.refereeLogin || !newExclusion.excludedBy || !newExclusion.startDate || !newExclusion.endDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const response = await fetch('/api/exclusion-referees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newExclusion),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      toast({
        title: "Success",
        description: "User has been added to the exclusion list.",
      });
      
      setIsAddDialogOpen(false);
      setNewExclusion({
        refereeLogin: '',
        excludedBy: '',
        exclusionReason: '',
        startDate: getCurrentDateGMT8(),
        endDate: getOneMonthLaterGMT8()
      });
      
      fetchExclusions();
    } catch (error) {
      console.error('Error adding exclusion:', error);
      toast({
        title: "Error",
        description: "Failed to add user to exclusion list. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle updating an existing exclusion
  const handleUpdateExclusion = async () => {
    if (!editingExclusion) return;
    
    try {
      const response = await fetch(`/api/exclusion-referees/${editingExclusion.ID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: editingExclusion.IS_ACTIVE,
          exclusionReason: editingExclusion.EXCLUSION_REASON,
          endDate: editingExclusion.END_DATE,
          actionBy: editingExclusion.EXCLUDED_BY,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      toast({
        title: "Success",
        description: "Exclusion has been updated successfully.",
      });
      
      setIsEditDialogOpen(false);
      setEditingExclusion(null);
      
      fetchExclusions();
    } catch (error) {
      console.error('Error updating exclusion:', error);
      toast({
        title: "Error",
        description: "Failed to update exclusion. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchExclusions();
  }, []);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="exclusions" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="exclusions">Exclusion List</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="exclusions" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 w-full max-w-sm">
              <div className="relative w-full">
                <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Search className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input
                  placeholder="Search by username or excluded by..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full pl-8"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-active"
                  checked={showActiveOnly}
                  onCheckedChange={handleActiveFilterChange}
                />
                <Label htmlFor="show-active">Show active only</Label>
              </div>
              
              <Button onClick={fetchExclusions} variant="outline" size="icon">
                <RefreshCw className="h-4 w-4" />
              </Button>
              
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Exclusion
              </Button>
            </div>
          </div>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Important Note</AlertTitle>
            <AlertDescription>
              Exclusions are never deleted from the system for audit purposes. To remove a user from the exclusion list, set their status to inactive.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Excluded Users</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredExclusions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Referrer</TableHead>
                      <TableHead>Excluded By</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Exclusion Date</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExclusions.map((exclusion) => (
                      <TableRow key={exclusion.ID}>
                        <TableCell>
                          <Badge variant={exclusion.IS_ACTIVE ? "default" : "outline"}>
                            {exclusion.IS_ACTIVE ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{exclusion.REFEREE_LOGIN}</TableCell>
                        <TableCell>{exclusion.REFERRER_LOGIN || "-"}</TableCell>
                        <TableCell>{exclusion.EXCLUDED_BY}</TableCell>
                        <TableCell>{new Date(exclusion.START_DATE).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(exclusion.END_DATE).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(exclusion.EXCLUSION_DATE).toLocaleString()}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {exclusion.EXCLUSION_REASON || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingExclusion(exclusion);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex justify-center py-8 text-muted-foreground">
                  No exclusions found matching your criteria
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="audit" className="mt-6">
          <ExclusionAuditLog />
        </TabsContent>
      </Tabs>

      {/* Add Exclusion Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Exclusion</DialogTitle>
            <DialogDescription>
              Add a user to the exclusion list. They will be excluded from commission calculations as both a referrer and a referee.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="referee-login" className="text-right">
                Username *
              </Label>
              <div className="relative col-span-3">
                <div className="absolute left-2 top-1/2 -translate-y-1/2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input
                  id="referee-login"
                  value={newExclusion.refereeLogin}
                  onChange={(e) => setNewExclusion({...newExclusion, refereeLogin: e.target.value})}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="excluded-by" className="text-right">
                Excluded By *
              </Label>
              <Input
                id="excluded-by"
                value={newExclusion.excludedBy}
                onChange={(e) => setNewExclusion({...newExclusion, excludedBy: e.target.value})}
                className="col-span-3"
                placeholder="Enter your name or ID"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="start-date" className="text-right">
                Start Date *
              </Label>
              <Input
                id="start-date"
                type="date"
                value={newExclusion.startDate}
                onChange={(e) => setNewExclusion({...newExclusion, startDate: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="end-date" className="text-right">
                End Date *
              </Label>
              <Input
                id="end-date"
                type="date"
                value={newExclusion.endDate}
                onChange={(e) => setNewExclusion({...newExclusion, endDate: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reason" className="text-right">
                Reason
              </Label>
              <Textarea
                id="reason"
                value={newExclusion.exclusionReason}
                onChange={(e) => setNewExclusion({...newExclusion, exclusionReason: e.target.value})}
                className="col-span-3"
                placeholder="Enter reason for exclusion"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddExclusion}>Add Exclusion</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Exclusion</DialogTitle>
            <DialogDescription>
              Update the details for this excluded user.
            </DialogDescription>
          </DialogHeader>
          {editingExclusion && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-referee-login" className="text-right">
                  Username
                </Label>
                <Input
                  id="edit-referee-login"
                  value={editingExclusion.REFEREE_LOGIN}
                  disabled
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-end-date" className="text-right">
                  End Date
                </Label>
                <Input
                  id="edit-end-date"
                  type="date"
                  value={editingExclusion.END_DATE.split('T')[0]}
                  onChange={(e) => setEditingExclusion({
                    ...editingExclusion,
                    END_DATE: e.target.value
                  })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-reason" className="text-right">
                  Reason
                </Label>
                <Textarea
                  id="edit-reason"
                  value={editingExclusion.EXCLUSION_REASON || ''}
                  onChange={(e) => setEditingExclusion({
                    ...editingExclusion,
                    EXCLUSION_REASON: e.target.value
                  })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-active" className="text-right">
                  Active
                </Label>
                <div className="col-span-3 flex items-center">
                  <Switch
                    id="edit-active"
                    checked={editingExclusion.IS_ACTIVE}
                    onCheckedChange={(checked) => setEditingExclusion({
                      ...editingExclusion,
                      IS_ACTIVE: checked
                    })}
                  />
                  <span className="ml-2">
                    {editingExclusion.IS_ACTIVE ? "Active (excluded from commission)" : "Inactive (included in commission)"}
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateExclusion}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 