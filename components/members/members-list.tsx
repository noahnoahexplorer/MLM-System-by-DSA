"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface CommissionData {
  START_DATE: string;
  END_DATE: string;
  MEMBER_ID: string;
  MEMBER_LOGIN: string;
  MEMBER_CURRENCY: string;
  RELATIVE_LEVEL: number;
  RELATIVE_LEVEL_REFEREE_LOGIN: string;
  TOTAL_COMMISSION: number;
  REFEREE_DEPOSIT: number;
  REFEREE_TURNOVER: number;
  REFEREE_WIN_LOSS: number;
}

interface DetailedCommissionData {
  RELATIVE_LEVEL: number;
  RELATIVE_LEVEL_REFEREE_LOGIN: string;
  TOTAL_COMMISSION: number;
  TOTAL_DEPOSIT_AMOUNT: number;
  TOTAL_VALID_TURNOVER: number;
  TOTAL_WIN_LOSS: number;
}

interface MemberSummary {
  totalCommission: number;
  uniqueReferees: number;
  totalDeposit: number;
  totalTurnover: number;
  totalWinLoss: number;
}

export default function MembersList() {
  const [data, setData] = useState<CommissionData[]>([]);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [detailedData, setDetailedData] = useState<DetailedCommissionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    try {
      console.log('Searching for:', searchTerm);
      
      const response = await fetch('/api/mlm-network');
      const result = await response.json();
      
      console.log('API response:', result);
      
      if (!result.commission) {
        throw new Error('No commission data received');
      }

      // Simplified filter logic to only search by MEMBER_LOGIN
      const filteredData = result.commission.filter((item: CommissionData) => {
        const matchesLogin = item.MEMBER_LOGIN.toLowerCase().includes(searchTerm.toLowerCase());
        console.log('Checking member:', {
          memberLogin: item.MEMBER_LOGIN,
          searchTerm,
          matches: matchesLogin
        });
        return matchesLogin;
      });
      
      console.log('Filtered data:', filteredData);
      
      setData(filteredData);
      setHasSearched(true);
    } catch (error) {
      console.error('Error fetching data:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate.split(' ')[0]);
    const end = new Date(endDate.split(' ')[0]);
    
    return `${start.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })} - ${end.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })}`;
  };

  const fetchDetailedData = async (memberLogin: string, startDate: string, endDate: string) => {
    try {
      console.log('Fetching details for:', { memberLogin, startDate, endDate }); // Debug log
      
      const response = await fetch(`/api/mlm-network/details?memberLogin=${memberLogin}&startDate=${startDate}&endDate=${endDate}`);
      const result = await response.json();
      
      console.log('Details API response:', result); // Debug log
      
      return result.details;
    } catch (error) {
      console.error('Error fetching detailed data:', error);
      return [];
    }
  };

  const handleRowClick = async (row: CommissionData) => {
    const rowKey = `${row.START_DATE}-${row.MEMBER_ID}`;
    
    if (expandedRow === rowKey) {
      // Clicking an expanded row collapses it
      setExpandedRow(null);
      setDetailedData([]);
      return;
    }

    // Expand the clicked row
    setExpandedRow(rowKey);
    try {
      const details = await fetchDetailedData(
        row.MEMBER_LOGIN,
        row.START_DATE,
        row.END_DATE
      );
      setDetailedData(details || []);
    } catch (error) {
      console.error('Error loading details:', error);
      setDetailedData([]);
    }
  };

  const calculateMemberSummary = (data: CommissionData[]): MemberSummary => {
    const uniqueRefereesByLevel = new Map<number, Set<string>>();
    
    return data.reduce((summary, row) => {
      if (row.RELATIVE_LEVEL_REFEREE_LOGIN) {
        // Initialize Set for this level if it doesn't exist
        if (!uniqueRefereesByLevel.has(row.RELATIVE_LEVEL)) {
          uniqueRefereesByLevel.set(row.RELATIVE_LEVEL, new Set());
        }
        // Add referee to the appropriate level set
        uniqueRefereesByLevel.get(row.RELATIVE_LEVEL)?.add(row.RELATIVE_LEVEL_REFEREE_LOGIN);
      }

      // Count total unique referees across all levels
      const totalUniqueReferees = Array.from(uniqueRefereesByLevel.values())
        .reduce((total, set) => total + set.size, 0);

      return {
        totalCommission: summary.totalCommission + (row.TOTAL_COMMISSION || 0),
        uniqueReferees: totalUniqueReferees,
        totalDeposit: summary.totalDeposit + (row.REFEREE_DEPOSIT || 0),
        totalTurnover: summary.totalTurnover + (row.REFEREE_TURNOVER || 0),
        totalWinLoss: summary.totalWinLoss + (row.REFEREE_WIN_LOSS || 0),
      };
    }, {
      totalCommission: 0,
      uniqueReferees: 0,
      totalDeposit: 0,
      totalTurnover: 0,
      totalWinLoss: 0,
    });
  };

  const renderSummaryCards = (data: CommissionData[]) => {
    const summary = calculateMemberSummary(data);
    const currency = data[0]?.MEMBER_CURRENCY || 'USD';

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
        {/* Referrer's metrics */}
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Referrer Commission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.totalCommission, currency)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Referees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.uniqueReferees}</div>
          </CardContent>
        </Card>

        {/* Referees' performance metrics */}
        <Card className="border-l-4 border-l-secondary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Referees' Deposits
            </CardTitle>
            <span className="text-xs text-muted-foreground">Total from all referees</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.totalDeposit, currency)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-secondary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Referees' Turnover
            </CardTitle>
            <span className="text-xs text-muted-foreground">Total from all referees</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.totalTurnover, currency)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-secondary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Referees' Total Win/Loss
            </CardTitle>
            <span className="text-xs text-muted-foreground">Total from all referees</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.totalWinLoss, currency)}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search member..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={handleSearch} disabled={loading}>
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {hasSearched && !loading && data.length > 0 && renderSummaryCards(data)}

      {loading ? (
        <div className="flex h-[400px] items-center justify-center">
          Loading...
        </div>
      ) : hasSearched ? (
        data.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date Range</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead className="text-right">Total Commission</TableHead>
                  <TableHead colSpan={3} className="text-center border-l">
                    Referee's Performance
                  </TableHead>
                </TableRow>
                <TableRow>
                  <TableHead></TableHead>
                  <TableHead></TableHead>
                  <TableHead></TableHead>
                  <TableHead></TableHead>
                  <TableHead className="text-right">Total Deposit</TableHead>
                  <TableHead className="text-right">Valid Turnover</TableHead>
                  <TableHead className="text-right">NGR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => (
                  <>
                    <TableRow 
                      key={`${row.START_DATE}-${row.MEMBER_ID}`}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleRowClick(row)}
                    >
                      <TableCell>{formatDateRange(row.START_DATE, row.END_DATE)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{row.MEMBER_LOGIN}</div>
                          <div className="text-sm text-muted-foreground">
                            ID: {row.MEMBER_ID}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{row.MEMBER_CURRENCY}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(row.TOTAL_COMMISSION, row.MEMBER_CURRENCY)}
                      </TableCell>
                      <TableCell className="text-right border-l">
                        {formatCurrency(row.REFEREE_DEPOSIT, row.MEMBER_CURRENCY)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(row.REFEREE_TURNOVER, row.MEMBER_CURRENCY)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(row.REFEREE_WIN_LOSS, row.MEMBER_CURRENCY)}
                      </TableCell>
                    </TableRow>
                    {expandedRow === `${row.START_DATE}-${row.MEMBER_ID}` && (
                      <TableRow>
                        <TableCell colSpan={7}>
                          <div className="py-4">
                            <h4 className="font-semibold mb-2">Breakdown by Referee Level</h4>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Level</TableHead>
                                  <TableHead className="text-right">Commission</TableHead>
                                  <TableHead className="text-right">Deposit</TableHead>
                                  <TableHead className="text-right">Turnover</TableHead>
                                  <TableHead className="text-right">NGR</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {Array.isArray(detailedData) && detailedData.length > 0 ? (
                                  detailedData.map((detail) => (
                                    <TableRow key={detail.RELATIVE_LEVEL}>
                                      <TableCell>
                                        {detail.RELATIVE_LEVEL}
                                        <div className="text-sm text-muted-foreground">
                                          Referee: {detail.RELATIVE_LEVEL_REFEREE_LOGIN.split(':').join(' ')}
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {formatCurrency(detail.TOTAL_COMMISSION, row.MEMBER_CURRENCY)}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {formatCurrency(detail.TOTAL_DEPOSIT_AMOUNT, row.MEMBER_CURRENCY)}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {formatCurrency(detail.TOTAL_VALID_TURNOVER, row.MEMBER_CURRENCY)}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {formatCurrency(detail.TOTAL_WIN_LOSS, row.MEMBER_CURRENCY)}
                                      </TableCell>
                                    </TableRow>
                                  ))
                                ) : (
                                  <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                                      No detailed data available
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </>
        ) : (
          <div className="flex h-[400px] items-center justify-center text-muted-foreground">
            No results found
          </div>
        )
      ) : (
        <div className="flex h-[400px] items-center justify-center text-muted-foreground">
          Search for a member to view their commission data
        </div>
      )}
    </div>
  );
} 