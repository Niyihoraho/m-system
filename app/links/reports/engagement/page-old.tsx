"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useUserScope } from '@/hooks/use-user-scope';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { EngagementAnalyticsTable } from '@/components/reports/engagement-analytics-table';
import { RegionalLevelTable } from '@/components/reports/regional-level-table';
import { UniversityLevelTable } from '@/components/reports/university-level-table';
import { SmallGroupLevelTable } from '@/components/reports/small-group-level-table';
import { MemberLevelTable } from '@/components/reports/member-level-table-enhanced';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { SuperAdminScopeSelector } from '@/components/super-admin-scope-selector';
import { AppSidebar } from '@/components/app-sidebar';
import { LogoutButton } from '@/components/logout-button';
import { AllowOnly } from '@/components/role-based-access';
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

const CalendarIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
    <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2"/>
    <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2"/>
    <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const AwardIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" {...props}>
    <circle cx="12" cy="8" r="6" stroke="currentColor" strokeWidth="2"/>
    <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function EngagementReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { userScope, loading: scopeLoading } = useUserScope();
  
  // Role-based access - no hierarchical navigation needed
  const [selectedEvent, setSelectedEvent] = useState('all');
  
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Event data for the only remaining filter
  const [events, setEvents] = useState<Array<{id: number; name: string; type: string}>>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  
  // Date filter data
  const [availableDates, setAvailableDates] = useState<Array<Date>>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [loadingDates, setLoadingDates] = useState(true);
  
  // Member data for member level
  const [memberData, setMemberData] = useState<Array<any>>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  
  // Real data from APIs
  const [regionsData, setRegionsData] = useState<Array<any>>([]);
  const [universitiesData, setUniversitiesData] = useState<Array<any>>([]);
  const [smallGroupsData, setSmallGroupsData] = useState<Array<any>>([]);
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [loadingUniversities, setLoadingUniversities] = useState(false);
  const [loadingSmallGroups, setLoadingSmallGroups] = useState(false);

  // Authentication check
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push('/');
    }
  }, [status, router]);

  // Initialize user level based on scope
  useEffect(() => {
    if (userScope && !scopeLoading) {
      switch (userScope.scope) {
        case 'superadmin':
        case 'national':
          setCurrentLevel('national');
          break;
        case 'region':
          setCurrentLevel('region');
          setNavigationStack([{ level: 'region', id: userScope.regionId!, name: userScope.region?.name || 'Region' }]);
          break;
        case 'university':
          setCurrentLevel('university');
          setNavigationStack([
            { level: 'region', id: userScope.regionId!, name: userScope.region?.name || 'Region' },
            { level: 'university', id: userScope.universityId!, name: userScope.university?.name || 'University' }
          ]);
          break;
        case 'smallgroup':
          setCurrentLevel('member');
          setNavigationStack([
            { level: 'region', id: userScope.regionId!, name: userScope.region?.name || 'Region' },
            { level: 'university', id: userScope.universityId!, name: userScope.university?.name || 'University' },
            { level: 'member', id: userScope.smallGroupId!, name: userScope.smallGroup?.name || 'Small Group' }
          ]);
          // Fetch member data for the small group
          if (userScope.smallGroupId) {
            fetchMemberData(userScope.smallGroupId);
          }
          break;
      }
    }
  }, [userScope, scopeLoading]);

  // Hierarchical navigation functions
  const handleRowClick = (rowData: any) => {
    if (currentLevel === 'national' && rowData.region && rowData.regionId) {
      // Navigate to region level
      setCurrentLevel('region');
      setNavigationStack([{ level: 'region', id: rowData.regionId, name: rowData.region }]);
      fetchUniversitiesData(rowData.regionId);
    } else if (currentLevel === 'region' && rowData.university && rowData.universityId) {
      // Navigate to university level
      setCurrentLevel('university');
      setNavigationStack(prev => [...prev, { level: 'university', id: rowData.universityId, name: rowData.university }]);
      fetchSmallGroupsData(rowData.universityId);
    } else if (currentLevel === 'university' && rowData.smallGroup && rowData.smallGroupId) {
      // Navigate directly to member level (skip small group level)
      setCurrentLevel('member');
      setNavigationStack(prev => [...prev, { level: 'member', id: rowData.smallGroupId, name: rowData.smallGroup }]);
      fetchMemberData(rowData.smallGroupId);
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    const newStack = navigationStack.slice(0, index + 1);
    setNavigationStack(newStack);
    
    if (newStack.length === 0) {
      setCurrentLevel('national');
    } else if (newStack.length === 1) {
      setCurrentLevel('region');
    } else if (newStack.length === 2) {
      setCurrentLevel('university');
    } else if (newStack.length === 3) {
      setCurrentLevel('member');
    }
  };

  // Handle previous button click
  const handlePreviousClick = () => {
    if (navigationStack.length === 0) {
      // Already at national level, can't go back
      return;
    }
    
    const newStack = navigationStack.slice(0, -1);
    setNavigationStack(newStack);
    
    if (newStack.length === 0) {
      setCurrentLevel('national');
    } else if (newStack.length === 1) {
      setCurrentLevel('region');
    } else if (newStack.length === 2) {
      setCurrentLevel('university');
    }
  };

  // Fetch member data for member level with real statistics
  const fetchMemberData = async (smallGroupId: number) => {
    try {
      setLoadingMembers(true);
      const params = new URLSearchParams();
      params.append('smallGroupId', smallGroupId.toString());
      if (selectedEvent && selectedEvent !== 'all') params.append('selectedEvent', selectedEvent);
      if (selectedDate) params.append('selectedDate', selectedDate);

      console.log('Fetching member statistics for small group:', smallGroupId);
      console.log('Request params:', params.toString());

      const response = await fetch(`/api/engagement/members?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error Response:', errorData);
        throw new Error(`Failed to fetch member statistics: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Member statistics received:', data);
      setMemberData(data);
    } catch (error) {
      console.error('Error fetching member statistics:', error);
      setMemberData([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Fetch real data from APIs
  const fetchRegionsData = async () => {
    try {
      setLoadingRegions(true);

      // Build query parameters with filters
      const params = new URLSearchParams();
      if (selectedEvent && selectedEvent !== 'all') {
        params.append('selectedEvent', selectedEvent);
      }
      if (selectedDate) {
        params.append('selectedDate', selectedDate);
      }

      console.log('🔍 Fetching regions data with filters:', params.toString());
      const response = await fetch(`/api/engagement/regions?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Regions data received:', data);
        setRegionsData(data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch regions data:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        setRegionsData([]);
      }
    } catch (error) {
      console.error('Error fetching regions data:', error);
      setRegionsData([]);
    } finally {
      setLoadingRegions(false);
    }
  };

  const fetchUniversitiesData = async (regionId: number) => {
    try {
      setLoadingUniversities(true);
      
      // Build query parameters with filters
      const params = new URLSearchParams();
      params.append('regionId', regionId.toString());
      if (selectedEvent && selectedEvent !== 'all') {
        params.append('selectedEvent', selectedEvent);
      }
      if (selectedDate) {
        params.append('selectedDate', selectedDate);
      }

      console.log('🔍 Fetching universities data with filters:', params.toString());
      const response = await fetch(`/api/engagement/universities?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Universities data received:', data);
        setUniversitiesData(data);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to fetch universities data:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        setUniversitiesData([]);
      }
    } catch (error) {
      console.error('Error fetching universities data:', error);
      setUniversitiesData([]);
    } finally {
      setLoadingUniversities(false);
    }
  };

  const fetchSmallGroupsData = async (universityId: number) => {
    try {
      setLoadingSmallGroups(true);
      
      // Build query parameters with filters
      const params = new URLSearchParams();
      params.append('universityId', universityId.toString());
      if (selectedEvent && selectedEvent !== 'all') {
        params.append('selectedEvent', selectedEvent);
      }
      if (selectedDate) {
        params.append('selectedDate', selectedDate);
      }

      console.log('🔍 Fetching small groups data with filters:', params.toString());
      const response = await fetch(`/api/engagement/small-groups?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setSmallGroupsData(data);
      } else {
        console.error('Failed to fetch small groups data');
        setSmallGroupsData([]);
      }
    } catch (error) {
      console.error('Error fetching small groups data:', error);
      setSmallGroupsData([]);
    } finally {
      setLoadingSmallGroups(false);
    }
  };

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
  const [analyticsData, setAnalyticsData] = useState<{
    totalEvents: number;
    totalAttendance: number;
    averageAttendance: number;
    engagementTypeDistribution: Array<{name: string; value: number; color: string}>;
    eventEngagementLevels: Array<{name: string; value: number; color: string}>;
    engagementTrends?: Array<any>;
    regionalEngagement?: Array<any>;
    keyMetrics?: {
      totalEngagement: number;
      averageEngagementRate: number;
      eventParticipation: number;
      designationParticipation: number;
      monthlyGrowth: number;
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize data on client side
  useEffect(() => {
    setIsClient(true);
    fetchEngagementAnalytics();
  }, []);

  // Fetch engagement analytics data
  const fetchEngagementAnalytics = async (showLoading = true) => {
    console.log('🚀 fetchEngagementAnalytics called with:', { selectedEvent, selectedDate, currentLevel });
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      
      const params = new URLSearchParams();
      if (selectedEvent && selectedEvent !== 'all') params.append('selectedEvent', selectedEvent);
      if (selectedDate) params.append('selectedDate', selectedDate);
      
      // Debug: Log the filter values
      console.log('🔍 Filter Debug:', {
        selectedEvent,
        selectedDate,
        currentLevel,
        params: params.toString()
      });
      
      // Add hierarchy level parameters
      params.append('currentLevel', currentLevel);
      if (navigationStack.length > 0) {
        navigationStack.forEach((item, index) => {
          if (item && item.id !== undefined && item.id !== null) {
            params.append(`level${index}Id`, item.id.toString());
          }
        });
      }

      // Use student-friendly API for member level
      const apiEndpoint = currentLevel === 'member' 
        ? `/api/engagement/student-friendly?${params.toString()}`
        : `/api/engagement/analytics?${params.toString()}`;

      const response = await fetch(apiEndpoint);
      if (!response.ok) {
        throw new Error('Failed to fetch engagement analytics data');
      }
      
      const data = await response.json();
      
      // Debug: Log the received data
      console.log('🔍 Frontend Received Data:', {
        selectedEvent,
        selectedDate,
        currentLevel,
        dataKeys: Object.keys(data),
        keyMetrics: data.keyMetrics,
        totalEvents: data.eventEngagementLevels?.reduce((sum: number, level: any) => sum + (level.count || 0), 0) || 0
      });
      
      if (currentLevel === 'member') {
        // Transform student-friendly data for member level
        setMemberData(data.members || []);
        setAnalyticsData({
          totalEvents: data.summary?.totalActiveEvents || 0,
          totalAttendance: data.summary?.totalMembers || 0,
          averageAttendance: data.summary?.averageAttendanceRate || 0,
          keyMetrics: {
            totalEngagement: data.summary?.totalMembers || 0,
            averageEngagementRate: data.summary?.averageAttendanceRate || 0,
            eventParticipation: data.summary?.totalActiveEvents || 0,
            designationParticipation: data.summary?.totalInactiveEvents || 0,
            monthlyGrowth: 0
          },
          engagementTrends: [],
          engagementTypeDistribution: [
            { name: 'Active Events', value: data.summary?.totalActiveEvents || 0, color: '#10B981' },
            { name: 'Ended Events', value: data.summary?.totalInactiveEvents || 0, color: '#EF4444' }
          ],
          regionalEngagement: [],
          eventEngagementLevels: []
        });
      } else {
        console.log('🔍 Setting Analytics Data:', {
          selectedEvent,
          selectedDate,
          keyMetrics: data.keyMetrics,
          totalEvents: data.eventEngagementLevels?.reduce((sum: number, level: any) => sum + (level.count || 0), 0) || 0
        });
        setAnalyticsData(data);
      }
    } catch (err) {
      console.error('Error fetching engagement analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch engagement analytics data');
      // Fallback to mock data on error
      setAnalyticsData({
        totalEvents: 25,
        totalAttendance: 1980,
        averageAttendance: 79.2,
        engagementTypeDistribution: generateEngagementTypeData(),
        eventEngagementLevels: generateEventEngagementData(),
        engagementTrends: generateEngagementTrendsData(),
        regionalEngagement: generateRegionalEngagementData(),
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



  // Refetch analytics when filters change (without loading state)
  useEffect(() => {
    if (isClient) {
      fetchEngagementAnalytics(false);
    }
  }, [selectedEvent, selectedDate, currentLevel, navigationStack]);

  // Load events data
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoadingEvents(true);
        const eventsResponse = await fetch('/api/events');
        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json();
          // The API returns events directly as an array, not wrapped in an object
          const eventsArray = Array.isArray(eventsData) ? eventsData : [];
          console.log('Loaded events from database:', eventsArray);
          setEvents(eventsArray);
    } else {
          console.error('Failed to fetch events:', eventsResponse.status);
          setEvents([]);
        }
    } catch (error) {
        console.error('Error loading events:', error);
        setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

    loadEvents();
  }, []);

  // Load available dates from attendance table
  useEffect(() => {
    const loadAvailableDates = async () => {
      try {
        setLoadingDates(true);
        const datesResponse = await fetch('/api/attendance/dates');
        if (datesResponse.ok) {
          const datesData = await datesResponse.json();
          const dates = datesData.dates.map((dateStr: string) => new Date(dateStr));
          setAvailableDates(dates);
          
          // Set default to latest date
          if (datesData.latestDate) {
            const latestDateStr = new Date(datesData.latestDate).toISOString().split('T')[0];
            setSelectedDate(latestDateStr);
          }
          
          console.log('Loaded available dates:', dates);
          console.log('Latest date set as default:', datesData.latestDate);
        } else {
          console.error('Failed to fetch dates:', datesResponse.status);
          // Set fallback dates if API fails
          const today = new Date();
          const fallbackDates = [today];
          setAvailableDates(fallbackDates);
          setSelectedDate(today.toISOString().split('T')[0]);
        }
    } catch (error) {
        console.error('Error loading dates:', error);
        // Set fallback dates if API fails
        const today = new Date();
        const fallbackDates = [today];
        setAvailableDates(fallbackDates);
        setSelectedDate(today.toISOString().split('T')[0]);
    } finally {
        setLoadingDates(false);
      }
    };

    loadAvailableDates();
  }, []);

  // Load regions data when component mounts or filters change
  useEffect(() => {
    if (isClient && currentLevel === 'national') {
      fetchRegionsData();
    }
  }, [isClient, currentLevel, selectedEvent, selectedDate]);

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

  // Helper functions to generate data for different levels
  const generateUniversityData = (regionId: number) => {
    const universities = [
      { id: 1, name: 'University of Rwanda', regionId: regionId },
      { id: 2, name: 'Kigali Institute of Science and Technology', regionId: regionId },
      { id: 3, name: 'Catholic University of Rwanda', regionId: regionId }
    ];

    return universities.map(uni => ({
      region: navigationStack[0]?.name || 'Region',
      regionId: regionId,
      university: uni.name,
      universityId: uni.id,
      smallGroup: 'All Small Groups',
      smallGroupId: 0, // Not applicable for university level
      totalEngagement: 80 + Math.floor(Math.random() * 40),
      previousPeriodEngagement: 60 + Math.floor(Math.random() * 30),
      eventAttendance: 50 + Math.floor(Math.random() * 25),
      previousPeriodEventAttendance: 35 + Math.floor(Math.random() * 20),
      designationParticipation: 30 + Math.floor(Math.random() * 15),
      previousPeriodDesignationParticipation: 25 + Math.floor(Math.random() * 10),
      engagementRate: 70 + Math.floor(Math.random() * 20),
      previousPeriodEngagementRate: 65 + Math.floor(Math.random() * 15),
      averageAttendancePerEvent: Math.floor((50 + Math.floor(Math.random() * 25)) / 8),
      previousPeriodAverageAttendancePerEvent: Math.floor((35 + Math.floor(Math.random() * 20)) / 6),
      totalEvents: 8,
      previousPeriodTotalEvents: 6,
      totalDesignations: 3,
      previousPeriodTotalDesignations: 2
    }));
  };

  const generateSmallGroupData = (universityId: number) => {
    const smallGroups = [
      { id: 1, name: 'Alpha Group', universityId: universityId },
      { id: 2, name: 'Beta Group', universityId: universityId },
      { id: 3, name: 'Gamma Group', universityId: universityId },
      { id: 4, name: 'Delta Group', universityId: universityId }
    ];

    return smallGroups.map(group => ({
      region: navigationStack[0]?.name || 'Region',
      regionId: navigationStack[0]?.id || 0,
      university: navigationStack[1]?.name || 'University',
      universityId: universityId,
      smallGroup: group.name,
      smallGroupId: group.id,
      totalEngagement: 25 + Math.floor(Math.random() * 15),
      previousPeriodEngagement: 20 + Math.floor(Math.random() * 10),
      eventAttendance: 15 + Math.floor(Math.random() * 10),
      previousPeriodEventAttendance: 12 + Math.floor(Math.random() * 8),
      designationParticipation: 8 + Math.floor(Math.random() * 5),
      previousPeriodDesignationParticipation: 6 + Math.floor(Math.random() * 4),
      engagementRate: 85 + Math.floor(Math.random() * 10),
      previousPeriodEngagementRate: 80 + Math.floor(Math.random() * 8),
      averageAttendancePerEvent: Math.floor((15 + Math.floor(Math.random() * 10)) / 4),
      previousPeriodAverageAttendancePerEvent: Math.floor((12 + Math.floor(Math.random() * 8)) / 3),
      totalEvents: 4,
      previousPeriodTotalEvents: 3,
      totalDesignations: 2,
      previousPeriodTotalDesignations: 1
    }));
  };

  const generateDetailedGroupData = (smallGroupId: number) => {
    return [{
      region: navigationStack[0]?.name || 'Region',
      regionId: navigationStack[0]?.id || 0,
      university: navigationStack[1]?.name || 'University',
      universityId: navigationStack[1]?.id || 0,
      smallGroup: navigationStack[2]?.name || 'Small Group',
      smallGroupId: smallGroupId,
      totalEngagement: 25 + Math.floor(Math.random() * 15),
      previousPeriodEngagement: 20 + Math.floor(Math.random() * 10),
      eventAttendance: 15 + Math.floor(Math.random() * 10),
      previousPeriodEventAttendance: 12 + Math.floor(Math.random() * 8),
      designationParticipation: 8 + Math.floor(Math.random() * 5),
      previousPeriodDesignationParticipation: 6 + Math.floor(Math.random() * 4),
      engagementRate: 85 + Math.floor(Math.random() * 10),
      previousPeriodEngagementRate: 80 + Math.floor(Math.random() * 8),
      averageAttendancePerEvent: Math.floor((15 + Math.floor(Math.random() * 10)) / 4),
      previousPeriodAverageAttendancePerEvent: Math.floor((12 + Math.floor(Math.random() * 8)) / 3),
      totalEvents: 4,
      previousPeriodTotalEvents: 3,
      totalDesignations: 2,
      previousPeriodTotalDesignations: 1
    }];
  };

  // Process data for Power BI table based on current hierarchy level
  const processedEngagementData = useMemo(() => {
    switch (currentLevel) {
      case 'national':
        // Show regional data
        return regionsData;

      case 'region':
        // Show university data for selected region
        return universitiesData;

      case 'university':
        // Show small group data for selected university
        return smallGroupsData;

      default:
        return [];
    }
  }, [currentLevel, regionsData, universitiesData, smallGroupsData]);

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



  // Fetch engagement details for export
  const fetchEngagementDetails = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedEvent && selectedEvent !== 'all') params.append('selectedEvent', selectedEvent);
      if (selectedDate) params.append('selectedDate', selectedDate);
      
      // Add hierarchy level parameters
      params.append('currentLevel', currentLevel);
      if (navigationStack.length > 0) {
        navigationStack.forEach((item, index) => {
          if (item && item.id !== undefined && item.id !== null) {
            params.append(`level${index}Id`, item.id.toString());
          }
        });
      }

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
      pdf.text(`Current Level: ${currentLevel.charAt(0).toUpperCase() + currentLevel.slice(1)}`, 20, 50);
      if (selectedEvent !== 'all') {
        const event = events.find(e => e.id.toString() === selectedEvent);
        pdf.text(`Selected Event: ${event?.name || selectedEvent}`, 20, 55);
      }
      if (selectedDate) {
        const dateObj = new Date(selectedDate);
        pdf.text(`Selected Date: ${dateObj.toLocaleDateString()}`, 20, selectedEvent !== 'all' ? 60 : 55);
      }
      if (navigationStack.length > 0) {
        const yPos = selectedDate ? (selectedEvent !== 'all' ? 65 : 60) : (selectedEvent !== 'all' ? 60 : 55);
        pdf.text(`Navigation Path: ${navigationStack.map(item => item.name).join(' > ')}`, 20, yPos);
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
        engagementDetails.engagementDetails.slice(0, 50).forEach((detail: any, _index: number) => {
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
      const fileName = `Engagement_Report_${currentLevel}_${new Date().toISOString().split('T')[0]}.pdf`;
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
            <div className="space-y-6">
              {/* Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white dark:text-white">Engagement Analytics</h2>
                  <p className="text-gray-600 dark:text-gray-400">Comprehensive engagement reports and insights</p>
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
                    <span>Loading engagement data...</span>
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
            <div className="space-y-6">
              {/* Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white dark:text-white">Engagement Analytics</h2>
                  <p className="text-gray-600 dark:text-gray-400">Comprehensive engagement reports and insights</p>
                </div>
              </div>

              {/* Error State */}
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-destructive">
                  <span className="text-sm font-medium">Error:</span>
                  <span className="text-sm">{error}</span>
                </div>
                <button 
                  onClick={() => fetchEngagementAnalytics(true)}
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

            {/* Navigation Controls */}
            {navigationStack.length > 0 && (
              <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                    onClick={handlePreviousClick}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Previous
                </Button>
                  <div className="text-sm text-muted-foreground">
                    {currentLevel === 'region' && `Viewing: ${navigationStack[0]?.name}`}
                    {currentLevel === 'university' && `Viewing: ${navigationStack[1]?.name} in ${navigationStack[0]?.name}`}
                    {currentLevel === 'member' && `Viewing: Members in ${navigationStack[2]?.name}`}
                      </div>
                    </div>
                         </div>
                       )}
                       

            {/* Hierarchical Level-Specific Tables */}
            {currentLevel === 'national' && (
              <RegionalLevelTable 
                data={processedEngagementData}
                loading={loadingRegions}
                onExport={() => exportToPDF()}
                onRowClick={handleRowClick}
                selectedEvent={selectedEvent}
                onEventChange={setSelectedEvent}
                events={events}
                loadingEvents={loadingEvents}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                availableDates={availableDates}
                loadingDates={loadingDates}
              />
            )}

            {currentLevel === 'region' && (
              <UniversityLevelTable 
                data={processedEngagementData}
                loading={loadingUniversities}
                onExport={() => exportToPDF()}
                onRowClick={handleRowClick}
                selectedEvent={selectedEvent}
                onEventChange={setSelectedEvent}
                events={events}
                loadingEvents={loadingEvents}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                availableDates={availableDates}
                loadingDates={loadingDates}
              />
            )}

            {currentLevel === 'university' && (
              <SmallGroupLevelTable 
              data={processedEngagementData}
              loading={loadingSmallGroups}
              onExport={() => exportToPDF()}
              onRowClick={handleRowClick}
              selectedEvent={selectedEvent}
              onEventChange={setSelectedEvent}
              events={events}
              loadingEvents={loadingEvents}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              availableDates={availableDates}
              loadingDates={loadingDates}
            />
          )}


            {currentLevel === 'member' && (
              <MemberLevelTable 
                data={memberData}
                loading={loadingMembers}
                onExport={() => exportToPDF()}
                selectedEvent={selectedEvent}
                onEventChange={setSelectedEvent}
                events={events}
                loadingEvents={loadingEvents}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                availableDates={availableDates}
                loadingDates={loadingDates}
                smallGroupName={navigationStack[2]?.name || 'Small Group'}
              />
            )}


          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
