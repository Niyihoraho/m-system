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
  AreaChart,
  LineChart,
  Line
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
const UsersIcon = (props: any) => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" {...props}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TrendingUpIcon = (props: any) => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" {...props}>
    <polyline points="23,6 13.5,15.5 8.5,10.5 1,18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="17,6 23,6 23,12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CalendarIcon = (props: any) => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
    <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2"/>
    <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2"/>
    <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const AwardIcon = (props: any) => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" {...props}>
    <circle cx="12" cy="8" r="6" stroke="currentColor" strokeWidth="2"/>
    <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function EngagementReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dateRange, setDateRange] = useState('6months');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedUniversity, setSelectedUniversity] = useState('all');
  const [selectedSmallGroup, setSelectedSmallGroup] = useState('all');
  const [selectedAlumniGroup, setSelectedAlumniGroup] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Engagement type selector - the main feature requested
  const [engagementType, setEngagementType] = useState('event');
  const [selectedEvent, setSelectedEvent] = useState('all');
  const [selectedDesignation, setSelectedDesignation] = useState('all');
  
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Cascading dropdown data
  const [regions, setRegions] = useState<any[]>([]);
  const [universities, setUniversities] = useState<any[]>([]);
  const [smallGroups, setSmallGroups] = useState<any[]>([]);
  const [alumniGroups, setAlumniGroups] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);

  // Authentication check
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push('/');
    }
  }, [status, router]);

  // Mock data generators for engagement reports
  const generateEngagementTrendsData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    return months.slice(0, currentMonth + 1).map((month, index) => {
      const eventAttendance = 120 + (index * 8) + (index % 3) * 15;
      const designationParticipation = 45 + (index * 3) + (index % 2) * 8;
      const totalEngagement = eventAttendance + designationParticipation;
      const engagementRate = 75 + (index % 4) * 5;
      
      return {
        month,
        eventAttendance,
        designationParticipation,
        totalEngagement,
        engagementRate,
        activeMembers: 850 + (index * 25) + (index % 3) * 10
      };
    });
  };

  const generateEngagementTypeData = () => [
    { name: 'Events', value: 65, color: '#3B82F6', count: 1250 },
    { name: 'Designations', value: 35, color: '#10B981', count: 675 }
  ];

  const generateRegionalEngagementData = () => [
    { region: 'North', totalEngagement: 450, eventEngagement: 320, designationEngagement: 130, engagementRate: 78 },
    { region: 'South', totalEngagement: 380, eventEngagement: 280, designationEngagement: 100, engagementRate: 72 },
    { region: 'East', totalEngagement: 520, eventEngagement: 380, designationEngagement: 140, engagementRate: 85 },
    { region: 'West', totalEngagement: 340, eventEngagement: 250, designationEngagement: 90, engagementRate: 68 },
    { region: 'Central', totalEngagement: 290, eventEngagement: 200, designationEngagement: 90, engagementRate: 65 }
  ];

  const generateEventEngagementData = () => [
    { name: 'High Engagement', value: 40, color: '#10B981', count: 320 },
    { name: 'Medium Engagement', value: 35, color: '#F59E0B', count: 280 },
    { name: 'Low Engagement', value: 25, color: '#EF4444', count: 200 }
  ];

  // State for data
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingDesignations, setLoadingDesignations] = useState(false);

  // Initialize data on client side
  useEffect(() => {
    setIsClient(true);
    fetchRegions();
    fetchEvents(); // Fetch all events initially
    fetchDesignations(); // Fetch all designations initially
    fetchEngagementAnalytics();
  }, []);

  // Fetch engagement analytics data
  const fetchEngagementAnalytics = async (showLoading = true) => {
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
      if (engagementType) params.append('engagementType', engagementType);
      if (selectedEvent && selectedEvent !== 'all') params.append('selectedEvent', selectedEvent);
      if (selectedDesignation && selectedDesignation !== 'all') params.append('selectedDesignation', selectedDesignation);

      const response = await fetch(`/api/engagement/analytics?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch engagement analytics data');
      }
      
      const data = await response.json();
      setAnalyticsData(data);
    } catch (err) {
      console.error('Error fetching engagement analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch engagement analytics data');
      // Fallback to mock data on error
      setAnalyticsData({
        engagementTrends: generateEngagementTrendsData(),
        engagementTypeDistribution: generateEngagementTypeData(),
        regionalEngagement: generateRegionalEngagementData(),
        eventEngagementLevels: generateEventEngagementData(),
        keyMetrics: {
          totalEngagement: 1980,
          averageEngagementRate: 73.6,
          eventParticipation: 1430,
          designationParticipation: 550,
          monthlyGrowth: 12.5
        }
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

  // Fetch events based on organizational filters
  const fetchEvents = async (regionId?: string, universityId?: string, smallGroupId?: string, alumniGroupId?: string) => {
    try {
      setLoadingEvents(true);
      const params = new URLSearchParams();
      if (regionId && regionId !== 'all') params.append('regionId', regionId);
      if (universityId && universityId !== 'all') params.append('universityId', universityId);
      if (smallGroupId && smallGroupId !== 'all') params.append('smallGroupId', smallGroupId);
      if (alumniGroupId && alumniGroupId !== 'all') params.append('alumniGroupId', alumniGroupId);

      const response = await fetch(`/api/events?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch events');
      const data = await response.json();
      setEvents(data.events || data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoadingEvents(false);
    }
  };

  // Fetch designations based on organizational filters
  const fetchDesignations = async (regionId?: string, universityId?: string, smallGroupId?: string, alumniGroupId?: string) => {
    try {
      setLoadingDesignations(true);
      const params = new URLSearchParams();
      if (regionId && regionId !== 'all') params.append('regionId', regionId);
      if (universityId && universityId !== 'all') params.append('universityId', universityId);
      if (smallGroupId && smallGroupId !== 'all') params.append('smallGroupId', smallGroupId);
      if (alumniGroupId && alumniGroupId !== 'all') params.append('alumniGroupId', alumniGroupId);

      const response = await fetch(`/api/designations?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch designations');
      const data = await response.json();
      setDesignations(data.designations || data || []);
    } catch (error) {
      console.error('Error fetching designations:', error);
    } finally {
      setLoadingDesignations(false);
    }
  };

  // Refetch analytics when filters change (without loading state)
  useEffect(() => {
    if (isClient) {
      fetchEngagementAnalytics(false);
    }
  }, [selectedRegion, selectedUniversity, selectedSmallGroup, selectedAlumniGroup, dateFrom, dateTo, engagementType, selectedEvent, selectedDesignation]);

  // Refetch events and designations when organizational filters change
  useEffect(() => {
    if (isClient && (selectedRegion || selectedUniversity || selectedSmallGroup || selectedAlumniGroup)) {
      fetchEvents(selectedRegion, selectedUniversity, selectedSmallGroup, selectedAlumniGroup);
      fetchDesignations(selectedRegion, selectedUniversity, selectedSmallGroup, selectedAlumniGroup);
    }
  }, [selectedRegion, selectedUniversity, selectedSmallGroup, selectedAlumniGroup]);

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

  // Calculate key metrics from data
  const keyMetrics = useMemo(() => {
    if (!analyticsData || !analyticsData.keyMetrics) {
      return {
        totalEngagement: 0,
        averageEngagementRate: 0,
        eventParticipation: 0,
        designationParticipation: 0,
        monthlyGrowth: 0
      };
    }

    return {
      totalEngagement: analyticsData.keyMetrics.totalEngagement || 0,
      averageEngagementRate: analyticsData.keyMetrics.averageEngagementRate || 0,
      eventParticipation: analyticsData.keyMetrics.eventParticipation || 0,
      designationParticipation: analyticsData.keyMetrics.designationParticipation || 0,
      monthlyGrowth: analyticsData.keyMetrics.monthlyGrowth || 0
    };
  }, [analyticsData]);

  // Fallback data for charts
  const chartData = useMemo(() => {
    if (!analyticsData) {
      return {
        engagementTrends: generateEngagementTrendsData(),
        engagementTypeDistribution: generateEngagementTypeData(),
        regionalEngagement: generateRegionalEngagementData(),
        eventEngagementLevels: generateEventEngagementData()
      };
    }

    return {
      engagementTrends: analyticsData.engagementTrends || generateEngagementTrendsData(),
      engagementTypeDistribution: analyticsData.engagementTypeDistribution || generateEngagementTypeData(),
      regionalEngagement: analyticsData.regionalEngagement || generateRegionalEngagementData(),
      eventEngagementLevels: analyticsData.eventEngagementLevels || generateEventEngagementData()
    };
  }, [analyticsData]);

  const dateRangeOptions = [
    { value: '3months', label: 'Last 3 Months' },
    { value: '6months', label: 'Last 6 Months' },
    { value: '1year', label: 'Last Year' },
    { value: 'all', label: 'All Time' }
  ];

  const engagementTypeOptions = [
    { value: 'event', label: 'Events' },
    { value: 'designation', label: 'Designations' }
  ];

  // Handler functions for cascading dropdowns
  const handleRegionChange = (value: string) => {
    setSelectedRegion(value);
    setSelectedUniversity('all');
    setSelectedSmallGroup('all');
    setSelectedAlumniGroup('all');
    setSelectedEvent('all');
    setSelectedDesignation('all');
    
    // Fetch events and designations for the selected region
    fetchEvents(value);
    fetchDesignations(value);
  };

  const handleUniversityChange = (value: string) => {
    setSelectedUniversity(value);
    setSelectedSmallGroup('all');
    setSelectedAlumniGroup('all');
    setSelectedEvent('all');
    setSelectedDesignation('all');
    
    // Fetch events and designations for the selected university
    fetchEvents(selectedRegion, value);
    fetchDesignations(selectedRegion, value);
  };

  const handleSmallGroupChange = (value: string) => {
    setSelectedSmallGroup(value);
    setSelectedAlumniGroup('all');
    setSelectedEvent('all');
    setSelectedDesignation('all');
    
    // Fetch events and designations for the selected small group
    fetchEvents(selectedRegion, selectedUniversity, value);
    fetchDesignations(selectedRegion, selectedUniversity, value);
  };

  const handleAlumniGroupChange = (value: string) => {
    setSelectedAlumniGroup(value);
    setSelectedEvent('all');
    setSelectedDesignation('all');
    
    // Fetch events and designations for the selected alumni group
    fetchEvents(selectedRegion, selectedUniversity, selectedSmallGroup, value);
    fetchDesignations(selectedRegion, selectedUniversity, selectedSmallGroup, value);
  };

  const handleEventChange = (value: string) => {
    setSelectedEvent(value);
  };

  const handleDesignationChange = (value: string) => {
    setSelectedDesignation(value);
  };

  // Fetch engagement details for export
  const fetchEngagementDetails = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedRegion && selectedRegion !== 'all') params.append('regionId', selectedRegion);
      if (selectedUniversity && selectedUniversity !== 'all') params.append('universityId', selectedUniversity);
      if (selectedSmallGroup && selectedSmallGroup !== 'all') params.append('smallGroupId', selectedSmallGroup);
      if (selectedAlumniGroup && selectedAlumniGroup !== 'all') params.append('alumniGroupId', selectedAlumniGroup);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      if (engagementType) params.append('engagementType', engagementType);
      if (selectedEvent && selectedEvent !== 'all') params.append('selectedEvent', selectedEvent);
      if (selectedDesignation && selectedDesignation !== 'all') params.append('selectedDesignation', selectedDesignation);

      const response = await fetch(`/api/engagement/export-details?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch engagement details');
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching engagement details:', error);
      return null;
    }
  };

  // PDF Export Function
  const exportToPDF = async () => {
    if (!reportRef.current) return;
    
    setIsExporting(true);
    try {
      // Fetch engagement details
      const engagementDetails = await fetchEngagementDetails();

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Add header
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Ministry Management System', pageWidth / 2, 20, { align: 'center' });
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Engagement Reports & Analytics', pageWidth / 2, 30, { align: 'center' });
      
      // Add report metadata
      pdf.setFontSize(10);
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 45);
      pdf.text(`Report Period: ${dateRangeOptions.find(opt => opt.value === dateRange)?.label || 'Custom'}`, 20, 50);
      pdf.text(`Engagement Type: ${engagementTypeOptions.find(opt => opt.value === engagementType)?.label}`, 20, 55);
      if (engagementType === 'event' && selectedEvent !== 'all') {
        const event = events.find(e => e.id.toString() === selectedEvent);
        pdf.text(`Selected Event: ${event?.name || selectedEvent}`, 20, 60);
      }
      if (engagementType === 'designation' && selectedDesignation !== 'all') {
        const designation = designations.find(d => d.id.toString() === selectedDesignation);
        pdf.text(`Selected Designation: ${designation?.name || selectedDesignation}`, 20, 60);
      }
      
      // Add key metrics summary
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Executive Summary', 20, 70);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Total Engagement: ${keyMetrics.totalEngagement.toLocaleString()}`, 20, 80);
      pdf.text(`Average Engagement Rate: ${keyMetrics.averageEngagementRate}%`, 20, 85);
      pdf.text(`Event Participation: ${keyMetrics.eventParticipation}`, 20, 90);
      pdf.text(`Designation Participation: ${keyMetrics.designationParticipation}`, 20, 95);
      pdf.text(`Monthly Growth: ${keyMetrics.monthlyGrowth}%`, 20, 100);
      
      // Add engagement details if available
      if (engagementDetails && engagementDetails.engagementDetails.length > 0) {
        let yPosition = 120;
        
        // Check if we need a new page
        if (yPosition > pageHeight - 50) {
          pdf.addPage();
          yPosition = 20;
        }
        
        // Add engagement details section
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Engagement Details', 20, yPosition);
        yPosition += 10;
        
        // Add filter summary
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const appliedFilters = engagementDetails.appliedFilters;
        const activeFilters = Object.entries(appliedFilters)
          .filter(([key, value]) => value && value !== 'all' && value !== '')
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
        
        if (activeFilters) {
          pdf.text(`Applied Filters: ${activeFilters}`, 20, yPosition);
          yPosition += 8;
        }
        
        pdf.text(`Total Engagement Records: ${engagementDetails.totalCount}`, 20, yPosition);
        yPosition += 15;
        
        // Add engagement table headers
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        const headers = ['Type', 'Member', 'Event/Designation', 'Status', 'Date', 'Region'];
        const colWidths = [15, 35, 40, 20, 25, 25];
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
        
        // Add engagement data
        pdf.setFont('helvetica', 'normal');
        engagementDetails.engagementDetails.slice(0, 50).forEach((detail: any, index: number) => {
          // Check if we need a new page
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = 20;
          }
          
          xPosition = 20;
          const detailData = [
            detail.type || 'N/A',
            detail.memberName || 'N/A',
            detail.eventName || detail.designationName || 'N/A',
            detail.attendanceStatus || detail.status || 'N/A',
            detail.recordedAt ? new Date(detail.recordedAt).toLocaleDateString() : 
              detail.createdAt ? new Date(detail.createdAt).toLocaleDateString() : 'N/A',
            detail.region || 'N/A'
          ];
          
          detailData.forEach((data, colIndex) => {
            // Truncate long text
            const truncatedData = data.length > 15 ? data.substring(0, 12) + '...' : data;
            pdf.text(truncatedData, xPosition, yPosition);
            xPosition += colWidths[colIndex];
          });
          
          yPosition += 5;
        });
      }
      
      // Save the PDF
      const fileName = `Engagement_Report_${engagementType}_${new Date().toISOString().split('T')[0]}.pdf`;
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
          <p className="text-gray-500 dark:text-gray-400">Loading engagement data...</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Fetching analytics and chart data...</p>
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
            onClick={() => fetchEngagementAnalytics(true)}
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
                  <BreadcrumbPage>Engagement Analytics</BreadcrumbPage>
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
                <h2 className="text-2xl font-bold text-white dark:text-white">Engagement Analytics</h2>
                <p className="text-gray-600 dark:text-gray-400">Comprehensive engagement reports and insights</p>
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

            {/* Professional Filters Section */}
            {showFilters && (
              <div className="space-y-6">
                {/* Engagement Type & Time Filters */}
            

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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Engagement Type & Time Range
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="engagementType">Engagement Type</Label>
                        <Select value={engagementType} onValueChange={setEngagementType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select engagement type" />
                          </SelectTrigger>
                          <SelectContent>
                            {engagementTypeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                       {/* Dynamic select field based on engagement type */}
                       {engagementType === 'event' && (
                         <div className="space-y-2">
                           <Label htmlFor="selectedEvent">Select Event</Label>
                           <Select 
                             value={selectedEvent} 
                             onValueChange={handleEventChange}
                             disabled={loadingEvents}
                           >
                             <SelectTrigger>
                               <SelectValue placeholder={
                                 loadingEvents 
                                   ? "Loading events..." 
                                   : selectedRegion && selectedRegion !== 'all' 
                                     ? "Select event" 
                                     : "Select organizational structure first"
                               } />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="all">All Events</SelectItem>
                               {loadingEvents ? (
                                 <SelectItem value="loading" disabled>
                                   Loading events...
                                 </SelectItem>
                               ) : events.length > 0 ? (
                                 events.map((event) => (
                                   <SelectItem key={event.id} value={event.id.toString()}>
                                     {event.name}
                                   </SelectItem>
                                 ))
                               ) : (
                                 <SelectItem value="no-events" disabled>
                                   No events found for selected organization
                                 </SelectItem>
                               )}
                             </SelectContent>
                           </Select>
                         </div>
                       )}
                       
                       {engagementType === 'designation' && (
                         <div className="space-y-2">
                           <Label htmlFor="selectedDesignation">Select Designation</Label>
                           <Select 
                             value={selectedDesignation} 
                             onValueChange={handleDesignationChange}
                             disabled={loadingDesignations}
                           >
                             <SelectTrigger>
                               <SelectValue placeholder={
                                 loadingDesignations 
                                   ? "Loading designations..." 
                                   : selectedRegion && selectedRegion !== 'all' 
                                     ? "Select designation" 
                                     : "Select organizational structure first"
                               } />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="all">All Designations</SelectItem>
                               {loadingDesignations ? (
                                 <SelectItem value="loading" disabled>
                                   Loading designations...
                                 </SelectItem>
                               ) : designations.length > 0 ? (
                                 designations.map((designation) => (
                                   <SelectItem key={designation.id} value={designation.id.toString()}>
                                     {designation.name}
                                   </SelectItem>
                                 ))
                               ) : (
                                 <SelectItem value="no-designations" disabled>
                                   No designations found for selected organization
                                 </SelectItem>
                               )}
                             </SelectContent>
                           </Select>
                         </div>
                       )}
                      
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
                  </CardContent>
                </Card>

                {/* Filter Actions */}
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Use filters to generate specific engagement reports for different audiences
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
                      setEngagementType('event');
                      setSelectedEvent('all');
                      setSelectedDesignation('all');
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
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${!engagementType ? 'lg:grid-cols-5' : 'lg:grid-cols-3'}`}>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{keyMetrics.totalEngagement.toLocaleString()}</p>
                      <p className="text-sm text-blue-500 dark:text-blue-300">
                        {keyMetrics.monthlyGrowth > 0 ? '+' : ''}{keyMetrics.monthlyGrowth}% from last period
                      </p>
                    </div>
                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                      <UsersIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-200 mt-2">Total Engagement</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">{keyMetrics.averageEngagementRate}%</p>
                      <p className="text-sm text-green-500 dark:text-green-300">Average rate</p>
                    </div>
                    <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                      <TrendingUpIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-200 mt-2">Engagement Rate</p>
                </CardContent>
              </Card>

              {/* Show Event Participation only if Events selected or no type selected */}
              {(!engagementType || engagementType === 'event') && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{keyMetrics.eventParticipation}</p>
                        <p className="text-sm text-purple-500 dark:text-purple-300">Event participation</p>
                      </div>
                      <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                        <CalendarIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                    <p className="text-sm font-medium text-purple-700 dark:text-purple-200 mt-2">Event Participation</p>
                  </CardContent>
                </Card>
              )}

              {/* Show Designation Participation only if Designations selected or no type selected */}
              {(!engagementType || engagementType === 'designation') && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{keyMetrics.designationParticipation}</p>
                        <p className="text-sm text-yellow-500 dark:text-yellow-300">Designation participation</p>
                      </div>
                      <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                        <AwardIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                      </div>
                    </div>
                    <p className="text-sm font-medium text-yellow-700 dark:text-yellow-200 mt-2">Designation Participation</p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{keyMetrics.monthlyGrowth}%</p>
                      <p className="text-sm text-indigo-500 dark:text-indigo-300">Monthly growth</p>
                    </div>
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-full">
                      <TrendingUpIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-indigo-700 dark:text-indigo-200 mt-2">Growth Rate</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 1 - Engagement Trends */}
            <div className={`grid grid-cols-1 gap-6 ${!engagementType ? 'lg:grid-cols-2' : 'lg:grid-cols-1'}`}>
              <Card>
                <CardHeader>
                  <CardTitle>
                    {engagementType === 'event' ? 'Event Attendance Trends' : 
                     engagementType === 'designation' ? 'Designation Participation Trends' : 
                     'Engagement Trends Over Time'}
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {engagementType === 'event' ? 'Monthly event attendance patterns' : 
                     engagementType === 'designation' ? 'Monthly designation participation patterns' : 
                     'Monthly engagement patterns for events and designations'}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData.engagementTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        {(!engagementType || engagementType === 'event') && (
                          <Area 
                            type="monotone" 
                            dataKey="eventAttendance" 
                            stackId="1" 
                            stroke="#3B82F6" 
                            fill="#3B82F6" 
                            fillOpacity={0.6}
                            name="Event Attendance"
                          />
                        )}
                        {(!engagementType || engagementType === 'designation') && (
                          <Area 
                            type="monotone" 
                            dataKey="designationParticipation" 
                            stackId="2" 
                            stroke="#10B981" 
                            fill="#10B981" 
                            fillOpacity={0.6}
                            name="Designation Participation"
                          />
                        )}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Show Engagement Type Distribution only if no specific type selected */}
              {!engagementType && (
                <Card>
                  <CardHeader>
                    <CardTitle>Engagement Type Distribution</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Breakdown of engagement by type</p>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData.engagementTypeDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {chartData.engagementTypeDistribution.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Charts Row 2 - Regional Analysis */}
            <div className={`grid grid-cols-1 gap-6 ${!engagementType ? 'lg:grid-cols-2' : 'lg:grid-cols-1'}`}>
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedRegion && selectedRegion !== 'all' ? 
                      (engagementType === 'event' ? 'University Event Attendance Comparison' : 
                       engagementType === 'designation' ? 'University Designation Participation Comparison' : 
                       'University Engagement Comparison') :
                    selectedUniversity && selectedUniversity !== 'all' ?
                      (engagementType === 'event' ? 'Small Group Event Attendance Comparison' : 
                       engagementType === 'designation' ? 'Small Group Designation Participation Comparison' : 
                       'Small Group Engagement Comparison') :
                    (engagementType === 'event' ? 'Regional Event Attendance' : 
                     engagementType === 'designation' ? 'Regional Designation Participation' : 
                     'Regional Engagement Analysis')}
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedRegion && selectedRegion !== 'all' ? 
                      (engagementType === 'event' ? 'Event attendance levels across universities in the selected region' : 
                       engagementType === 'designation' ? 'Designation participation levels across universities in the selected region' : 
                       'Engagement levels across universities in the selected region') :
                    selectedUniversity && selectedUniversity !== 'all' ?
                      (engagementType === 'event' ? 'Event attendance levels across small groups in the selected university' : 
                       engagementType === 'designation' ? 'Designation participation levels across small groups in the selected university' : 
                       'Engagement levels across small groups in the selected university') :
                    (engagementType === 'event' ? 'Event attendance levels across different regions' : 
                     engagementType === 'designation' ? 'Designation participation levels across different regions' : 
                     'Engagement levels across different regions')}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.regionalEngagement}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="region" 
                          tick={{ fontSize: 12 }}
                          angle={selectedRegion && selectedRegion !== 'all' || selectedUniversity && selectedUniversity !== 'all' ? -45 : 0}
                          textAnchor={selectedRegion && selectedRegion !== 'all' || selectedUniversity && selectedUniversity !== 'all' ? 'end' : 'middle'}
                          height={selectedRegion && selectedRegion !== 'all' || selectedUniversity && selectedUniversity !== 'all' ? 80 : 60}
                        />
                        <YAxis />
                        <Tooltip />
                        {(!engagementType || engagementType === 'event') && (
                          <Bar dataKey="eventEngagement" fill="#3B82F6" name="Event Engagement" />
                        )}
                        {(!engagementType || engagementType === 'designation') && (
                          <Bar dataKey="designationEngagement" fill="#10B981" name="Designation Engagement" />
                        )}
                        {!engagementType && (
                          <Bar dataKey="totalEngagement" fill="#8B5CF6" name="Total Engagement" />
                        )}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Show Engagement Rate Trends only if no specific type selected */}
              {!engagementType && (
                <Card>
                  <CardHeader>
                    <CardTitle>Engagement Rate Trends</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Monthly engagement rate progression</p>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData.engagementTrends}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Line 
                            type="monotone" 
                            dataKey="engagementRate" 
                            stroke="#F59E0B" 
                            strokeWidth={3}
                            name="Engagement Rate %"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Charts Row 3 - Engagement Levels */}
            <div className={`grid grid-cols-1 gap-6 ${!engagementType ? 'lg:grid-cols-2' : 'lg:grid-cols-1'}`}>
              <Card>
                <CardHeader>
                  <CardTitle>
                    {engagementType === 'event' ? 'Event Engagement Levels' : 
                     engagementType === 'designation' ? 'Designation Engagement Levels' : 
                     'Engagement Levels'}
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {engagementType === 'event' ? 'Distribution of event engagement intensity levels' : 
                     engagementType === 'designation' ? 'Distribution of designation engagement intensity levels' : 
                     'Distribution of engagement intensity levels'}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData.eventEngagementLevels}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {chartData.eventEngagementLevels.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Show Regional Engagement Rates only if no specific type selected */}
              {!engagementType && (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {selectedRegion && selectedRegion !== 'all' ? 'University Engagement Rates' : 
                       selectedUniversity && selectedUniversity !== 'all' ? 'Small Group Engagement Rates' : 
                       'Regional Engagement Rates'}
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedRegion && selectedRegion !== 'all' ? 'Engagement rates by university in the selected region' : 
                       selectedUniversity && selectedUniversity !== 'all' ? 'Engagement rates by small group in the selected university' : 
                       'Engagement rates by region'}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData.regionalEngagement}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="region" 
                            tick={{ fontSize: 12 }}
                            angle={selectedRegion && selectedRegion !== 'all' || selectedUniversity && selectedUniversity !== 'all' ? -45 : 0}
                            textAnchor={selectedRegion && selectedRegion !== 'all' || selectedUniversity && selectedUniversity !== 'all' ? 'end' : 'middle'}
                            height={selectedRegion && selectedRegion !== 'all' || selectedUniversity && selectedUniversity !== 'all' ? 80 : 60}
                          />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="engagementRate" fill="#EC4899" name="Engagement Rate %" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}