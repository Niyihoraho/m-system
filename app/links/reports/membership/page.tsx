"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { MembershipAnalyticsTable } from '@/components/reports/membership-analytics-table';
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
    regionalDistribution?: Array<{region: string; members: number; growth: number; universities: number}>;
    monthlyGrowth?: Array<{month: string; totalMembers: number; newMembers: number; graduatedMembers: number; netGrowth: number}>;
    keyMetrics?: {
      totalMembers: number;
      newMembersThisMonth: number;
      graduatedMembersThisMonth: number;
      netGrowth: number;
      retentionRate: number;
    };
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
    const latest = monthlyGrowth?.[monthlyGrowth.length - 1];
    const previous = monthlyGrowth?.[monthlyGrowth.length - 2];
    
    return {
      totalMembers: metrics?.totalMembers || analyticsData.totalMembers || 0,
      newMembersThisMonth: metrics?.newMembersThisMonth || 0,
      graduatedMembersThisMonth: metrics?.graduatedMembersThisMonth || 0,
      netGrowth: metrics?.netGrowth || 0,
      memberIncrease: metrics?.newMembersThisMonth || 0,
      memberDecrease: metrics?.graduatedMembersThisMonth || 0,
      netChange: metrics?.netGrowth || 0,
      growthRate: previous && latest ? ((latest.totalMembers - previous.totalMembers) / previous.totalMembers * 100) : 0,
      retentionRate: metrics?.retentionRate || 0
    };
  }, [analyticsData]);

  // Process data for Power BI table
  const processedMembershipData = useMemo(() => {
    if (!analyticsData) return [];

    // Create regional data for the table
    const regionalData = analyticsData.regionalDistribution?.map(region => ({
      region: region.region,
      university: 'All Universities',
      smallGroup: 'All Small Groups',
      totalMembers: region.members,
      previousPeriodMembers: Math.max(0, region.members - region.growth), // Estimate previous period
      newMembers: Math.floor(region.members * 0.1), // Estimate new members (10% of total)
      previousPeriodNewMembers: Math.floor((region.members - region.growth) * 0.1),
      graduatedMembers: Math.floor(region.members * 0.05), // Estimate graduated (5% of total)
      previousPeriodGraduatedMembers: Math.floor((region.members - region.growth) * 0.05),
      retentionRate: 85 + (region.growth > 0 ? 5 : -5), // Estimate retention rate
      previousPeriodRetentionRate: 85 + (region.growth > 0 ? 2 : -2),
      growthRate: region.growth,
      previousPeriodGrowthRate: Math.max(0, region.growth - 2),
      memberTypeDistribution: {
        students: Math.floor(region.members * 0.65),
        graduates: Math.floor(region.members * 0.20),
        alumni: Math.floor(region.members * 0.10),
        staff: Math.floor(region.members * 0.03),
        volunteers: Math.floor(region.members * 0.02)
      }
    })) || [];

    return regionalData;
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
            <div className="space-y-6">
              {/* Header */}
              <div className="mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white dark:text-white">Membership Analytics</h2>
                  <p className="text-gray-600 dark:text-gray-400">Comprehensive membership reports and insights</p>
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
                    <span>Loading membership data...</span>
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
            <div className="space-y-6">
              {/* Header */}
              <div className="mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white dark:text-white">Membership Analytics</h2>
                  <p className="text-gray-600 dark:text-gray-400">Comprehensive membership reports and insights</p>
                </div>
              </div>

              {/* Error State */}
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-destructive">
                  <span className="text-sm font-medium">Error:</span>
                  <span className="text-sm">{error}</span>
                </div>
                <button 
                  onClick={() => fetchAnalyticsData(true)}
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

      <div className="mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white dark:text-white">Membership Analytics</h2>
          <p className="text-gray-600 dark:text-gray-400">Comprehensive membership reports and insights</p>
        </div>
      </div>


      {/* Power BI-Style Tables */}
      <MembershipAnalyticsTable 
        data={processedMembershipData}
        loading={loading}
        onExport={() => exportToPDF()}
        title="Membership Overview"
        description="Member counts and growth by region"
      />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
