"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { PowerBITable } from '@/components/reports/power-bi-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AppSidebar } from '@/components/app-sidebar';
import { LogoutButton } from '@/components/logout-button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';

// Icons
const DollarSignIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" {...props}>
    <line x1="12" y1="1" x2="12" y2="23" stroke="currentColor" strokeWidth="2"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TrendingUpIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" {...props}>
    <polyline points="23,6 13.5,15.5 8.5,10.5 1,18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="17,6 23,6 23,12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CreditCardIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" {...props}>
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
    <line x1="1" y1="10" x2="23" y2="10" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

export default function FinancialReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dateRange, setDateRange] = useState('6months');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedUniversity, setSelectedUniversity] = useState('all');
  const [selectedSmallGroup, setSelectedSmallGroup] = useState('all');
  const [selectedAlumniGroup, setSelectedAlumniGroup] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Financial filters
  const [paymentProvider, setPaymentProvider] = useState('all');
  const [contributionType, setContributionType] = useState('all');
  const [amountFrom, setAmountFrom] = useState('');
  const [amountTo, setAmountTo] = useState('');
  
  const [isClient, setIsClient] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Cascading dropdown data
  const [regions, setRegions] = useState<Array<{id: number; name: string}>>([]);
  const [universities, setUniversities] = useState<Array<{id: number; name: string; regionId: number}>>([]);
  const [smallGroups, setSmallGroups] = useState<Array<{id: number; name: string; regionId: number; universityId: number}>>([]);
  const [alumniGroups, setAlumniGroups] = useState<Array<{id: number; name: string; regionId: number}>>([]);
  const [paymentProviders, setPaymentProviders] = useState<Array<{id: number; name: string}>>([]);

  // Authentication check
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push('/');
    }
  }, [status, router]);

  // Mock data generators
  const generateFinancialTrendsData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    return months.slice(0, currentMonth + 1).map((month, index) => {
      const totalRevenue = 15000 + (index * 2000) + (index % 3) * 3000;
      const totalExpenses = 8000 + (index * 1200) + (index % 2) * 1500;
      const netIncome = totalRevenue - totalExpenses;
      const contributionCount = 45 + (index * 8) + (index % 3) * 12;
      
      return {
        month,
        totalRevenue,
        totalExpenses,
        netIncome,
        contributionCount,
        averageContribution: Math.floor(totalRevenue / contributionCount)
      };
    });
  };

  const generateRevenueByTypeData = () => [
    { name: 'Monthly Contributions', value: 60, color: '#3B82F6', amount: 45000 },
    { name: 'Event Fees', value: 25, color: '#10B981', amount: 18750 },
    { name: 'Donations', value: 10, color: '#F59E0B', amount: 7500 },
    { name: 'Other', value: 5, color: '#8B5CF6', amount: 3750 }
  ];

  const generateRegionalFinancialData = () => [
    { region: 'North', totalRevenue: 25000, totalExpenses: 15000, netIncome: 10000, contributionCount: 120 },
    { region: 'South', totalRevenue: 22000, totalExpenses: 13000, netIncome: 9000, contributionCount: 95 },
    { region: 'East', totalRevenue: 30000, totalExpenses: 18000, netIncome: 12000, contributionCount: 140 },
    { region: 'West', totalRevenue: 18000, totalExpenses: 11000, netIncome: 7000, contributionCount: 85 },
    { region: 'Central', totalRevenue: 15000, totalExpenses: 9000, netIncome: 6000, contributionCount: 70 }
  ];

  // State for data
  const [analyticsData, setAnalyticsData] = useState<{
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
    totalContributions: number;
    averageContribution: number;
    revenueByType: Array<{name: string; value: number; color: string; amount: number}>;
    regionalFinancial: Array<{region: string; totalRevenue: number; totalExpenses: number; netIncome: number; contributionCount: number}>;
    financialTrends: Array<{month: string; totalRevenue: number; totalExpenses: number; netIncome: number; contributionCount: number; averageContribution: number}>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize data on client side
  useEffect(() => {
    setIsClient(true);
    fetchRegions();
    fetchPaymentProviders();
    fetchFinancialAnalytics();
  }, []);

  // Fetch financial analytics data
  const fetchFinancialAnalytics = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      
      const params = new URLSearchParams();
      if (selectedRegion && selectedRegion !== 'all') params.append('regionId', selectedRegion);
      if (selectedUniversity && selectedUniversity !== 'all') params.append('universityId', selectedUniversity);
      if (selectedSmallGroup && selectedSmallGroup !== 'all') params.append('smallGroupId', selectedSmallGroup);
      if (selectedAlumniGroup && selectedAlumniGroup !== 'all') params.append('alumniGroupId', selectedAlumniGroup);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      if (paymentProvider && paymentProvider !== 'all') params.append('paymentProvider', paymentProvider);
      if (contributionType && contributionType !== 'all') params.append('contributionType', contributionType);
      if (amountFrom) params.append('amountFrom', amountFrom);
      if (amountTo) params.append('amountTo', amountTo);

      const response = await fetch(`/api/contributions/analytics?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch financial analytics data');
      }
      
      const data = await response.json();
      setAnalyticsData(data);
    } catch (err) {
      console.error('Error fetching financial analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch financial analytics data');
      // Fallback to mock data on error
      setAnalyticsData({
        totalRevenue: 110000,
        totalExpenses: 66000,
        netIncome: 44000,
        totalContributions: 510,
        averageContribution: 215.69,
        revenueByType: generateRevenueByTypeData(),
        regionalFinancial: generateRegionalFinancialData(),
        financialTrends: generateFinancialTrendsData()
      });
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  // Fetch regions on component mount
  const fetchRegions = async () => {
    try {
      const response = await fetch('/api/regions');
      const data = await response.json();
      setRegions(data);
    } catch (error) {
      console.error('Error fetching regions:', error);
    }
  };

  // Fetch payment providers
  const fetchPaymentProviders = async () => {
    try {
      const response = await fetch('/api/payment-providers');
      const data = await response.json();
      setPaymentProviders(data);
    } catch (error) {
      console.error('Error fetching payment providers:', error);
    }
  };

  // Fetch universities when region changes
  useEffect(() => {
    if (selectedRegion && selectedRegion !== 'all') {
      fetchUniversities(Number(selectedRegion));
      fetchAlumniGroups(Number(selectedRegion));
    } else {
      setUniversities([]);
      setAlumniGroups([]);
      setSelectedUniversity('');
      setSelectedAlumniGroup('');
    }
  }, [selectedRegion]);

  // Fetch small groups when university changes
  useEffect(() => {
    if (selectedUniversity && selectedUniversity !== 'all') {
      fetchSmallGroups(Number(selectedUniversity));
    } else {
      setSmallGroups([]);
      setSelectedSmallGroup('');
    }
  }, [selectedUniversity]);

  const fetchUniversities = async (regionId: number) => {
    try {
      const response = await fetch(`/api/universities?regionId=${regionId}`);
      const data = await response.json();
      setUniversities(data);
    } catch (error) {
      console.error('Error fetching universities:', error);
    }
  };

  const fetchSmallGroups = async (universityId: number) => {
    try {
      const response = await fetch(`/api/small-groups?universityId=${universityId}`);
      const data = await response.json();
      setSmallGroups(data);
    } catch (error) {
      console.error('Error fetching small groups:', error);
    }
  };

  const fetchAlumniGroups = async (regionId: number) => {
    try {
      const response = await fetch(`/api/alumni-small-groups?regionId=${regionId}`);
      const data = await response.json();
      setAlumniGroups(data);
    } catch (error) {
      console.error('Error fetching alumni groups:', error);
    }
  };

  // Refetch analytics when filters change (without loading state)
  useEffect(() => {
    if (isClient) {
      fetchFinancialAnalytics(false);
    }
  }, [selectedRegion, selectedUniversity, selectedSmallGroup, selectedAlumniGroup, dateFrom, dateTo, paymentProvider, contributionType, amountFrom, amountTo]);

  // Calculate key metrics from data
  const keyMetrics = useMemo(() => {
    if (!analyticsData) {
      return {
        totalRevenue: 0,
        totalExpenses: 0,
        netIncome: 0,
        totalContributions: 0,
        averageContribution: 0,
        growthRate: 0
      };
    }

    return {
      totalRevenue: analyticsData.totalRevenue || 0,
      totalExpenses: analyticsData.totalExpenses || 0,
      netIncome: analyticsData.netIncome || 0,
      totalContributions: analyticsData.totalContributions || 0,
      averageContribution: analyticsData.averageContribution || 0,
      growthRate: analyticsData.financialTrends && analyticsData.financialTrends.length > 1 
        ? ((analyticsData.financialTrends[analyticsData.financialTrends.length - 1].netIncome - 
            analyticsData.financialTrends[analyticsData.financialTrends.length - 2].netIncome) / 
            analyticsData.financialTrends[analyticsData.financialTrends.length - 2].netIncome * 100) 
        : 0
    };
  }, [analyticsData]);

  // Process data for Power BI table
  const processedFinancialData = useMemo(() => {
    if (!analyticsData) return [];

    // Create regional data for the table
    const regionalData = analyticsData.regionalFinancial?.map(region => ({
      region: region.region,
      university: 'All Universities',
      smallGroup: 'All Small Groups',
      totalRevenue: region.totalRevenue,
      previousPeriodRevenue: Math.max(0, region.totalRevenue - 5000), // Estimate previous period
      totalExpenses: region.totalExpenses,
      previousPeriodExpenses: Math.max(0, region.totalExpenses - 3000),
      netIncome: region.netIncome,
      previousPeriodNetIncome: Math.max(0, region.netIncome - 2000),
      contributionCount: region.contributionCount,
      previousPeriodContributionCount: Math.max(0, region.contributionCount - 10),
      averageContribution: Math.floor(region.totalRevenue / region.contributionCount),
      previousPeriodAverageContribution: Math.floor((region.totalRevenue - 5000) / Math.max(1, region.contributionCount - 10))
    })) || [];

    return regionalData;
  }, [analyticsData]);

  const dateRangeOptions = [
    { value: '3months', label: 'Last 3 Months' },
    { value: '6months', label: 'Last 6 Months' },
    { value: '1year', label: 'Last Year' },
    { value: 'all', label: 'All Time' }
  ];

  const contributionTypeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'monthly', label: 'Monthly Contributions' },
    { value: 'event', label: 'Event Fees' },
    { value: 'donation', label: 'Donations' },
    { value: 'other', label: 'Other' }
  ];

  // Handler functions for cascading dropdowns
  const handleRegionChange = (value: string) => {
    setSelectedRegion(value);
    setSelectedUniversity('all');
    setSelectedSmallGroup('all');
    setSelectedAlumniGroup('all');
  };

  const handleUniversityChange = (value: string) => {
    setSelectedUniversity(value);
    setSelectedSmallGroup('all');
  };

  const handleSmallGroupChange = (value: string) => {
    setSelectedSmallGroup(value);
  };

  const handleAlumniGroupChange = (value: string) => {
    setSelectedAlumniGroup(value);
  };

  // PDF Export Function
  const exportToPDF = async () => {
    if (!reportRef.current) return;
    
    setIsExporting(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Add header
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Ministry Management System', pageWidth / 2, 20, { align: 'center' });
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Financial Reports & Analytics', pageWidth / 2, 30, { align: 'center' });
      
      // Add report metadata
      pdf.setFontSize(10);
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 45);
      pdf.text(`Report Period: ${dateRangeOptions.find(opt => opt.value === dateRange)?.label || 'Custom'}`, 20, 50);
      
      // Add key metrics summary
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Executive Summary', 20, 70);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Total Revenue: $${keyMetrics.totalRevenue.toLocaleString()}`, 20, 80);
      pdf.text(`Total Expenses: $${keyMetrics.totalExpenses.toLocaleString()}`, 20, 85);
      pdf.text(`Net Income: $${keyMetrics.netIncome.toLocaleString()}`, 20, 90);
      pdf.text(`Total Contributions: ${keyMetrics.totalContributions}`, 20, 95);
      pdf.text(`Average Contribution: $${keyMetrics.averageContribution.toFixed(2)}`, 20, 100);
      pdf.text(`Growth Rate: ${keyMetrics.growthRate > 0 ? '+' : ''}${keyMetrics.growthRate.toFixed(1)}%`, 20, 105);
      
      // Save the PDF
      const fileName = `Financial_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Show loading state
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Redirecting...</h1>
          <p className="text-muted-foreground mb-4">Please wait while we redirect you to the login page.</p>
        </div>
      </div>
    );
  }

  // Show loading state until client-side data is ready
  if (!isClient || loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/dashboard">
                      Dashboard
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/links/reports">
                      Reports
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Financial Analytics</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="ml-auto px-4">
              <LogoutButton />
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white dark:text-white">Financial Analytics</h2>
                  <p className="text-gray-600 dark:text-gray-400">Comprehensive financial reports and insights</p>
                </div>
              </div>

              {/* Loading State */}
              <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Loading financial data...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Show error state
  if (error) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/dashboard">
                      Dashboard
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/links/reports">
                      Reports
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Financial Analytics</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="ml-auto px-4">
              <LogoutButton />
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white dark:text-white">Financial Analytics</h2>
                  <p className="text-gray-600 dark:text-gray-400">Comprehensive financial reports and insights</p>
                </div>
              </div>

              {/* Error State */}
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-destructive">
                  <span className="text-sm font-medium">Error:</span>
                  <span className="text-sm">{error}</span>
                </div>
                <button 
                  onClick={() => fetchFinancialAnalytics(true)}
                  className="mt-2 text-sm text-destructive hover:text-destructive/80 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/links/reports">
                    Reports
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Financial Analytics</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto px-4">
            <LogoutButton />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="space-y-6" ref={reportRef}>

            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white dark:text-white">Financial Analytics</h2>
                <p className="text-gray-600 dark:text-gray-400">Comprehensive financial reports and insights</p>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {showFilters ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Hide Filters
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                      Show Filters
                    </>
                  )}
                </Button>
                
                {/* Export Options Dropdown */}
                <div className="relative export-options-dropdown">
                  <Button
                    onClick={() => setShowExportOptions(!showExportOptions)}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export Options
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </Button>
                  
                  {showExportOptions && (
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                      <div className="p-4 space-y-4">
                        <Button
                          onClick={() => {
                            setShowExportOptions(false);
                            exportToPDF();
                          }}
                          disabled={isExporting}
                          className="w-full flex items-center justify-center gap-2"
                        >
                          {isExporting ? (
                            <>
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Exporting...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Export PDF
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">${keyMetrics.totalRevenue.toLocaleString()}</p>
                      <p className="text-sm text-green-500 dark:text-green-300">Total revenue</p>
                    </div>
                    <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                      <DollarSignIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-200 mt-2">Total Revenue</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">${keyMetrics.totalExpenses.toLocaleString()}</p>
                      <p className="text-sm text-red-500 dark:text-red-300">Total expenses</p>
                    </div>
                    <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
                      <CreditCardIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-200 mt-2">Total Expenses</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">${keyMetrics.netIncome.toLocaleString()}</p>
                      <p className="text-sm text-blue-500 dark:text-blue-300">
                        {keyMetrics.growthRate > 0 ? '+' : ''}{keyMetrics.growthRate.toFixed(1)}% from last period
                      </p>
                    </div>
                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                      <TrendingUpIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-200 mt-2">Net Income</p>
                </CardContent>
              </Card>
            </div>

            {/* Professional Filters Section */}
            {showFilters && (
              <div className="space-y-6">
                {/* Organizational Structure Filters */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Organizational Structure
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="region">Region</Label>
                        <Select value={selectedRegion} onValueChange={handleRegionChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select region" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Regions</SelectItem>
                            {regions.map((region) => (
                              <SelectItem key={region.id} value={region.id.toString()}>
                                {region.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="university">University</Label>
                        <Select 
                          value={selectedUniversity} 
                          onValueChange={handleUniversityChange}
                          disabled={!selectedRegion || selectedRegion === 'all'}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={selectedRegion && selectedRegion !== 'all' ? "Select university" : "Select region first"} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Universities</SelectItem>
                            {universities.map((university) => (
                              <SelectItem key={university.id} value={university.id.toString()}>
                                {university.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="smallGroup">Small Group</Label>
                        <Select 
                          value={selectedSmallGroup} 
                          onValueChange={handleSmallGroupChange}
                          disabled={!selectedUniversity || selectedUniversity === 'all'}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={selectedUniversity && selectedUniversity !== 'all' ? "Select small group" : "Select university first"} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Small Groups</SelectItem>
                            {smallGroups.map((smallGroup) => (
                              <SelectItem key={smallGroup.id} value={smallGroup.id.toString()}>
                                {smallGroup.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="alumniGroup">Alumni Group</Label>
                        <Select 
                          value={selectedAlumniGroup} 
                          onValueChange={handleAlumniGroupChange}
                          disabled={!selectedRegion || selectedRegion === 'all'}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={selectedRegion && selectedRegion !== 'all' ? "Select alumni group" : "Select region first"} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Alumni Groups</SelectItem>
                            {alumniGroups.map((alumniGroup) => (
                              <SelectItem key={alumniGroup.id} value={alumniGroup.id.toString()}>
                                {alumniGroup.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      Financial Filters
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="paymentProvider">Payment Provider</Label>
                        <Select value={paymentProvider} onValueChange={setPaymentProvider}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment provider" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Providers</SelectItem>
                            {paymentProviders.map((provider) => (
                              <SelectItem key={provider.id} value={provider.id.toString()}>
                                {provider.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="contributionType">Contribution Type</Label>
                        <Select value={contributionType} onValueChange={setContributionType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select contribution type" />
                          </SelectTrigger>
                          <SelectContent>
                            {contributionTypeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="dateRange">Time Period</Label>
                        <Select value={dateRange} onValueChange={setDateRange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select period" />
                          </SelectTrigger>
                          <SelectContent>
                            {dateRangeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="dateFrom">From Date</Label>
                        <Input
                          type="date"
                          value={dateFrom}
                          onChange={(e) => setDateFrom(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="amountFrom">Amount From</Label>
                        <Input
                          type="number"
                          placeholder="Minimum amount"
                          value={amountFrom}
                          onChange={(e) => setAmountFrom(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="amountTo">Amount To</Label>
                        <Input
                          type="number"
                          placeholder="Maximum amount"
                          value={amountTo}
                          onChange={(e) => setAmountTo(e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Filter Actions */}
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Use filters to generate specific financial reports for different audiences
                  </div>
                  <Button
                    onClick={() => {
                      setDateRange('6months');
                      setSelectedRegion('all');
                      setSelectedUniversity('all');
                      setSelectedSmallGroup('all');
                      setSelectedAlumniGroup('all');
                      setDateFrom('');
                      setDateTo('');
                      setPaymentProvider('all');
                      setContributionType('all');
                      setAmountFrom('');
                      setAmountTo('');
                    }}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Reset All Filters
                  </Button>
                </div>
              </div>
            )}

            {/* Power BI-Style Tables */}
            <PowerBITable 
              data={processedFinancialData}
              loading={loading}
              onExport={() => exportToPDF()}
              title="Financial Overview"
              description="Revenue, expenses, and net income by region"
            />

          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
