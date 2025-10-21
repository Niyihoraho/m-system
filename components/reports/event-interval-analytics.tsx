"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Calendar, 
  Users, 
  TrendingUp, 
  Clock,
  BarChart3,
  Activity,
  MapPin,
  Building2,
  GraduationCap,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EventIntervalData {
  id: number;
  name: string;
  type: string;
  status: 'active' | 'inactive';
  region?: { id: number; name: string } | null;
  university?: { id: number; name: string } | null;
  smallGroup?: { id: number; name: string } | null;
  alumniGroup?: { id: number; name: string } | null;
  startDate: string;
  endDate: string | null;
  durationDays: number;
  totalAttendance: number;
  uniqueAttendees: number;
  averageAttendancePerMember: number;
  engagementRate: number;
  attendanceRecords: Array<{
    id: number;
    memberId: number;
    memberName: string;
    recordedAt: string;
    status: string;
  }>;
}

interface EventIntervalSummary {
  totalEvents: number;
  activeEvents: number;
  inactiveEvents: number;
  totalEngagementPeriod: number;
  totalAttendance: number;
  totalUniqueAttendees: number;
  averageEngagementRate: number;
}

interface EventIntervalAnalyticsProps {
  regionId?: number;
  universityId?: number;
  smallGroupId?: number;
  alumniGroupId?: number;
}

export function EventIntervalAnalytics({ 
  regionId, 
  universityId, 
  smallGroupId, 
  alumniGroupId 
}: EventIntervalAnalyticsProps) {
  const [events, setEvents] = useState<EventIntervalData[]>([]);
  const [summary, setSummary] = useState<EventIntervalSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Filters
  const [filters, setFilters] = useState({
    eventId: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: ''
  });

  // Fetch event interval data
  const fetchEventIntervalData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (regionId) params.append('regionId', regionId.toString());
      if (universityId) params.append('universityId', universityId.toString());
      if (smallGroupId) params.append('smallGroupId', smallGroupId.toString());
      if (alumniGroupId) params.append('alumniGroupId', alumniGroupId.toString());
      
      // Add filters
      if (filters.eventId !== 'all') params.append('eventId', filters.eventId);
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      
      const response = await axios.get(`/api/engagement/event-intervals?${params.toString()}`);
      
      if (response.status === 200) {
        setEvents(response.data.events);
        setSummary(response.data.summary);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch event interval data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventIntervalData();
  }, [regionId, universityId, smallGroupId, alumniGroupId, filters]);

  // Export data
  const handleExport = () => {
    const csvData = events.map(event => ({
      'Event Name': event.name,
      'Type': event.type,
      'Status': event.status,
      'Region': event.region?.name || 'N/A',
      'University': event.university?.name || 'N/A',
      'Small Group': event.smallGroup?.name || 'N/A',
      'Alumni Group': event.alumniGroup?.name || 'N/A',
      'Start Date': new Date(event.startDate).toLocaleDateString(),
      'End Date': event.endDate ? new Date(event.endDate).toLocaleDateString() : 'Ongoing',
      'Duration (Days)': event.durationDays,
      'Total Attendance': event.totalAttendance,
      'Unique Attendees': event.uniqueAttendees,
      'Avg Attendance per Member': event.averageAttendancePerMember,
      'Engagement Rate (%)': event.engagementRate
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `event-interval-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>Loading event interval analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={fetchEventIntervalData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            Event Interval Analytics
          </h2>
          <p className="text-muted-foreground">
            Track engagement periods and participation metrics for events
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchEventIntervalData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="eventId">Event</Label>
              <Select value={filters.eventId} onValueChange={(value) => setFilters(prev => ({ ...prev, eventId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All Events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {events.map(event => (
                    <SelectItem key={event.id} value={event.id.toString()}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="dateFrom">From Date</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="dateTo">To Date</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Events</p>
                  <p className="text-2xl font-bold">{summary.totalEvents}</p>
                </div>
                <Calendar className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Events</p>
                  <p className="text-2xl font-bold text-green-600">{summary.activeEvents}</p>
                </div>
                <Activity className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Engagement Days</p>
                  <p className="text-2xl font-bold">{summary.totalEngagementPeriod}</p>
                </div>
                <Clock className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Engagement Rate</p>
                  <p className="text-2xl font-bold">{summary.averageEngagementRate}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Event Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead>Engagement Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map(event => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{event.name}</div>
                          <div className="text-sm text-muted-foreground">{event.type}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${event.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                          <Badge variant={event.status === 'active' ? "default" : "destructive"}>
                            {event.status === 'active' ? '🟢 Active' : '🔴 Inactive'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{event.durationDays} days</div>
                          <div className="text-muted-foreground">
                            {new Date(event.startDate).toLocaleDateString()} - 
                            {event.endDate ? new Date(event.endDate).toLocaleDateString() : 'Ongoing'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{event.totalAttendance} total</div>
                          <div className="text-muted-foreground">{event.uniqueAttendees} unique</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{event.engagementRate}%</div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="detailed">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Event Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {events.map(event => (
                  <Card key={event.id} className="border-l-4 border-l-blue-500">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{event.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{event.type}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${event.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                          <Badge variant={event.status === 'active' ? "default" : "destructive"}>
                            {event.status === 'active' ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <Label className="text-sm font-medium">Duration</Label>
                          <p className="text-lg font-semibold">{event.durationDays} days</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(event.startDate).toLocaleDateString()} - 
                            {event.endDate ? new Date(event.endDate).toLocaleDateString() : 'Ongoing'}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Attendance</Label>
                          <p className="text-lg font-semibold">{event.totalAttendance} total</p>
                          <p className="text-sm text-muted-foreground">{event.uniqueAttendees} unique members</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Engagement</Label>
                          <p className="text-lg font-semibold">{event.engagementRate}%</p>
                          <p className="text-sm text-muted-foreground">{event.averageAttendancePerMember} avg per member</p>
                        </div>
                      </div>
                      
                      {event.attendanceRecords.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Recent Attendance</Label>
                          <div className="max-h-32 overflow-y-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Member</TableHead>
                                  <TableHead>Date</TableHead>
                                  <TableHead>Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {event.attendanceRecords.slice(0, 5).map(record => (
                                  <TableRow key={record.id}>
                                    <TableCell className="text-sm">{record.memberName}</TableCell>
                                    <TableCell className="text-sm">{new Date(record.recordedAt).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className="text-xs">
                                        {record.status}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
