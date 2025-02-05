"use client";

import { useState, useEffect } from "react";
import { Download, Calendar } from "lucide-react";
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

interface CommissionData {
  START_DATE: string;
  END_DATE: string;
  MEMBER_ID: string;
  MEMBER_LOGIN: string;
  MEMBER_CURRENCY: string;
  TOTAL_COMMISSION: number;
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

export default function WeeklyCommissionList() {
  const [allData, setAllData] = useState<CommissionData[]>([]);
  const [filteredData, setFilteredData] = useState<CommissionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(weeklyIntervals[0].value);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/weekly-commission');
      const result = await response.json();
      
      const commissionData = result.commission || [];
      setAllData(commissionData);
      filterDataByWeek(commissionData, selectedWeek);
    } catch (error) {
      console.error('Error fetching data:', error);
      setAllData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleWeekChange = (value: string) => {
    setSelectedWeek(value);
    filterDataByWeek(allData, value);
  };

  // Function to aggregate data by memberLogin
  const aggregateData = (data: CommissionData[]) => {
    const aggregatedMap = data.reduce((acc, curr) => {
      const key = curr.MEMBER_LOGIN;
      if (!acc.has(key)) {
        acc.set(key, {
          ...curr,
          TOTAL_COMMISSION: 0,
        });
      }
      const existing = acc.get(key)!;
      existing.TOTAL_COMMISSION += curr.TOTAL_COMMISSION;
      return acc;
    }, new Map<string, CommissionData>());

    return Array.from(aggregatedMap.values());
  };

  const filterDataByWeek = (data: CommissionData[], week: string) => {
    const [startDate, endDate] = week.split('_');
    setFilteredData(data.filter(item => {
      const itemDate = item.START_DATE.split(' ')[0];
      return itemDate >= startDate && itemDate <= endDate;
    }));
  };

  // Calculate summary with aggregated data
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
    
    const averageCommission = totalAmount / filteredData.length;
    
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
      uniqueMembers: filteredData.length,
      highestCommission: highestRow.TOTAL_COMMISSION,
      averageCommission,
      memberWithHighest: highestRow.MEMBER_LOGIN,
      totalAbove1000: commissionRanges.above5000 + commissionRanges.above1000,
      commissionRanges
    };
  };

  // Modify the export function to use aggregated data
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
        `"${startDate}"`,                    // Use date only
        `"${endDate}"`,                      // Use date only
        row.TOTAL_COMMISSION,
        '"Referral Commission"',
        '"Referral Commission"',
        '"Referral"',
        '"Commission"',
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
      link.setAttribute('download', `weekly_commission_${selectedWeek}.xls`);
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
          value={selectedWeek}
          onValueChange={handleWeekChange}
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
        <Button 
          onClick={handleExport} 
          disabled={!filteredData.length}
          variant="outline"
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Enhanced Summary Statistics */}
      {filteredData.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {/* Total Records */}
          <Card className="bg-background/50">
            <CardContent className="pt-4">
              <div className="text-sm font-bold text-foreground mb-2">
                Total Records
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-lg font-semibold">
                  {calculateSummary().totalRows}
                </div>
                <div className="text-xs text-muted-foreground">
                  members
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Total: {formatCurrency(calculateSummary().totalAmount, 'PHP')}
              </div>
            </CardContent>
          </Card>

          {/* Highest Commission */}
          <Card className="bg-background/50">
            <CardContent className="pt-4">
              <div className="text-sm font-bold text-foreground mb-2">
                Highest Commission
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-lg font-semibold">
                  {formatCurrency(calculateSummary().highestCommission, 'PHP')}
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Member: {calculateSummary().memberWithHighest}
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
                  <span className="font-medium">{calculateSummary().commissionRanges.above5000}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">{formatCurrency(1000, 'PHP')}-{formatCurrency(5000, 'PHP')}:</span>
                  <span className="font-medium">{calculateSummary().commissionRanges.above1000}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">{formatCurrency(500, 'PHP')}-{formatCurrency(1000, 'PHP')}:</span>
                  <span className="font-medium">{calculateSummary().commissionRanges.above500}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Below {formatCurrency(500, 'PHP')}:</span>
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
            {filteredData.map((row) => (
              <TableRow key={row.MEMBER_LOGIN}>
                <TableCell>{row.MEMBER_LOGIN}</TableCell>
                <TableCell>{row.START_DATE.split(' ')[0]}</TableCell>
                <TableCell>{row.END_DATE.split(' ')[0]}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(row.TOTAL_COMMISSION, row.MEMBER_CURRENCY)}
                </TableCell>
                <TableCell>Referral Commission</TableCell>
                <TableCell>Referral Commission</TableCell>
                <TableCell>Referral</TableCell>
                <TableCell>Commission</TableCell>
                <TableCell>no</TableCell>
                <TableCell></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="flex h-[400px] items-center justify-center text-muted-foreground">
          No commission data for selected week
        </div>
      )}
    </div>
  );
} 
