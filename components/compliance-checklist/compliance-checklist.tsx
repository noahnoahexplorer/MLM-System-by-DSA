"use client";

import { useState, useEffect, useCallback } from "react";
import { Download, Calendar, AlertCircle, CheckCircle, XCircle, Plus, Send } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { formatCurrency } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface ComplianceData {
  START_DATE: string;
  END_DATE: string;
  MERCHANT_ID: string;
  MEMBER_ID: string;
  MEMBER_NAME: string;
  MEMBER_LOGIN: string;
  MEMBER_CURRENCY: string;
  MEMBER_GROUP: string;
  MEMBER_DEPOSIT: number;
  RELATIVE_LEVEL: number;
  RELATIVE_LEVEL_REFEREE: string;
  RELATIVE_LEVEL_REFEREE_LOGIN: string;
  TOTAL_DEPOSIT_AMOUNT: number;
  TOTAL_WIN_LOSS: number;
  TOTAL_VALID_TURNOVER: number;
  BASE_TOTAL_VALID_TURNOVER: number;
  BASE_TOTAL_CLEAN_TURNOVER: number;
  BASE_TOTAL_CLEAN_WIN_LOSS: number;
  COMMISSION_RATE: number;
  BASE_COMMISSION_AMOUNT: number;
  GLOBAL_MULTIPLIER: number;
  LOCAL_COMMISSION_AMOUNT: number;
  IS_EXCLUDED: boolean;
}

interface ExcludedReferee {
  ID: number;
  REFEREE_LOGIN: string;
  EXCLUDED_BY: string;
  EXCLUSION_REASON: string;
  EXCLUSION_DATE: string;
  START_DATE: string;
  END_DATE: string;
  IS_ACTIVE: boolean;
}

interface MemberTotal {
  originalTotal: number;
  adjustedTotal: number;
}

// Generate weekly intervals for the past year
const generateWeeklyIntervals = () => {
  const intervals = [];
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday of current week

  for (let i = 0; i < 52; i++) { // Past 52 weeks
    const start = new Date(startOfWeek);
    start.setDate(start.getDate() - (i * 7));
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    intervals.push({
      label: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      value: `${start.toISOString().split('T')[0]}_${end.toISOString().split('T')[0]}`
    });
  }
  return intervals;
};

const weeklyIntervals = generateWeeklyIntervals();

export default function ComplianceCheckList() {
  const [allData, setAllData] = useState<ComplianceData[]>([]);
  const [filteredData, setFilteredData] = useState<ComplianceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  const [excludedReferees, setExcludedReferees] = useState<string[]>([]);
  const [memberTotals, setMemberTotals] = useState<Record<string, MemberTotal>>({});
  const [exclusionsList, setExclusionsList] = useState<ExcludedReferee[]>([]);
  const [loadingExclusions, setLoadingExclusions] = useState(false);
  
  // New exclusion form state
  const [newExclusion, setNewExclusion] = useState({
    refereeLogin: '',
    excludedBy: '',
    exclusionReason: '',
    startDate: '',
    endDate: ''
  });
  const [isAddingExclusion, setIsAddingExclusion] = useState(false);
  const [exclusionError, setExclusionError] = useState<string | null>(null);

  // Add this state to track submission status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionDate, setSubmissionDate] = useState<string | null>(null);
  const [checkerName, setCheckerName] = useState('');
  const [submittedBy, setSubmittedBy] = useState<string | null>(null);

  const fetchData = useCallback(async (weekValue: string) => {
    setLoading(true);
    try {
      const [startDate, endDate] = weekValue.split('_');
      const response = await fetch(
        `/api/compliance-checklist?startDate=${startDate}&endDate=${endDate}&includeExcluded=true`
      );
      const result = await response.json();
      
      const complianceData = result.compliance || [];
      setAllData(complianceData);
      
      // Get the list of excluded referee logins
      const excludedLogins = result.excludedReferees || [];
      console.log('API returned excluded referees:', excludedLogins);
      setExcludedReferees(excludedLogins);
      
      // We're now showing all data, including excluded referees
      setFilteredData(complianceData);
      setMemberTotals(result.memberTotals || {});
      
      // Set default dates for new exclusion
      setNewExclusion(prev => ({
        ...prev,
        startDate,
        endDate
      }));
    } catch (error) {
      console.error('Error fetching data:', error);
      setAllData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchExclusions = useCallback(async () => {
    setLoadingExclusions(true);
    try {
      const response = await fetch('/api/compliance-checklist/exclusions');
      const result = await response.json();
      setExclusionsList(result.exclusions || []);
    } catch (error) {
      console.error('Error fetching exclusions:', error);
    } finally {
      setLoadingExclusions(false);
    }
  }, []);

  useEffect(() => {
    fetchExclusions();
  }, [fetchExclusions]);

  const handleWeekChange = (value: string) => {
    setSelectedWeek(value);
    fetchData(value);
  };

  const handleAddExclusion = async () => {
    // Reset error state
    setExclusionError(null);
    
    // Validate required fields
    if (!newExclusion.refereeLogin || !newExclusion.excludedBy || !newExclusion.startDate || !newExclusion.endDate) {
      setExclusionError("Please fill in all required fields.");
      return;
    }

    setIsAddingExclusion(true);

    try {
      console.log("Submitting exclusion:", newExclusion);
      
      // Use the standardized endpoint
      const response = await fetch('/api/exclusion-referees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newExclusion),
      });
      
      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);
      
      if (!response.ok) {
        // Set the error message from the API and ensure it's visible
        const errorMsg = data.error || "Failed to add user to exclusion list";
        console.error("Error from API:", errorMsg);
        setExclusionError(errorMsg);
        
        // Force a re-render by updating state
        setIsAddingExclusion(false);
        return;
      }
      
      // Reset form and refresh data
      setNewExclusion({
        refereeLogin: '',
        excludedBy: '',
        exclusionReason: '',
        startDate: selectedWeek ? selectedWeek.split('_')[0] : '',
        endDate: selectedWeek ? selectedWeek.split('_')[1] : ''
      });
      
      // Reset error state
      setExclusionError(null);
      
      // Close the dialog
      document.getElementById('add-exclusion-trigger')?.click();
      
      // Refresh both the exclusion list and compliance data to show updated exclusion statuses
      await fetchExclusions();
      if (selectedWeek) {
        await fetchData(selectedWeek);
      }
      
      toast({
        title: "Success",
        description: "User has been added to exclusion list",
      });
    } catch (error) {
      console.error('Error adding exclusion:', error);
      // Ensure the error is displayed
      setExclusionError("An unexpected error occurred. Please try again.");
    } finally {
      setIsAddingExclusion(false);
    }
  };

  const handleUpdateExclusion = async (id: number, isActive: boolean) => {
    try {
      const response = await fetch(`/api/compliance-checklist/exclusions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update exclusion');
      }
      
      await fetchExclusions();
      if (selectedWeek) {
        await fetchData(selectedWeek);
      }
      
      toast({
        title: "Success",
        description: `Exclusion has been ${isActive ? 'activated' : 'deactivated'}`,
      });
    } catch (error) {
      console.error('Error updating exclusion:', error);
      toast({
        title: "Error",
        description: "Failed to update exclusion",
        variant: "destructive",
      });
    }
  };

  const handleDeleteExclusion = async (id: number) => {
    if (!confirm('Are you sure you want to delete this exclusion?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/compliance-checklist/exclusions/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete exclusion');
      }
      
      await fetchExclusions();
      if (selectedWeek) {
        await fetchData(selectedWeek);
      }
      
      toast({
        title: "Success",
        description: "Exclusion has been deleted",
      });
    } catch (error) {
      console.error('Error deleting exclusion:', error);
      toast({
        title: "Error",
        description: "Failed to delete exclusion",
        variant: "destructive",
      });
    }
  };

  // Enhance the calculateSummary function to track both total and adjusted commission
  const calculateSummary = () => {
    let totalAmount = 0;
    let adjustedAmount = 0;
    let highestCommissionMember = {
      memberLogin: '',
      amount: 0,
      currency: ''
    };
    
    // First, aggregate commission by member login
    const memberCommissions: Record<string, {
      totalCommission: number,
      currency: string
    }> = {};
    
    filteredData.forEach(item => {
      const commissionAmount = Number(item.LOCAL_COMMISSION_AMOUNT || 0);
      const memberLogin = item.MEMBER_LOGIN;
      const refereeLogin = item.RELATIVE_LEVEL_REFEREE_LOGIN;
      
      // Calculate total (including excluded)
      totalAmount += commissionAmount;
      
      // Check if this row's referee is excluded
      const isRefereeExcluded = excludedReferees.some(excludedRef => 
        excludedRef.toLowerCase() === refereeLogin?.toLowerCase()
      );
      
      // NEW: Check if the referrer (member login) is excluded
      const isReferrerExcluded = excludedReferees.some(excludedRef => 
        excludedRef.toLowerCase() === memberLogin?.toLowerCase()
      );
      
      // Only add to adjusted amount if neither referee nor referrer is excluded
      const isExcluded = isRefereeExcluded || isReferrerExcluded;
      if (!isExcluded) {
        adjustedAmount += commissionAmount;
      }
      
      // Aggregate by member login (only non-excluded)
      if (!isExcluded) {
        if (!memberCommissions[memberLogin]) {
          memberCommissions[memberLogin] = {
            totalCommission: 0,
            currency: item.MEMBER_CURRENCY
          };
        }
        memberCommissions[memberLogin].totalCommission += commissionAmount;
      }
    });
    
    // Find member with highest commission
    Object.entries(memberCommissions).forEach(([memberLogin, data]) => {
      if (data.totalCommission > highestCommissionMember.amount) {
        highestCommissionMember = {
          memberLogin,
          amount: data.totalCommission,
          currency: data.currency
        };
      }
    });
    
    return {
      totalAmount,
      adjustedAmount,
      recordCount: filteredData.length,
      highestCommissionMember,
      uniqueMembersCount: Object.keys(memberCommissions).length,
      excludedAmount: totalAmount - adjustedAmount
    };
  };

  // Export function
  const handleExport = () => {
    if (!filteredData.length) return;

    // Create Excel-compatible content
    let excelContent = '';
    const BOM = '\uFEFF';
    excelContent += BOM;

    // Add headers
    const headers = [
      'memberLogin',
      'memberName',
      'startDate',
      'endDate',
      'memberGroup',
      'relativeLevel',
      'refereeLogin',
      'isExcluded',
      'depositAmount',
      'winLoss',
      'validTurnover',
      'commissionRate',
      'commissionAmount',
      'multiplier',
      'finalCommission',
      'adjustedCommission'
    ];
    
    excelContent += headers.join(',') + '\n';

    // Group data by member for adjusted commission
    const memberRows: Record<string, any[]> = {};
    filteredData.forEach(row => {
      if (!memberRows[row.MEMBER_LOGIN]) {
        memberRows[row.MEMBER_LOGIN] = [];
      }
      memberRows[row.MEMBER_LOGIN].push(row);
    });

    // Add data rows
    Object.entries(memberRows).forEach(([memberLogin, rows]) => {
      const adjustedCommission = memberTotals[memberLogin]?.adjustedTotal || 0;
      
      rows.forEach((row: any, index: number) => {
        // Check if this member is excluded as either a referrer or referee
        const isRefereeExcluded = excludedReferees.includes(row.RELATIVE_LEVEL_REFEREE_LOGIN);
        const isReferrerExcluded = excludedReferees.includes(row.MEMBER_LOGIN);
        const isExcluded = isRefereeExcluded || isReferrerExcluded;
        
        const rowData = [
          `"${row.MEMBER_LOGIN}"`,
          `"${row.MEMBER_NAME || ''}"`,
          `"${row.START_DATE.split(' ')[0]}"`,
          `"${row.END_DATE.split(' ')[0]}"`,
          `"${row.MEMBER_GROUP || ''}"`,
          `"${row.RELATIVE_LEVEL || ''}"`,
          `"${row.RELATIVE_LEVEL_REFEREE_LOGIN || ''}"`,
          `"${isExcluded ? 'Yes' : 'No'}"`,
          `"${row.TOTAL_DEPOSIT_AMOUNT || 0}"`,
          `"${row.TOTAL_WIN_LOSS || 0}"`,
          `"${row.TOTAL_VALID_TURNOVER || 0}"`,
          `"${(row.COMMISSION_RATE || 0) * 100}%"`,
          `"${row.BASE_COMMISSION_AMOUNT || 0}"`,
          `"${row.GLOBAL_MULTIPLIER || 1}"`,
          `"${row.LOCAL_COMMISSION_AMOUNT || 0}"`,
          // Only show adjusted commission on the first row for this member
          index === 0 ? `"${adjustedCommission}"` : '""'
        ];
        excelContent += rowData.join(',') + '\n';
      });
    });

    // Create download link
    const blob = new Blob([excelContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `compliance_checklist_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Add referee to exclusion list directly from the table
  const handleExcludeReferee = (refereeLogin: string) => {
    if (!selectedWeek) return;
    
    const [startDate, endDate] = selectedWeek.split('_');
    
    setNewExclusion({
      refereeLogin,
      excludedBy: '', // This should be filled by the user
      exclusionReason: '',
      startDate,
      endDate
    });
    
    // Open the dialog
    document.getElementById('add-exclusion-trigger')?.click();
  };

  // Update the handleSubmitToMarketingOps function
  const handleSubmitToMarketingOps = async () => {
    if (!selectedWeek) return;
    
    // Validate checker name
    if (!checkerName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter the checker name",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const [startDate, endDate] = selectedWeek.split('_');
      
      const response = await fetch('/api/submit-to-marketing-ops', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate,
          endDate,
          submittedBy: checkerName, // Use the checker name instead of hardcoded value
          submissionDate: new Date().toISOString(), // Add the current timestamp
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit to Marketing Ops');
      }
      
      setIsSubmitted(true);
      setSubmissionDate(result.submissionDate);
      setSubmittedBy(result.submittedBy || null);
      toast({
        title: "Success",
        description: "Data has been submitted to Marketing Ops and is now finalized.",
      });
    } catch (error) {
      console.error('Error submitting to Marketing Ops:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit to Marketing Ops",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update the effect to check submission status to also fetch the submission date and submitter
  useEffect(() => {
    if (selectedWeek) {
      const checkSubmissionStatus = async () => {
        const [startDate, endDate] = selectedWeek.split('_');
        try {
          const response = await fetch(`/api/submission-status?startDate=${startDate}&endDate=${endDate}`);
          const data = await response.json();
          setIsSubmitted(data.isSubmitted);
          setSubmissionDate(data.submissionDate || null);
          setSubmittedBy(data.submittedBy || null);
        } catch (error) {
          console.error('Error checking submission status:', error);
        }
      };
      
      checkSubmissionStatus();
    }
  }, [selectedWeek]);

  // First, let's add a debug log to see what's in the excludedReferees array
  useEffect(() => {
    console.log('Current excluded referees:', excludedReferees);
  }, [excludedReferees]);

  // Add this function to handle CSV export
  const handleExportCSV = () => {
    if (!allData.length) return;
    
    // Create CSV content
    const headers = [
      "Member Login",
      "Member Name",
      "Start Date",
      "End Date",
      "Member Group",
      "Level",
      "Referee",
      "Deposit",
      "Win/Loss",
      "Turnover",
      "Rate",
      "Commission",
      "Excluded"
    ];
    
    const csvContent = allData.map(row => {
      const isRefereeExcluded = excludedReferees.includes(row.RELATIVE_LEVEL_REFEREE_LOGIN);
      const isReferrerExcluded = excludedReferees.includes(row.MEMBER_LOGIN);
      const isExcluded = isRefereeExcluded || isReferrerExcluded;
      
      const exclusionNote = isRefereeExcluded ? ' (referee excluded)' : 
                           isReferrerExcluded ? ' (referrer excluded)' : '';
      
      return [
        `${row.MEMBER_LOGIN}${isReferrerExcluded ? ' (excluded)' : ''}`,
        row.MEMBER_NAME,
        new Date(row.START_DATE).toISOString().split('T')[0],
        new Date(row.END_DATE).toISOString().split('T')[0],
        row.MEMBER_GROUP,
        row.RELATIVE_LEVEL,
        `${row.RELATIVE_LEVEL_REFEREE_LOGIN}${isRefereeExcluded ? ' (excluded)' : ''}`,
        (row.TOTAL_DEPOSIT_AMOUNT || 0).toFixed(2),
        (row.TOTAL_WIN_LOSS || 0).toFixed(2),
        (row.TOTAL_VALID_TURNOVER || 0).toFixed(2),
        `${((row.COMMISSION_RATE || 0) * 100).toFixed(2)}%`,
        (row.LOCAL_COMMISSION_AMOUNT || 0).toFixed(2),
        isExcluded ? "YES" : "NO"
      ];
    });
    
    // Convert to CSV string
    const csvArray = [headers, ...csvContent].map(row => row.join(","));
    const csvString = csvArray.join("\n");
    
    // Create a blob and download
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    // Create filename with date range
    let filename = "compliance-checklist";
    if (selectedWeek) {
      const [startDate, endDate] = selectedWeek.split('_');
      filename += `-${startDate}-to-${endDate}`;
    }
    filename += ".csv";
    
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Manually add 8 hours to convert UTC to GMT+8
  const formatToGMT8 = (dateString: string) => {
    // Parse the UTC date string
    const utcDate = new Date(dateString);
    
    // Manually add 8 hours to convert to GMT+8
    const gmt8Date = new Date(utcDate.getTime() + (8 * 60 * 60 * 1000));
    
    // Format the date
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(gmt8Date);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Select value={selectedWeek || ''} onValueChange={handleWeekChange}>
            <SelectTrigger className="w-[300px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select week" />
            </SelectTrigger>
            <SelectContent>
              {weeklyIntervals.map((interval) => (
                <SelectItem key={interval.value} value={interval.value}>
                  {interval.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex space-x-2">
          <div className="flex items-center">
            {isSubmitted ? (
              <div className="inline-flex items-center rounded-full border border-green-500 bg-green-50 px-3 py-1 text-sm font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
                <CheckCircle className="mr-1 h-4 w-4" />
                Already Submitted by {submittedBy} {submissionDate && `on ${formatToGMT8(submissionDate)}`}
              </div>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="default" 
                    disabled={!selectedWeek || isSubmitting || filteredData.length === 0}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {isSubmitting ? "Submitting..." : "Submit to Marketing Ops"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Submit to Marketing Ops</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. The current compliance data will be finalized and sent to Marketing Operations.
                      
                      {filteredData.length > 0 && (
                        <div className="mt-2">
                          <p>You are about to submit {filteredData.length} records with a total commission of {formatCurrency(calculateSummary().adjustedAmount, filteredData[0]?.MEMBER_CURRENCY || 'PHP')}.</p>
                          
                          {calculateSummary().excludedAmount > 0 && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Note: {formatCurrency(calculateSummary().excludedAmount, filteredData[0]?.MEMBER_CURRENCY || 'PHP')} has been excluded from the original total of {formatCurrency(calculateSummary().totalAmount, filteredData[0]?.MEMBER_CURRENCY || 'PHP')}.
                            </p>
                          )}
                        </div>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <div className="py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="checkerName" className="text-right">
                        Checker Name
                      </Label>
                      <Input
                        id="checkerName"
                        name="checkerName"
                        value={checkerName}
                        onChange={(e) => setCheckerName(e.target.value)}
                        className="col-span-3"
                        required
                        placeholder="Enter your name"
                      />
                    </div>
                  </div>

                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSubmitToMarketingOps}>Submit</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={loading || allData.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button id="add-exclusion-trigger" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Exclusion
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add User to Exclusion List</DialogTitle>
                <DialogDescription>
                  Excluded users will not participate in commission calculations as either referrers or referees.
                </DialogDescription>
              </DialogHeader>
              
              {exclusionError && (
                <Alert variant="destructive" className="mt-2 mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{exclusionError}</AlertDescription>
                </Alert>
              )}
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="referee-login" className="text-right">
                    Username
                  </Label>
                  <Input
                    id="referee-login"
                    value={newExclusion.refereeLogin}
                    onChange={(e) => setNewExclusion({...newExclusion, refereeLogin: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="excluded-by" className="text-right">
                    Excluded By
                  </Label>
                  <Input
                    id="excluded-by"
                    value={newExclusion.excludedBy}
                    onChange={(e) => setNewExclusion({...newExclusion, excludedBy: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="start-date" className="text-right">
                    Start Date
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
                    End Date
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
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="submit" 
                  onClick={handleAddExclusion} 
                  disabled={isAddingExclusion}
                >
                  {isAddingExclusion ? "Adding..." : "Add Exclusion"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Enhanced Summary Statistics */}
      {filteredData.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {/* Total Records */}
          <Card className="bg-background/50">
            <CardContent className="pt-4">
              <div className="text-sm font-bold text-foreground mb-2">
                Total Records
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <div className="text-lg font-semibold">
                    {filteredData.length}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    entries
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {calculateSummary().uniqueMembersCount} unique members
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Commission - updated to show both total and adjusted */}
          <Card className="bg-background/50">
            <CardContent className="pt-4">
              <div className="text-sm font-bold text-foreground mb-2">
                Total Commission
              </div>
              <div className="flex flex-col">
                <div className="text-lg font-semibold">
                  {formatCurrency(calculateSummary().adjustedAmount, filteredData[0]?.MEMBER_CURRENCY || 'PHP')}
                </div>
                {calculateSummary().excludedAmount > 0 && (
                  <div className="text-xs text-muted-foreground">
                    <span className="text-red-500">-{formatCurrency(calculateSummary().excludedAmount, filteredData[0]?.MEMBER_CURRENCY || 'PHP')}</span> excluded
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  from {formatCurrency(calculateSummary().totalAmount, filteredData[0]?.MEMBER_CURRENCY || 'PHP')} total
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Highest Commission Member */}
          <Card className="bg-background/50">
            <CardContent className="pt-4">
              <div className="text-sm font-bold text-foreground mb-2">
                Highest Commission
              </div>
              <div className="flex flex-col">
                <div className="text-lg font-semibold">
                  {formatCurrency(calculateSummary().highestCommissionMember.amount, calculateSummary().highestCommissionMember.currency || 'PHP')}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {calculateSummary().highestCommissionMember.memberLogin || 'N/A'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Commission Distribution */}
          <Card className="bg-background/50">
            <CardContent className="pt-4">
              <div className="text-sm font-bold text-foreground mb-2">
                Commission Distribution
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Above {formatCurrency(5000, 'PHP')}:</span>
                  <span className="font-medium">{filteredData.filter(item => item.LOCAL_COMMISSION_AMOUNT > 5000).length}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">{formatCurrency(1000, 'PHP')}-{formatCurrency(5000, 'PHP')}:</span>
                  <span className="font-medium">{filteredData.filter(item => item.LOCAL_COMMISSION_AMOUNT > 1000 && item.LOCAL_COMMISSION_AMOUNT <= 5000).length}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">{formatCurrency(500, 'PHP')}-{formatCurrency(1000, 'PHP')}:</span>
                  <span className="font-medium">{filteredData.filter(item => item.LOCAL_COMMISSION_AMOUNT > 500 && item.LOCAL_COMMISSION_AMOUNT <= 1000).length}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Below {formatCurrency(500, 'PHP')}:</span>
                  <span className="font-medium">{filteredData.filter(item => item.LOCAL_COMMISSION_AMOUNT <= 500).length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {loading ? (
        <div className="flex h-[400px] items-center justify-center">
          Loading...
        </div>
      ) : !selectedWeek ? (
        <div className="flex h-[400px] items-center justify-center text-muted-foreground">
          Please select a week to view compliance data
        </div>
      ) : filteredData.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member Login</TableHead>
              <TableHead>Member Name</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Member Group</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Referee</TableHead>
              <TableHead className="text-right">Deposit</TableHead>
              <TableHead className="text-right">Win/Loss</TableHead>
              <TableHead className="text-right">Turnover</TableHead>
              <TableHead className="text-right">Rate</TableHead>
              <TableHead className="text-right">Commission</TableHead>
              <TableHead>Excluded</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((row, index) => {
              // Check if this row's referee is in the excluded list
              const refereeLogin = row.RELATIVE_LEVEL_REFEREE_LOGIN;
              const memberLogin = row.MEMBER_LOGIN;
              
              const isRefereeExcluded = excludedReferees.some(excludedRef => 
                excludedRef.toLowerCase() === refereeLogin?.toLowerCase()
              );
              
              const isReferrerExcluded = excludedReferees.some(excludedRef => 
                excludedRef.toLowerCase() === memberLogin?.toLowerCase()
              );
              
              const isExcluded = isRefereeExcluded || isReferrerExcluded;
              
              return (
                <TableRow 
                  key={`${row.MEMBER_LOGIN}-${index}`}
                  className={isExcluded ? "bg-red-50 dark:bg-red-950/10" : ""}
                >
                  <TableCell>
                    {row.MEMBER_LOGIN}
                    {isReferrerExcluded && (
                      <span className="ml-2 text-xs text-red-500">(excluded)</span>
                    )}
                  </TableCell>
                  <TableCell>{row.MEMBER_NAME || '-'}</TableCell>
                  <TableCell>{row.START_DATE.split(' ')[0]}</TableCell>
                  <TableCell>{row.END_DATE.split(' ')[0]}</TableCell>
                  <TableCell>{row.MEMBER_GROUP || '-'}</TableCell>
                  <TableCell>{row.RELATIVE_LEVEL || '-'}</TableCell>
                  <TableCell>
                    {refereeLogin || '-'}
                    {isRefereeExcluded && (
                      <span className="ml-2 text-xs text-red-500">(excluded)</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(row.TOTAL_DEPOSIT_AMOUNT || 0, row.MEMBER_CURRENCY)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(row.TOTAL_WIN_LOSS || 0, row.MEMBER_CURRENCY)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(row.TOTAL_VALID_TURNOVER || 0, row.MEMBER_CURRENCY)}
                  </TableCell>
                  <TableCell className="text-right">
                    {((row.COMMISSION_RATE || 0) * 100).toFixed(2)}%
                  </TableCell>
                  <TableCell className={`text-right ${isExcluded ? "text-red-500" : ""}`}>
                    {formatCurrency(row.LOCAL_COMMISSION_AMOUNT || 0, row.MEMBER_CURRENCY)}
                  </TableCell>
                  <TableCell>
                    {isExcluded ? "YES" : "NO"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <div className="flex h-[400px] items-center justify-center text-muted-foreground">
          No compliance data for selected week
        </div>
      )}
    </div>
  );
} 