"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useUserScope } from '@/hooks/use-user-scope';
import { EngagementAnalyticsTable } from '@/components/reports/engagement-analytics-table';
import { RegionalLevelTable } from '@/components/reports/regional-level-table';
import { UniversityLevelTable } from '@/components/reports/university-level-table';
import { SmallGroupLevelTable } from '@/components/reports/small-group-level-table';
import { MemberLevelTable } from '@/components/reports/member-level-table-enhanced';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AppSidebar } from '@/components/app-sidebar';
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

export default function EngagementReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { userScope, loading: scopeLoading } = useUserScope();
  
  // Role-based data state
  const [selectedEvent, setSelectedEvent] = useState('all');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [events, setEvents] = useState<Array<{id: number; name: string; type: string}>>([]);
  const [availableDates, setAvailableDates] = useState<Array<Date>>([]);
  
  // Role-based data - each user scope gets their own data
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [regionalData, setRegionalData] = useState<any[]>([]);
  const [universityData, setUniversityData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRegional, setLoadingRegional] = useState(false);
  const [loadingUniversity, setLoadingUniversity] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Authentication check
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push('/');
    }
  }, [status, router]);

  // Load events data
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const eventsResponse = await fetch('/api/events');
        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json();
          const eventsArray = Array.isArray(eventsData) ? eventsData : [];
          setEvents(eventsArray);
    } else {
          setEvents([]);
        }
    } catch (error) {
        console.error('Error loading events:', error);
        setEvents([]);
    }
  };
    loadEvents();
  }, []);

  // Load regional data
  const fetchRegionalData = async () => {
    try {
      setLoadingRegional(true);
      const params = new URLSearchParams();
      if (selectedEvent && selectedEvent !== 'all') {
        params.append('selectedEvent', selectedEvent);
      }
      if (selectedDate) {
        params.append('selectedDate', selectedDate);
      }
      console.log('🔍 Fetching regional data with filters:', params.toString());
      const response = await fetch(`/api/engagement/regions?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setRegionalData(data);
        console.log('🔍 Regional data received:', data);
      } else {
        console.error('Failed to fetch regional data');
        setRegionalData([]);
      }
    } catch (error) {
      console.error('Error fetching regional data:', error);
      setRegionalData([]);
    } finally {
      setLoadingRegional(false);
    }
  };

  // Load university data
  const fetchUniversityData = async () => {
    try {
      setLoadingUniversity(true);
      const params = new URLSearchParams();
      if (userScope?.regionId) {
        params.append('regionId', userScope.regionId.toString());
      }
      if (selectedEvent && selectedEvent !== 'all') {
        params.append('selectedEvent', selectedEvent);
      }
      if (selectedDate) {
        params.append('selectedDate', selectedDate);
      }
      console.log('🔍 Fetching university data with filters:', params.toString());
      const response = await fetch(`/api/engagement/universities?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setUniversityData(data);
        console.log('🔍 University data received:', data);
      } else {
        console.error('Failed to fetch university data');
        setUniversityData([]);
      }
    } catch (error) {
      console.error('Error fetching university data:', error);
      setUniversityData([]);
    } finally {
      setLoadingUniversity(false);
    }
  };

  // Load available dates
  useEffect(() => {
    const loadAvailableDates = async () => {
      try {
        const datesResponse = await fetch('/api/attendance/dates');
        if (datesResponse.ok) {
          const datesData = await datesResponse.json();
          const dateStrings = datesData.dates || [];
          // Convert date strings to Date objects
          const dates = dateStrings.map((dateStr: any) => new Date(dateStr));
          setAvailableDates(dates);
          if (dates.length > 0) {
            setSelectedDate(dates[dates.length - 1].toISOString().split('T')[0]);
          }
        }
      } catch (error) {
        console.error('Error loading dates:', error);
      }
    };
    loadAvailableDates();
  }, []);

  // Load regional data when filters change or component mounts
  useEffect(() => {
    if (userScope?.scope === 'region') {
      fetchRegionalData();
    }
  }, [userScope?.scope, selectedEvent, selectedDate]);

  // Load university data when filters change or component mounts
  useEffect(() => {
    if (userScope?.scope === 'university') {
      fetchUniversityData();
    }
  }, [userScope?.scope, selectedEvent, selectedDate]);

  // Fetch role-based analytics data
  const fetchAnalyticsData = async () => {
    if (!userScope) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (selectedEvent && selectedEvent !== 'all') params.append('selectedEvent', selectedEvent);
      if (selectedDate) params.append('selectedDate', selectedDate);
      
      // Add user scope parameters for RLS
      if (userScope.regionId) params.append('regionId', userScope.regionId.toString());
      if (userScope.universityId) params.append('universityId', userScope.universityId.toString());
      if (userScope.smallGroupId) params.append('smallGroupId', userScope.smallGroupId.toString());
      if (userScope.alumniGroupId) params.append('alumniGroupId', userScope.alumniGroupId.toString());

      console.log('🔍 Fetching role-based analytics:', {
        scope: userScope.scope,
        params: params.toString()
      });

      const response = await fetch(`/api/engagement/analytics?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      
      const data = await response.json();
      console.log('🔍 Analytics data received:', {
        scope: userScope.scope,
        selectedEvent,
        selectedDate,
        dataKeys: Object.keys(data),
        regionalEngagement: data.regionalEngagement,
        regionalEngagementLength: data.regionalEngagement?.length || 0,
        keyMetrics: data.keyMetrics,
        userScope: userScope,
        events: events,
        eventsLength: events.length
      });
      
      // Transform the data to match table expectations
      const transformedData = {
        ...data,
        regionalEngagement: data.regionalEngagement?.map((item: any) => ({
          region: item.region,
          totalEngagement: item.totalEngagement,
          previousPeriodEngagement: Math.floor(item.totalEngagement * 0.8), // Estimate previous period
          eventAttendance: item.eventEngagement,
          previousPeriodEventAttendance: Math.floor(item.eventEngagement * 0.8),
          designationParticipation: item.designationEngagement,
          previousPeriodDesignationParticipation: Math.floor(item.designationEngagement * 0.8),
          engagementRate: item.engagementRate,
          previousPeriodEngagementRate: Math.floor(item.engagementRate * 0.9),
          averageAttendancePerEvent: item.eventEngagement > 0 ? Math.floor(item.totalEngagement / item.eventEngagement) : 0,
          previousPeriodAverageAttendancePerEvent: 0,
          totalEvents: 0,
          previousPeriodTotalEvents: 0,
          totalDesignations: item.designationEngagement,
          previousPeriodTotalDesignations: Math.floor(item.designationEngagement * 0.8)
        })) || []
      };
      
      console.log('🔍 Transformed data:', {
        originalLength: data.regionalEngagement?.length || 0,
        transformedLength: transformedData.regionalEngagement.length,
        transformedData: transformedData.regionalEngagement
      });
      
      setAnalyticsData(transformedData);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when user scope or filters change
  useEffect(() => {
    if (userScope && !scopeLoading) {
      fetchAnalyticsData();
    }
  }, [userScope, selectedEvent, selectedDate, scopeLoading]);

  if (status === "loading" || scopeLoading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading engagement reports...</p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!session?.user?.id) {
    router.push('/');
    return null;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/links">
                    Links
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Engagement Reports</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        
        <div className="flex flex-1 flex-col gap-4 p-2 sm:p-4 pt-0">
          <div className="max-w-7xl mx-auto w-full">
            {/* Header */}
            <div className="mb-4 sm:mb-6 lg:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">
                Engagement Reports
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                {userScope?.scope === 'superadmin' && 'View engagement analytics across all regions'}
                {userScope?.scope === 'national' && 'View engagement analytics across all regions'}
                {userScope?.scope === 'region' && `View engagement analytics for ${userScope.region?.name || 'your region'}`}
                {userScope?.scope === 'university' && `View engagement analytics for ${userScope.university?.name || 'your university'}`}
                {userScope?.scope === 'smallgroup' && `View engagement analytics for ${userScope.smallGroup?.name || 'your small group'}`}
                {userScope?.scope === 'alumnismallgroup' && `View engagement analytics for ${userScope.alumniGroup?.name || 'your alumni group'}`}
              </p>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <Label htmlFor="event-filter">Event</Label>
                    <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select event" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Events</SelectItem>
                        {events.map((event) => (
                          <SelectItem key={event.id} value={event.id.toString()}>
                            {event.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex-1 min-w-[200px]">
                    <Label htmlFor="date-filter">Date</Label>
                    <Select value={selectedDate || "all"} onValueChange={(value) => setSelectedDate(value === "all" ? "" : value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select date" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Dates</SelectItem>
                        {availableDates.map((date) => (
                          <SelectItem key={date.toISOString()} value={date.toISOString().split('T')[0]}>
                            {date.toLocaleDateString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
          </div>

                  <div className="flex items-end">
                <Button
                  variant="outline"
                      onClick={() => {
                        setSelectedEvent('all');
                        setSelectedDate('');
                      }}
                >
                      Clear Filters
                </Button>
                      </div>
                    </div>
              </CardContent>
            </Card>

            {/* Role-based Content */}
            {error && (
              <Card className="mb-6 border-destructive">
                <CardContent className="pt-6">
                  <div className="text-destructive text-center">
                    <p className="font-medium">Error loading data</p>
                    <p className="text-sm mt-1">{error}</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={fetchAnalyticsData}
                      className="mt-2"
                    >
                      Try Again
                    </Button>
                         </div>
                </CardContent>
              </Card>
            )}

            {/* Super Admin & National - Show National Level */}
            <AllowOnly scopes={['superadmin', 'national']}>
              <EngagementAnalyticsTable 
                data={analyticsData?.regionalEngagement || []}
                loading={loading}
                onExport={() => {}}
                  selectedEvent={selectedEvent}
                  onEventChange={setSelectedEvent}
                  events={events}
                loadingEvents={false}
              />
            </AllowOnly>

            {/* Region Level - Show Regional Data */}
            <AllowOnly scopes="region">
              <RegionalLevelTable 
                data={regionalData}
                loading={loadingRegional}
                onExport={() => {}}
                selectedEvent={selectedEvent}
                onEventChange={setSelectedEvent}
                events={events}
                loadingEvents={false}
              />
            </AllowOnly>

            {/* University Level - Show University Data */}
            <AllowOnly scopes="university">
              <UniversityLevelTable 
                data={universityData}
                loading={loadingUniversity}
                onExport={() => {}}
                selectedEvent={selectedEvent}
                onEventChange={setSelectedEvent}
                events={events}
                loadingEvents={false}
              />
            </AllowOnly>

            {/* Small Group Level - Show Small Group Data */}
            <AllowOnly scopes="smallgroup">
              <SmallGroupLevelTable 
                data={analyticsData?.smallGroupEngagement || []}
                loading={loading}
                onExport={() => {}}
              selectedEvent={selectedEvent}
              onEventChange={setSelectedEvent}
              events={events}
                loadingEvents={false}
              />
            </AllowOnly>

            {/* Alumni Small Group Level - Show Member Data */}
            <AllowOnly scopes="alumnismallgroup">
              <MemberLevelTable 
                data={analyticsData?.memberEngagement || []}
                loading={loading}
                onExport={() => {}}
                selectedEvent={selectedEvent}
                onEventChange={setSelectedEvent}
                events={events}
                loadingEvents={false}
              />
            </AllowOnly>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
