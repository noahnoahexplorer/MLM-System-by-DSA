"use client";

import { useState, useEffect, useCallback } from "react";
import { Download, Calendar, AlertCircle, RefreshCw, CheckCircle } from "lucide-react";
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
import { formatCurrency } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";

interface CommissionData {
  START_DATE: string;
  END_DATE: string;
  MEMBER_ID: string;
  MEMBER_LOGIN: string;
  MEMBER_CURRENCY: string;
  TOTAL_COMMISSION: number;
  GENERATION_DATE: string;
  SUBMITTED_BY?: string;
  complianceVerificationDate?: string;
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

// Manually add 8 hours to convert to GMT+8
const formatToGMT8 = (dateString: string): string => {
  if (!dateString) return '';
  
  // Parse the input date string
  const date = new Date(dateString);
  
  // Manually add 8 hours for GMT+8
  const gmt8Date = new Date(date.getTime() + (8 * 60 * 60 * 1000));
  
  // Format the date
  return gmt8Date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};

export default function FinalizedCommissionList() {
  const [allData, setAllData] = useState<CommissionData[]>([]);
  const [filteredData, setFilteredData] = useState<CommissionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  const [excludedCount, setExcludedCount] = useState(0);
  const [generationDate, setGenerationDate] = useState<string | null>(null);
  const [submissionInfo, setSubmissionInfo] = useState<{
    submittedBy: string;
    submissionDate: string;
    excludedRefereesCount: number;
    complianceVerificationDate?: string;
  } | null>(null);

  const fetchData = useCallback(async (weekValue: string, regenerate = false) => {
    setLoading(true);
    try {
      const [startDate, endDate] = weekValue.split('_');
      const response = await fetch(
        `/api/finalized-commission?startDate=${startDate}&endDate=${endDate}&regenerate=${regenerate}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      const commissionData = result.commission || [];
      setAllData(commissionData);
      setFilteredData(commissionData);
      setExcludedCount(result.excludedCount || 0);
      setGenerationDate(result.generationDate);
      setSubmissionInfo(result.submissionInfo || null);
      
      if (regenerate) {
        toast({
          title: "Commission List Regenerated",
          description: "The finalized commission list has been updated with the latest exclusions.",
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setAllData([]);
      setFilteredData([]);
      toast({
        title: "Error",
        description: "Failed to fetch commission data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  }, []);

  const handleWeekChange = (value: string) => {
    setSelectedWeek(value);
    fetchData(value, false);
  };

  // Calculate summary statistics
  const calculateSummary = () => {
    if (!filteredData.length) return {
      totalRows: 0,
      totalAmount: 0,
      uniqueMembers: 0,
      highestCommission: 0,
      averageCommission: 0,
      memberWithHighest: '',
      totalAbove1000: 0,
      commissionRanges: {
        above5000: 0,
        above1000: 0,
        above500: 0,
        below500: 0
      }
    };

    const totalAmount = filteredData.reduce((sum, row) => sum + row.TOTAL_COMMISSION, 0);
    const highestRow = filteredData.reduce((max, row) => 
      row.TOTAL_COMMISSION > max.TOTAL_COMMISSION ? row : max
    , filteredData[0]);
    
    // Count unique members
    const uniqueMembers = new Set(filteredData.map(row => row.MEMBER_LOGIN)).size;
    
    const averageCommission = totalAmount / uniqueMembers;
    
    // Calculate commission ranges
    const commissionRanges = filteredData.reduce((acc, row) => {
      if (row.TOTAL_COMMISSION > 5000) acc.above5000++;
      else if (row.TOTAL_COMMISSION > 1000) acc.above1000++;
      else if (row.TOTAL_COMMISSION > 500) acc.above500++;
      else acc.below500++;
      return acc;
    }, { above5000: 0, above1000: 0, above500: 0, below500: 0 });

    return {
      totalRows: filteredData.length,
      totalAmount,
      uniqueMembers,
      highestCommission: highestRow.TOTAL_COMMISSION,
      averageCommission,
      memberWithHighest: highestRow.MEMBER_LOGIN,
      totalAbove1000: commissionRanges.above5000 + commissionRanges.above1000,
      commissionRanges
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
      'startTime',
      'endTime',
      'amount',
      'rewardName',
      'description',
      'category',
      'categoryTitle',
      '1xturnover',
      'multiplier'
    ];
    excelContent += headers.join(',') + '\n';

    // Add data rows with proper Excel formatting
    filteredData.forEach(row => {
      const startDate = row.START_DATE.split(' ')[0]; // Extract only the date part
      const endDate = row.END_DATE.split(' ')[0];     // Extract only the date part
      
      const rowData = [
        `"${row.MEMBER_LOGIN}"`,
        `"${startDate}"`,
        `"${endDate}"`,
        row.TOTAL_COMMISSION,
        '"Referral Program"',
        '"Referral rewards made special – enjoy this angpao!"',
        '"Commission"',
        '"MLM Referral Program Weekly Commission"',
        '"no"',
        ''
      ];
      excelContent += rowData.join(',') + '\n';
    });

    // Create and trigger download
    const blob = new Blob([excelContent], { 
      type: 'application/vnd.ms-excel;charset=utf-8;' 
    });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      // Change extension to .xls for better Excel compatibility
      link.setAttribute('download', `finalized_commission_${selectedWeek}.xls`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Select
          value={selectedWeek || ""}
          onValueChange={handleWeekChange}
          disabled={loading || regenerating}
        >
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
        <div className="flex space-x-2">
          <Button 
            onClick={handleExport} 
            disabled={loading || regenerating || !filteredData.length}
            variant="outline"
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Generation date info */}
      <div className="mb-4">
        {/* Remove the Last generated line */}
        {/* <div className="flex items-center">
          <p className="text-sm text-muted-foreground">
            Last generated: {generationDate ? formatToGMT8(generationDate) : 'N/A'}
          </p>
        </div> */}
        
        {/* Keep only the compliance verification badge */}
        {submissionInfo && (
          <div className="inline-flex items-center rounded-full border border-green-500 bg-green-50 px-3 py-1 text-sm font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle className="mr-1 h-4 w-4" />
            Verified by Compliance Team on {formatToGMT8(submissionInfo.submissionDate)}
          </div>
        )}
      </div>

      {/* Exclusions Applied */}
      {excludedCount > 0 && (
        <Alert className="mb-4">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Exclusions Applied</AlertTitle>
          <AlertDescription>
            {excludedCount} referee{excludedCount > 1 ? 's have' : ' has'} been excluded from commission calculations.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Statistics */}
      {filteredData.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Commission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(calculateSummary().totalAmount, filteredData[0]?.MEMBER_CURRENCY || 'USD')}
              </div>
              <div className="text-xs text-muted-foreground">
                across {calculateSummary().uniqueMembers} members
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Highest Commission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(calculateSummary().highestCommission, filteredData[0]?.MEMBER_CURRENCY || 'USD')}
              </div>
              <div className="text-xs text-muted-foreground">
                {calculateSummary().memberWithHighest}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Average Commission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(calculateSummary().averageCommission, filteredData[0]?.MEMBER_CURRENCY || 'USD')}
              </div>
              <div className="text-xs text-muted-foreground">
                per member
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                High Value Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {calculateSummary().totalAbove1000}
              </div>
              <div className="text-xs text-muted-foreground">
                members above {formatCurrency(1000, filteredData[0]?.MEMBER_CURRENCY || 'USD')}
              </div>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Above {formatCurrency(5000, filteredData[0]?.MEMBER_CURRENCY || 'USD')}:</span>
                  <span className="font-medium">{calculateSummary().commissionRanges.above5000}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">{formatCurrency(1000, filteredData[0]?.MEMBER_CURRENCY || 'USD')}-{formatCurrency(5000, filteredData[0]?.MEMBER_CURRENCY || 'USD')}:</span>
                  <span className="font-medium">{calculateSummary().commissionRanges.above1000}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">{formatCurrency(500, filteredData[0]?.MEMBER_CURRENCY || 'USD')}-{formatCurrency(1000, filteredData[0]?.MEMBER_CURRENCY || 'USD')}:</span>
                  <span className="font-medium">{calculateSummary().commissionRanges.above500}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Below {formatCurrency(500, filteredData[0]?.MEMBER_CURRENCY || 'USD')}:</span>
                  <span className="font-medium">{calculateSummary().commissionRanges.below500}</span>
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
          Please select a week to view finalized commission data
        </div>
      ) : filteredData.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>memberLogin</TableHead>
              <TableHead>startTime</TableHead>
              <TableHead>endTime</TableHead>
              <TableHead className="text-right">amount</TableHead>
              <TableHead>rewardName</TableHead>
              <TableHead>description</TableHead>
              <TableHead>category</TableHead>
              <TableHead>categoryTitle</TableHead>
              <TableHead>1xturnover</TableHead>
              <TableHead>multiplier</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((row, index) => (
              <TableRow key={`${row.MEMBER_LOGIN}-${index}`}>
                <TableCell>{row.MEMBER_LOGIN}</TableCell>
                <TableCell>{row.START_DATE.split(' ')[0]}</TableCell>
                <TableCell>{row.END_DATE.split(' ')[0]}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(row.TOTAL_COMMISSION, row.MEMBER_CURRENCY)}
                </TableCell>
                <TableCell>Referral Program</TableCell>
                <TableCell>Referral rewards made special – enjoy this angpao!</TableCell>
                <TableCell>Commission</TableCell>
                <TableCell>MLM Referral Program Weekly Commission</TableCell>
                <TableCell>no</TableCell>
                <TableCell></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="flex h-[400px] items-center justify-center text-muted-foreground">
          No finalized commission data for selected week
        </div>
      )}
    </div>
  );
} 