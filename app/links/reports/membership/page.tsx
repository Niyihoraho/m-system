"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SuperAdminScopeSelector } from '@/components/super-admin-scope-selector';
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
const UsersIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" {...props}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TrendingUpIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" {...props}>
    <polyline points="23,6 13.5,15.5 8.5,10.5 1,18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="17,6 23,6 23,12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const GraduationCapIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" {...props}>
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 12v5c3 3 9 3 12 0v-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function MembershipReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dateRange, setDateRange] = useState('6months');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedUniversity, setSelectedUniversity] = useState('all');
  const [selectedSmallGroup, setSelectedSmallGroup] = useState('all');
  const [selectedAlumniGroup, setSelectedAlumniGroup] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Member form field filters
  const [memberType, setMemberType] = useState('all');
  const [memberStatus, setMemberStatus] = useState('all');
  const [gender, setGender] = useState('all');
  const [ageFrom, setAgeFrom] = useState('all');
  const [ageTo, setAgeTo] = useState('all');
  const [profession, setProfession] = useState('');
  const [faculty, setFaculty] = useState('');
  const [placeOfBirthProvince, setPlaceOfBirthProvince] = useState('');
  const [placeOfBirthDistrict, setPlaceOfBirthDistrict] = useState('');
  const [graduationYear, setGraduationYear] = useState('all');
  
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [includeMemberDetails, setIncludeMemberDetails] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Cascading dropdown data
  const [regions, setRegions] = useState<Array<{id: number; name: string}>>([]);
  const [universities, setUniversities] = useState<Array<{id: number; name: string; regionId: number}>>([]);
  const [smallGroups, setSmallGroups] = useState<Array<{id: number; name: string; regionId: number; universityId: number}>>([]);
  const [alumniGroups, setAlumniGroups] = useState<Array<{id: number; name: string; regionId: number}>>([]);

  // Authentication check
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push('/');
    }
  }, [status, router]);

  // Mock data generators
  const _generateMembershipGrowthData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    return months.slice(0, currentMonth + 1).map((month, index) => {
      const newMembers = 20 + (index * 5) + (index % 3) * 10;
      const graduatedMembers = 5 + (index * 2) + (index % 2) * 3;
      const inactiveMembers = 2 + (index % 4);
      const transferredIn = 3 + (index % 2);
      const transferredOut = 1 + (index % 3);
      const netGrowth = newMembers + transferredIn - graduatedMembers - inactiveMembers - transferredOut;
      const totalMembers = 500 + (index * 35) + (index % 3) * 20;
      
      return {
        month,
        newMembers,
        graduatedMembers,
        inactiveMembers,
        transferredIn,
        transferredOut,
        netGrowth,
        totalMembers,
        growthRate: index > 0 ? ((netGrowth / (totalMembers - netGrowth)) * 100) : 0
      };
    });
  };

  const _generateMemberTypeData = () => [
    { name: 'Students', value: 65, color: '#3B82F6', count: 1250 },
    { name: 'Graduates', value: 20, color: '#10B981', count: 385 },
    { name: 'Alumni', value: 10, color: '#F59E0B', count: 192 },
    { name: 'Staff', value: 3, color: '#8B5CF6', count: 58 },
    { name: 'Volunteers', value: 2, color: '#EF4444', count: 38 }
  ];

  const _generateRegionalData = () => [
    { region: 'North', members: 450, growth: 12, universities: 8 },
    { region: 'South', members: 380, growth: 8, universities: 6 },
    { region: 'East', members: 520, growth: 15, universities: 10 },
    { region: 'West', members: 340, growth: 5, universities: 5 },
    { region: 'Central', members: 290, growth: 3, universities: 4 }
  ];

  const _generateGenderData = () => [
    { name: 'Male', value: 55, color: '#3B82F6', count: 1056 },
    { name: 'Female', value: 45, color: '#EC4899', count: 864 }
  ];

  const _generateMemberFlowData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    return months.slice(0, currentMonth + 1).map((month, index) => ({
      month,
      increase: 25 + (index * 3) + (index % 2) * 8,
      decrease: 8 + (index * 1) + (index % 3) * 2,
      netChange: (25 + (index * 3) + (index % 2) * 8) - (8 + (index * 1) + (index % 3) * 2),
      cumulativeGrowth: 500 + (index * 20) + (index % 4) * 15
    }));
  };

  // State for data
  const [analyticsData, setAnalyticsData] = useState<{
    totalMembers: number;
    activeMembers: number;
    memberTypeDistribution: Array<{name: string; value: number; color: string}>;
    genderDistribution: Array<{name: string; value: number; color: string}>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch analytics data
  const fetchAnalyticsData = async (showLoading = true) => {
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
      if (memberType && memberType !== 'all') params.append('memberType', memberType);
      if (memberStatus && memberStatus !== 'all') params.append('memberStatus', memberStatus);
      if (gender && gender !== 'all') params.append('gender', gender);
      if (ageFrom && ageFrom !== 'all') params.append('ageFrom', ageFrom);
      if (ageTo && ageTo !== 'all') params.append('ageTo', ageTo);
      if (profession && profession !== 'all') params.append('profession', profession);
      if (faculty && faculty !== 'all') params.append('faculty', faculty);
      if (placeOfBirthProvince && placeOfBirthProvince !== 'all') params.append('placeOfBirthProvince', placeOfBirthProvince);
      if (placeOfBirthDistrict && placeOfBirthDistrict !== 'all') params.append('placeOfBirthDistrict', placeOfBirthDistrict);
      if (graduationYear && graduationYear !== 'all') params.append('graduationYear', graduationYear);

      const response = await fetch(`/api/members/analytics?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      
      const data = await response.json();
      setAnalyticsData(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  // Initialize data on client side
  useEffect(() => {
    setIsClient(true);
    fetchRegions();
    fetchAnalyticsData();
  }, []);

  // Refetch analytics when filters change (without loading state)
  useEffect(() => {
    if (isClient) {
      fetchAnalyticsData(false);
    }
  }, [selectedRegion, selectedUniversity, selectedSmallGroup, selectedAlumniGroup, dateFrom, dateTo, memberType, memberStatus, gender, ageFrom, ageTo, profession, faculty, placeOfBirthProvince, placeOfBirthDistrict, graduationYear]);

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

  // Check if user is super admin
  useEffect(() => {
    fetch("/api/members/current-user-scope")
      .then(res => res.json())
      .then(data => {
        if (data.scope) {
          setIsSuperAdmin(data.scope.scope === 'superadmin');
        }
      })
      .catch(err => {
        console.error("Failed to fetch user scope:", err);
      });
  }, []);

  // Close export options when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showExportOptions) {
        const target = event.target as Element;
        if (!target.closest('.export-options-dropdown')) {
          setShowExportOptions(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportOptions]);

  // Calculate key metrics from real data
  const keyMetrics = useMemo(() => {
    if (!analyticsData) {
      return {
        totalMembers: 0,
        newMembersThisMonth: 0,
        graduatedMembersThisMonth: 0,
        netGrowth: 0,
        memberIncrease: 0,
        memberDecrease: 0,
        netChange: 0,
        growthRate: 0,
        retentionRate: 0
      };
    }

    const { keyMetrics: metrics, monthlyGrowth } = analyticsData;
    const latest = monthlyGrowth[monthlyGrowth.length - 1];
    const previous = monthlyGrowth[monthlyGrowth.length - 2];
    
    return {
      totalMembers: metrics.totalMembers,
      newMembersThisMonth: metrics.newMembersThisMonth,
      graduatedMembersThisMonth: metrics.graduatedMembersThisMonth,
      netGrowth: metrics.netGrowth,
      memberIncrease: metrics.newMembersThisMonth,
      memberDecrease: metrics.graduatedMembersThisMonth,
      netChange: metrics.netGrowth,
      growthRate: previous ? ((latest?.totalMembers - previous.totalMembers) / previous.totalMembers * 100) : 0,
      retentionRate: metrics.retentionRate
    };
  }, [analyticsData]);

  const dateRangeOptions = [
    { value: '3months', label: 'Last 3 Months' },
    { value: '6months', label: 'Last 6 Months' },
    { value: '1year', label: 'Last Year' },
    { value: 'all', label: 'All Time' }
  ];

  const memberTypeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'student', label: 'Students' },
    { value: 'graduate', label: 'Graduates' },
    { value: 'alumni', label: 'Alumni' },
    { value: 'staff', label: 'Staff' },
    { value: 'volunteer', label: 'Volunteers' }
  ];

  const memberStatusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'pre_graduate', label: 'Pre-Graduate' },
    { value: 'graduate', label: 'Graduate' },
    { value: 'alumni', label: 'Alumni' },
    { value: 'inactive', label: 'Inactive' }
  ];

  const genderOptions = [
    { value: 'all', label: 'All Genders' },
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' }
  ];

  const ageOptions = Array.from({ length: 50 }, (_, i) => i + 18);
  const graduationYearOptions = Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - i);

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

  // Fetch member details for export
  const fetchMemberDetails = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedRegion && selectedRegion !== 'all') params.append('regionId', selectedRegion);
      if (selectedUniversity && selectedUniversity !== 'all') params.append('universityId', selectedUniversity);
      if (selectedSmallGroup && selectedSmallGroup !== 'all') params.append('smallGroupId', selectedSmallGroup);
      if (selectedAlumniGroup && selectedAlumniGroup !== 'all') params.append('alumniGroupId', selectedAlumniGroup);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      if (memberType && memberType !== 'all') params.append('memberType', memberType);
      if (memberStatus && memberStatus !== 'all') params.append('memberStatus', memberStatus);
      if (gender && gender !== 'all') params.append('gender', gender);
      if (ageFrom && ageFrom !== 'all') params.append('ageFrom', ageFrom);
      if (ageTo && ageTo !== 'all') params.append('ageTo', ageTo);
      if (profession) params.append('profession', profession);
      if (faculty) params.append('faculty', faculty);
      if (placeOfBirthProvince) params.append('placeOfBirthProvince', placeOfBirthProvince);
      if (placeOfBirthDistrict) params.append('placeOfBirthDistrict', placeOfBirthDistrict);
      if (graduationYear && graduationYear !== 'all') params.append('graduationYear', graduationYear);

      const response = await fetch(`/api/members/export-details?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch member details');
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching member details:', error);
      return null;
    }
  };

  // PDF Export Function
  const exportToPDF = async () => {
    if (!reportRef.current) return;
    
    setIsExporting(true);
    try {
      // Fetch member details if requested
      let memberDetails = null;
      if (includeMemberDetails) {
        memberDetails = await fetchMemberDetails();
      }

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Add header
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Ministry Management System', pageWidth / 2, 20, { align: 'center' });
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Membership Reports & Analytics', pageWidth / 2, 30, { align: 'center' });
      
      // Add report metadata
      pdf.setFontSize(10);
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 45);
      pdf.text(`Report Period: ${dateRangeOptions.find(opt => opt.value === dateRange)?.label || 'Custom'}`, 20, 50);
      if (selectedRegion && selectedRegion !== 'all') {
        const region = regions.find(r => r.id.toString() === selectedRegion);
        pdf.text(`Region: ${region?.name || selectedRegion}`, 20, 55);
      }
      
      // Add key metrics summary
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Executive Summary', 20, 70);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Total Members: ${keyMetrics.totalMembers.toLocaleString()}`, 20, 80);
      pdf.text(`New Members This Month: ${keyMetrics.newMembersThisMonth}`, 20, 85);
      pdf.text(`Graduated Members: ${keyMetrics.graduatedMembersThisMonth}`, 20, 90);
      pdf.text(`Net Growth: ${keyMetrics.netGrowth}`, 20, 95);
      pdf.text(`Member Increase: ${keyMetrics.memberIncrease}`, 20, 100);
      pdf.text(`Member Decrease: ${keyMetrics.memberDecrease}`, 20, 105);
      pdf.text(`Net Change: ${keyMetrics.netChange >= 0 ? '+' : ''}${keyMetrics.netChange}`, 20, 110);
      pdf.text(`Growth Rate: ${keyMetrics.growthRate > 0 ? '+' : ''}${keyMetrics.growthRate.toFixed(1)}%`, 20, 115);
      pdf.text(`Retention Rate: ${keyMetrics.retentionRate}%`, 20, 120);
      
      // Add member details if requested
      if (includeMemberDetails && memberDetails && memberDetails.members.length > 0) {
        let yPosition = 140;
        
        // Check if we need a new page
        if (yPosition > pageHeight - 50) {
          pdf.addPage();
          yPosition = 20;
        }
        
        // Add member details section
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Member Details', 20, yPosition);
        yPosition += 10;
        
        // Add filter summary
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const appliedFilters = memberDetails.appliedFilters;
        const activeFilters = Object.entries(appliedFilters)
          .filter(([key, value]) => value && value !== 'all' && value !== '')
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
        
        if (activeFilters) {
          pdf.text(`Applied Filters: ${activeFilters}`, 20, yPosition);
          yPosition += 8;
        }
        
        pdf.text(`Total Members Found: ${memberDetails.totalCount}`, 20, yPosition);
        yPosition += 15;
        
        // Add member table headers
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        const headers = ['Name', 'Email', 'Gender', 'Age', 'Type', 'Status', 'Region', 'University'];
        const colWidths = [30, 35, 15, 10, 20, 20, 25, 25];
        let xPosition = 20;
        
        // Draw table headers
        headers.forEach((header, index) => {
          pdf.text(header, xPosition, yPosition);
          xPosition += colWidths[index];
        });
        yPosition += 5;
        
        // Draw line under headers
        pdf.line(20, yPosition, 20 + colWidths.reduce((a, b) => a + b, 0), yPosition);
        yPosition += 3;
        
        // Add member data
        pdf.setFont('helvetica', 'normal');
        memberDetails.members.forEach((member: { firstName: string; lastName: string; email?: string; phone?: string; region?: string; university?: string; smallGroup?: string; alumniGroup?: string; type: string; status: string; gender?: string; age?: number; profession?: string; faculty?: string; createdAt: string }, _index: number) => {
          // Check if we need a new page
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = 20;
          }
          
          xPosition = 20;
          const memberData = [
            `${member.firstName} ${member.lastName}`,
            member.email || 'N/A',
            member.gender || 'N/A',
            member.age ? member.age.toString() : 'N/A',
            member.type || 'N/A',
            member.status || 'N/A',
            member.region || 'N/A',
            member.university || 'N/A'
          ];
          
          memberData.forEach((data, colIndex) => {
            // Truncate long text
            const truncatedData = data.length > 15 ? data.substring(0, 12) + '...' : data;
            pdf.text(truncatedData, xPosition, yPosition);
            xPosition += colWidths[colIndex];
          });
          
          yPosition += 5;
        });
      }
      
      // Save the PDF
      const fileName = `Membership_Report_${includeMemberDetails ? 'with_details_' : ''}${new Date().toISOString().split('T')[0]}.pdf`;
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading membership data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Error Loading Data</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
          <button 
            onClick={() => fetchAnalyticsData(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
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
                  <BreadcrumbPage>Membership Analytics</BreadcrumbPage>
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

      {/* Filter Toggle Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white dark:text-white">Membership Analytics</h2>
          <p className="text-gray-600 dark:text-gray-400">Comprehensive membership reports and insights</p>
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
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="includeDetails"
                      checked={includeMemberDetails}
                      onChange={(e) => setIncludeMemberDetails(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label htmlFor="includeDetails" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Include Member Details
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Export detailed member information matching your current filters
                  </p>
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

      {/* Professional Filters Section */}
      {showFilters && (
        <div className="space-y-6">
        {/* Time & Date Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Time & Date Range
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
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
              <div>
                <Label htmlFor="dateFrom">From Date</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="dateTo">To Date</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

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
              <div>
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

              <div>
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

              <div>
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

              <div>
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

        {/* Member Demographics Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Member Demographics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="memberType">Member Type</Label>
                <Select value={memberType} onValueChange={setMemberType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select member type" />
                  </SelectTrigger>
                  <SelectContent>
                    {memberTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="memberStatus">Status</Label>
                <Select value={memberStatus} onValueChange={setMemberStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {memberStatusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {genderOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="graduationYear">Graduation Year</Label>
                <Select value={graduationYear} onValueChange={setGraduationYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select graduation year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {graduationYearOptions.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Age Range & Professional Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
              </svg>
              Age Range & Professional Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="ageFrom">Age From</Label>
                <Select value={ageFrom} onValueChange={setAgeFrom}>
                  <SelectTrigger>
                    <SelectValue placeholder="Min age" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any age</SelectItem>
                    {ageOptions.map((age) => (
                      <SelectItem key={age} value={age.toString()}>
                        {age} years
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="ageTo">Age To</Label>
                <Select value={ageTo} onValueChange={setAgeTo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Max age" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any age</SelectItem>
                    {ageOptions.map((age) => (
                      <SelectItem key={age} value={age.toString()}>
                        {age} years
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="profession">Profession</Label>
                <Input
                  type="text"
                  placeholder="Enter profession"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="faculty">Faculty</Label>
                <Input
                  type="text"
                  placeholder="Enter faculty"
                  value={faculty}
                  onChange={(e) => setFaculty(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Place of Birth */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Place of Birth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="placeOfBirthProvince">Province</Label>
                <Input
                  type="text"
                  placeholder="Enter province"
                  value={placeOfBirthProvince}
                  onChange={(e) => setPlaceOfBirthProvince(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="placeOfBirthDistrict">District</Label>
                <Input
                  type="text"
                  placeholder="Enter district"
                  value={placeOfBirthDistrict}
                  onChange={(e) => setPlaceOfBirthDistrict(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filter Actions */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Use filters to generate specific reports for different audiences (CEO, President, Manager, etc.)
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
              setMemberType('all');
              setMemberStatus('all');
              setGender('all');
              setAgeFrom('all');
              setAgeTo('all');
              setProfession('');
              setFaculty('');
              setPlaceOfBirthProvince('');
              setPlaceOfBirthDistrict('');
              setGraduationYear('all');
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{keyMetrics.totalMembers.toLocaleString()}</p>
              <p className="text-sm text-blue-500 dark:text-blue-300">
                {keyMetrics.growthRate > 0 ? '+' : ''}{keyMetrics.growthRate.toFixed(1)}% from last period
              </p>
            </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <UsersIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-sm font-medium text-blue-700 dark:text-blue-200 mt-2">Total Members</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{keyMetrics.newMembersThisMonth}</p>
              <p className="text-sm text-green-500 dark:text-green-300">New registrations</p>
            </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <TrendingUpIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-sm font-medium text-green-700 dark:text-green-200 mt-2">New Members This Month</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{keyMetrics.graduatedMembersThisMonth}</p>
              <p className="text-sm text-purple-500 dark:text-purple-300">This month</p>
            </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                <GraduationCapIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-sm font-medium text-purple-700 dark:text-purple-200 mt-2">Graduated Members</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{keyMetrics.retentionRate}%</p>
              <p className="text-sm text-yellow-500 dark:text-yellow-300">Member retention</p>
            </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                <TrendingUpIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <p className="text-sm font-medium text-yellow-700 dark:text-yellow-200 mt-2">Retention Rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-2xl font-bold ${keyMetrics.netChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {keyMetrics.netChange >= 0 ? '+' : ''}{keyMetrics.netChange}
                </p>
                <p className="text-sm text-emerald-500 dark:text-emerald-300">
                  {keyMetrics.memberIncrease} new, {keyMetrics.memberDecrease} left
                </p>
              </div>
              <div className={`p-3 rounded-full ${keyMetrics.netChange >= 0 ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                {keyMetrics.netChange >= 0 ? (
                  <TrendingUpIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                ) : (
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <polyline points="23,18 13.5,8.5 8.5,13.5 1,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="17,18 23,18 23,12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </div>
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-200 mt-2">Net Change This Month</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 - Growth Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Membership Growth Trends</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">Monthly new members, graduations, and net growth</p>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData?.monthlyGrowth || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="newMembers" 
                    stackId="1" 
                    stroke="#10B981" 
                    fill="#10B981" 
                    fillOpacity={0.6}
                    name="New Members"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="graduatedMembers" 
                    stackId="2" 
                    stroke="#EF4444" 
                    fill="#EF4444" 
                    fillOpacity={0.6}
                    name="Graduated"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="netGrowth" 
                    stackId="3" 
                    stroke="#3B82F6" 
                    fill="#3B82F6" 
                    fillOpacity={0.6}
                    name="Net Growth"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Member Type Distribution</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">Breakdown of members by type and status</p>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData?.memberTypeDistribution || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: { name: string; percent?: number }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {(analyticsData?.memberTypeDistribution || []).map((entry: { name: string; value: number }, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 - Member Flow Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Member Increase/Decrease Trends</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">Monthly member additions and departures with net change</p>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData?.monthlyGrowth || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="newMembers" fill="#10B981" name="New Members" />
                  <Bar dataKey="graduatedMembers" fill="#EF4444" name="Graduated Members" />
                  <Bar dataKey="netGrowth" fill="#3B82F6" name="Net Growth" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cumulative Growth Trend</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total membership growth over time</p>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData?.monthlyGrowth || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="totalMembers" 
                    stroke="#8B5CF6" 
                    fill="#8B5CF6" 
                    fillOpacity={0.6}
                    name="Total Members"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 3 - Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Regional Distribution</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">Member count and growth by region</p>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData?.regionalDistribution || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="region" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="members" fill="#8B5CF6" name="Members" />
                  <Bar dataKey="growth" fill="#F59E0B" name="Growth %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gender Distribution</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">Male vs Female member breakdown</p>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData?.genderDistribution || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: { name: string; percent?: number }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {(analyticsData?.genderDistribution || []).map((entry: { name: string; value: number }, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
