"use client";

import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Search, RefreshCw, Plus, Edit, Calendar, Users, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { AppSidebar } from "@/components/app-sidebar";
import { SuperAdminScopeSelector } from "@/components/super-admin-scope-selector";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/ui copy/card";
import { Input } from "@/components/ui/ui copy/input";
import { Label } from "@/components/ui/ui copy/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/ui copy/select";
import { Button } from "@/components/ui/ui copy/button";

interface AttendanceRecord {
  id: number;
  member: { 
    id: number; 
    firstname: string; 
    secondname: string;
    regionId?: number;
    universityId?: number;
    smallGroupId?: number;
    alumniGroupId?: number;
  } | null;
  permanentministryevent: { id: number; name: string } | null;
  trainings: { id: number; name: string } | null;
  status: string;
  recordedAt: string;
  notes?: string;
}

interface Event {
  id: number;
  name: string;
  type: string;
}

interface Member {
  id: number;
  firstname: string;
  secondname: string;
}

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState<'mark' | 'view'>('mark');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  
  // Scope selection state
  const [regionId, setRegionId] = useState("");
  const [universityId, setUniversityId] = useState("");
  const [smallGroupId, setSmallGroupId] = useState("");
  const [alumniGroupId, setAlumniGroupId] = useState("");

  // Mark Attendance state
  const [selectedEvent, setSelectedEvent] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [attendance, setAttendance] = useState<{ [memberId: string]: string }>({});
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // View Records state
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [eventFilter, setEventFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState<string>("");
  const [editMessage, setEditMessage] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  // Filter dropdowns state
  const [regions, setRegions] = useState<{id: number, name: string}[]>([]);
  const [universities, setUniversities] = useState<{id: number, name: string, regionId: number}[]>([]);
  const [smallGroups, setSmallGroups] = useState<{id: number, name: string, universityId: number, regionId: number}[]>([]);
  const [alumniGroups, setAlumniGroups] = useState<{id: number, name: string, regionId: number}[]>([]);
  const [selectedRegionFilter, setSelectedRegionFilter] = useState("");
  const [selectedUniversityFilter, setSelectedUniversityFilter] = useState("");
  const [selectedSmallGroupFilter, setSelectedSmallGroupFilter] = useState("");
  const [selectedAlumniGroupFilter, setSelectedAlumniGroupFilter] = useState("");

  const attendanceStatuses = [
    { value: "present", label: "Present" },
    { value: "absent", label: "Absent" },
    { value: "excused", label: "Excused" },
  ];

  // Check if user is super admin
  useEffect(() => {
    // For now, assume super admin - you can implement proper auth check
    setIsSuperAdmin(true);
  }, []);

  // Fetch events
  useEffect(() => {
    fetchEvents();
  }, []);

  // Fetch regions for filter dropdowns
  useEffect(() => {
    fetchRegions();
  }, []);

  // Fetch universities when region filter changes
  useEffect(() => {
    if (selectedRegionFilter) {
      fetchUniversities(Number(selectedRegionFilter));
      fetchAlumniGroups(Number(selectedRegionFilter));
    } else {
      setUniversities([]);
      setAlumniGroups([]);
      setSelectedUniversityFilter("");
      setSelectedAlumniGroupFilter("");
    }
  }, [selectedRegionFilter]);

  // Fetch small groups when university filter changes
  useEffect(() => {
    if (selectedUniversityFilter) {
      fetchSmallGroups(Number(selectedUniversityFilter));
    } else {
      setSmallGroups([]);
      setSelectedSmallGroupFilter("");
    }
  }, [selectedUniversityFilter]);

  // Fetch members when event or scope changes
  useEffect(() => {
    if (selectedEvent) {
      fetchMembers();
    } else {
      setMembers([]);
      setAttendance({});
    }
  }, [selectedEvent, regionId, universityId, smallGroupId, alumniGroupId]);

  // Fetch attendance records when filters change
  useEffect(() => {
    if (activeTab === 'view') {
      fetchAttendanceRecords();
    }
  }, [activeTab, eventFilter, statusFilter, dateFrom, dateTo, regionId, universityId, smallGroupId, alumniGroupId, selectedRegionFilter, selectedUniversityFilter, selectedSmallGroupFilter, selectedAlumniGroupFilter]);

  const fetchEvents = async () => {
    try {
      const response = await axios.get('/api/events');
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchRegions = async () => {
    try {
      const response = await axios.get('/api/regions');
      setRegions(response.data);
    } catch (error) {
      console.error('Error fetching regions:', error);
    }
  };

  const fetchUniversities = async (regionId: number) => {
    try {
      const response = await axios.get(`/api/universities?regionId=${regionId}`);
      setUniversities(response.data);
    } catch (error) {
      console.error('Error fetching universities:', error);
    }
  };

  const fetchSmallGroups = async (universityId: number) => {
    try {
      const response = await axios.get(`/api/small-groups?universityId=${universityId}`);
      setSmallGroups(response.data);
    } catch (error) {
      console.error('Error fetching small groups:', error);
    }
  };

  const fetchAlumniGroups = async (regionId: number) => {
    try {
      const response = await axios.get(`/api/alumni-small-groups?regionId=${regionId}`);
      setAlumniGroups(response.data);
    } catch (error) {
      console.error('Error fetching alumni groups:', error);
    }
  };

  const fetchMembers = async () => {
    setIsLoadingMembers(true);
    setMembers([]);
    setAttendance({});
    setMemberError(null);
    
    try {
      let url = "/api/members";
      const params = new URLSearchParams();
      
      if (isSuperAdmin) {
        if (smallGroupId) {
          params.append("smallGroupId", smallGroupId);
        } else if (alumniGroupId) {
          params.append("alumniGroupId", alumniGroupId);
        } else if (universityId) {
          params.append("universityId", universityId);
        } else if (regionId) {
          params.append("regionId", regionId);
        }
      }
      
      if (params.toString()) {
        url += "?" + params.toString();
      }
      
      const response = await axios.get(url);
      const membersData = response.data.members || response.data;
      
      if (Array.isArray(membersData)) {
        setMembers(membersData);
        // Default all to present
        const initialAttendance: { [memberId: string]: string } = {};
        membersData.forEach((m: Member) => {
          initialAttendance[m.id] = "present";
        });
        setAttendance(initialAttendance);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      setMemberError("Failed to load members");
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (eventFilter) params.append("eventId", eventFilter);
      if (statusFilter) params.append("status", statusFilter);
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);
      
      // Add filter dropdown parameters
      if (selectedRegionFilter) params.append("regionId", selectedRegionFilter);
      if (selectedUniversityFilter) params.append("universityId", selectedUniversityFilter);
      if (selectedSmallGroupFilter) params.append("smallGroupId", selectedSmallGroupFilter);
      if (selectedAlumniGroupFilter) params.append("alumniGroupId", selectedAlumniGroupFilter);
      
      if (isSuperAdmin) {
        if (regionId) params.append("regionId", regionId);
        if (universityId) params.append("universityId", universityId);
        if (smallGroupId) params.append("smallGroupId", smallGroupId);
        if (alumniGroupId) params.append("alumniGroupId", alumniGroupId);
      }
      
      const response = await axios.get(`/api/attendance?${params.toString()}`);
      setAttendanceRecords(response.data);
    } catch (err) {
      console.error('Error fetching attendance records:', err);
      setError('Failed to fetch attendance records. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleScopeChange = (scope: {
    regionId?: string;
    universityId?: string;
    smallGroupId?: string;
    alumniGroupId?: string;
  }) => {
    setRegionId(scope.regionId || "");
    setUniversityId(scope.universityId || "");
    setSmallGroupId(scope.smallGroupId || "");
    setAlumniGroupId(scope.alumniGroupId || "");
  };

  const handleRegionFilterChange = (value: string) => {
    setSelectedRegionFilter(value);
    setSelectedUniversityFilter("");
    setSelectedSmallGroupFilter("");
    setSelectedAlumniGroupFilter("");
  };

  const handleUniversityFilterChange = (value: string) => {
    setSelectedUniversityFilter(value);
    setSelectedSmallGroupFilter("");
  };

  const handleSmallGroupFilterChange = (value: string) => {
    setSelectedSmallGroupFilter(value);
  };

  const handleAlumniGroupFilterChange = (value: string) => {
    setSelectedAlumniGroupFilter(value);
  };

  const handleAttendanceChange = (memberId: string, status: string) => {
    setAttendance(prev => ({ ...prev, [memberId]: status }));
  };

  const handleAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMessage(null);
    setSubmitError(null);
    
    if (!selectedEvent) {
      setSubmitError("Please select an event to mark attendance for.");
      return;
    }
    
    if (members.length === 0) {
      setSubmitError("No members found for the selected criteria.");
      return;
    }
    
    const attendanceRecords = members.map(m => ({
      memberId: m.id,
      status: attendance[m.id] || "present",
      permanentEventId: parseInt(selectedEvent)
    }));
    
    try {
      const response = await axios.post("/api/attendance", attendanceRecords);
      
      if (response.status === 201 && response.data.results?.every((r: any) => r.success)) {
        const eventName = events.find(e => e.id.toString() === selectedEvent)?.name || "the selected event";
        const memberCount = members.length;
        setSubmitMessage(`Attendance for ${memberCount} member(s) at "${eventName}" has been saved successfully!`);
        setSubmitError(null);
        setAttendance({});
        setMembers([]);
        setSelectedEvent("");
      } else {
        const errorMessages = response.data.results
          ?.filter((r: any) => !r.success)
          ?.map((r: any) => {
            if (typeof r.error === 'object') {
              return Object.values(r.error).flat().join(", ");
            }
            return r.error;
          })
          ?.join(", ") || "Some attendance records could not be saved.";
        setSubmitError(errorMessages);
      }
    } catch (err: any) {
      setSubmitError("Failed to save attendance. " + (err.message || ""));
    }
  };

  const handleEdit = (record: AttendanceRecord) => {
    setEditingId(record.id);
    setEditStatus(record.status);
    setEditMessage(null);
    setEditError(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditStatus("");
    setEditMessage(null);
    setEditError(null);
  };

  const handleSave = async (record: AttendanceRecord) => {
    setEditMessage(null);
    setEditError(null);
    try {
      const response = await axios.put(`/api/attendance?id=${record.id}`, {
        status: editStatus
      });
      
      if (response.status === 200) {
        setEditMessage("Attendance updated successfully!");
        setEditingId(null);
        setEditStatus("");
        fetchAttendanceRecords();
      } else {
        setEditError(response.data.error || "Failed to update attendance.");
      }
    } catch (err: any) {
      setEditError("Failed to update attendance. " + (err.message || ""));
    }
  };

  const filteredAttendance = useMemo(() => {
    if (!searchQuery) return attendanceRecords;
    const searchTerm = searchQuery.toLowerCase();
    return attendanceRecords.filter(record =>
      (record.member?.firstname?.toLowerCase().includes(searchTerm) ?? false) ||
      (record.member?.secondname?.toLowerCase().includes(searchTerm) ?? false) ||
      (record.permanentministryevent?.name?.toLowerCase().includes(searchTerm) ?? false) ||
      (record.trainings?.name?.toLowerCase().includes(searchTerm) ?? false)
    );
  }, [attendanceRecords, searchQuery]);

  const attendanceStats = useMemo(() => {
    if (!filteredAttendance.length) return { total: 0, present: 0, absent: 0, excused: 0 };
    
    const stats = filteredAttendance.reduce((acc, record) => {
      acc.total++;
      if (record.status === 'present') acc.present++;
      else if (record.status === 'absent') acc.absent++;
      else if (record.status === 'excused') acc.excused++;
      return acc;
    }, { total: 0, present: 0, absent: 0, excused: 0 });
    
    return stats;
  }, [filteredAttendance]);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
                  <BreadcrumbLink href="/links/activities">
                    Activities
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Attendance Tracking</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-2 sm:p-4 pt-0">
          <div className="max-w-7xl mx-auto w-full">
            {/* Header */}
            <div className="mb-4 sm:mb-6 lg:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">Attendance Tracking</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Manage attendance records and mark attendance for events</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6">
              <Button
                variant={activeTab === 'mark' ? 'default' : 'outline'}
                onClick={() => setActiveTab('mark')}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Mark Attendance
              </Button>
              <Button
                variant={activeTab === 'view' ? 'default' : 'outline'}
                onClick={() => setActiveTab('view')}
                className="flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                View Attendance Records
              </Button>
            </div>

            {/* Super Admin Scope Selector */}
            {isSuperAdmin && (
              <SuperAdminScopeSelector onScopeChange={handleScopeChange} />
            )}

            {/* Mark Attendance Tab */}
            {activeTab === 'mark' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Mark Attendance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAttendanceSubmit} className="space-y-6">
                    <div className="flex flex-wrap gap-4 items-end mb-4">
                      <div className="flex-1 min-w-[180px]">
                        <Label htmlFor="eventId">Event *</Label>
                        <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select event" />
                          </SelectTrigger>
                          <SelectContent>
                            {events.map((event) => (
                              <SelectItem key={event.id} value={event.id.toString()}>
                                {event.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {submitMessage && (
                      <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                            <p className="text-sm font-medium text-green-800">{submitMessage}</p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSubmitMessage(null);
                              setSelectedEvent("");
                            }}
                          >
                            Mark Another Attendance
                          </Button>
                        </div>
                      </div>
                    )}

                    {submitError && (
                      <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center">
                          <XCircle className="h-5 w-5 text-red-400 mr-3" />
                          <p className="text-sm font-medium text-red-800">{submitError}</p>
                        </div>
                      </div>
                    )}

                    {/* Members Attendance Table */}
                    {isLoadingMembers ? (
                      <div className="mt-8 p-4 bg-muted/50 border rounded text-muted-foreground text-center">
                        <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2" />
                        Loading members...
                      </div>
                    ) : members.length > 0 ? (
                      <div className="overflow-x-auto mt-8">
                        <table className="min-w-full divide-y divide-border">
                          <thead>
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Member</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Attendance</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {members.map(member => (
                              <tr key={member.id}>
                                <td className="px-4 py-2 text-foreground">{member.firstname} {member.secondname}</td>
                                <td className="px-4 py-2">
                                  <div className="flex gap-2">
                                    {attendanceStatuses.map(status => (
                                      <Button
                                        key={status.value}
                                        type="button"
                                        variant={attendance[member.id] === status.value ? "default" : "outline"}
                                        size="sm"
                                        className={`px-3 py-1 text-xs transition ${
                                          attendance[member.id] === status.value
                                            ? status.value === 'present'
                                              ? 'bg-green-500 hover:bg-green-600 text-white'
                                              : status.value === 'excused'
                                                ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                                                : 'bg-red-500 hover:bg-red-600 text-white'
                                            : status.value === 'present'
                                              ? 'border-green-400 text-green-700 hover:bg-green-50'
                                              : status.value === 'excused'
                                                ? 'border-yellow-400 text-yellow-700 hover:bg-yellow-50'
                                                : 'border-red-400 text-red-700 hover:bg-red-50'
                                        }`}
                                        onClick={() => handleAttendanceChange(member.id.toString(), status.value)}
                                      >
                                        {status.label}
                                      </Button>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="mt-6 text-right">
                          <Button type="submit" className="px-6 py-2">
                            Save Attendance
                          </Button>
                        </div>
                      </div>
                    ) : selectedEvent ? (
                      <div className="mt-8 p-4 bg-muted/50 border rounded text-muted-foreground text-center">
                        No members found for the selected criteria.
                      </div>
                    ) : (
                      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded text-blue-600 text-center">
                        Please select an event to mark attendance for.
                      </div>
                    )}
                  </form>
                </CardContent>
              </Card>
            )}

            {/* View Attendance Records Tab */}
            {activeTab === 'view' && (
              <div className="space-y-4">
                {/* Filter Controls */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-wrap gap-4 items-end">
                      <div className="min-w-[180px]">
                        <Label htmlFor="eventFilter">Event</Label>
                        <Select value={eventFilter} onValueChange={setEventFilter}>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="All Events" />
                          </SelectTrigger>
                          <SelectContent>
                            {events.map((event) => (
                              <SelectItem key={event.id} value={event.id.toString()}>
                                {event.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="min-w-[150px]">
                        <Label htmlFor="statusFilter">Status</Label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="All Statuses" />
                          </SelectTrigger>
                          <SelectContent>
                            {attendanceStatuses.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="min-w-[150px]">
                        <Label htmlFor="dateFrom">From Date</Label>
                        <Input
                          type="date"
                          value={dateFrom}
                          onChange={(e) => setDateFrom(e.target.value)}
                          className="h-11"
                        />
                      </div>
                      <div className="min-w-[150px]">
                        <Label htmlFor="dateTo">To Date</Label>
                        <Input
                          type="date"
                          value={dateTo}
                          onChange={(e) => setDateTo(e.target.value)}
                          className="h-11"
                        />
                      </div>
                      <div className="min-w-[180px]">
                        <Label htmlFor="regionFilter">Region</Label>
                        <Select value={selectedRegionFilter} onValueChange={handleRegionFilterChange}>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="All Regions" />
                          </SelectTrigger>
                          <SelectContent>
                            {regions.map((region) => (
                              <SelectItem key={region.id} value={region.id.toString()}>
                                {region.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="min-w-[180px]">
                        <Label htmlFor="universityFilter">University</Label>
                        <Select 
                          value={selectedUniversityFilter} 
                          onValueChange={handleUniversityFilterChange}
                          disabled={!selectedRegionFilter}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder={selectedRegionFilter ? "All Universities" : "Select region first"} />
                          </SelectTrigger>
                          <SelectContent>
                            {universities.map((university) => (
                              <SelectItem key={university.id} value={university.id.toString()}>
                                {university.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="min-w-[180px]">
                        <Label htmlFor="smallGroupFilter">Small Group</Label>
                        <Select 
                          value={selectedSmallGroupFilter} 
                          onValueChange={handleSmallGroupFilterChange}
                          disabled={!selectedUniversityFilter}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder={selectedUniversityFilter ? "All Small Groups" : "Select university first"} />
                          </SelectTrigger>
                          <SelectContent>
                            {smallGroups.map((smallGroup) => (
                              <SelectItem key={smallGroup.id} value={smallGroup.id.toString()}>
                                {smallGroup.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="min-w-[180px]">
                        <Label htmlFor="alumniGroupFilter">Alumni Group</Label>
                        <Select 
                          value={selectedAlumniGroupFilter} 
                          onValueChange={handleAlumniGroupFilterChange}
                          disabled={!selectedRegionFilter}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder={selectedRegionFilter ? "All Alumni Groups" : "Select region first"} />
                          </SelectTrigger>
                          <SelectContent>
                            {alumniGroups.map((alumniGroup) => (
                              <SelectItem key={alumniGroup.id} value={alumniGroup.id.toString()}>
                                {alumniGroup.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1 min-w-[200px]">
                        <Label htmlFor="search">Search</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                          <Input
                            type="text"
                            placeholder="Search by member or event name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-11"
                          />
                        </div>
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setEventFilter("");
                            setStatusFilter("");
                            setDateFrom("");
                            setDateTo("");
                            setSearchQuery("");
                            setSelectedRegionFilter("");
                            setSelectedUniversityFilter("");
                            setSelectedSmallGroupFilter("");
                            setSelectedAlumniGroupFilter("");
                          }}
                          className="h-11"
                        >
                          Clear Filters
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Attendance Statistics */}
                {filteredAttendance.length > 0 && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex flex-wrap gap-6 items-center">
                        <div className="text-sm font-medium text-muted-foreground">
                          Total Records: <span className="font-bold text-foreground">{attendanceStats.total}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-muted-foreground">
                            Present: <span className="font-semibold text-green-600">{attendanceStats.present}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span className="text-sm text-muted-foreground">
                            Absent: <span className="font-semibold text-red-600">{attendanceStats.absent}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <span className="text-sm text-muted-foreground">
                            Excused: <span className="font-semibold text-yellow-600">{attendanceStats.excused}</span>
                          </span>
                        </div>
                        {attendanceStats.total > 0 && (
                          <div className="text-sm text-muted-foreground">
                            Attendance Rate: <span className="font-semibold text-blue-600">
                              {Math.round((attendanceStats.present / attendanceStats.total) * 100)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Attendance Records Table */}
                <Card>
                  <CardContent className="p-0">
                    {loading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Loading attendance records...</span>
                        </div>
                      </div>
                    ) : error ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                          <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
                          <div className="text-destructive text-lg mb-2">Error loading attendance records</div>
                          <p className="text-muted-foreground mb-4">{error}</p>
                          <Button onClick={fetchAttendanceRecords}>
                            Retry
                          </Button>
                        </div>
                      </div>
                    ) : !filteredAttendance || filteredAttendance.length === 0 ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <div className="text-muted-foreground text-lg mb-2">No attendance records found</div>
                          <p className="text-muted-foreground">
                            {searchQuery ? `No results for "${searchQuery}". Try a different search term.` : "There are no attendance records to display at the moment."}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-muted/50 border-b border-border">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Member</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Event</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                            </tr>
                          </thead>
                          <tbody className="bg-card divide-y divide-border">
                            {filteredAttendance.map((record) => (
                              <tr key={record.id} className="hover:bg-muted/50">
                                <td className="px-6 py-4 text-sm font-medium text-foreground">
                                  {record.member ? `${record.member.firstname} ${record.member.secondname}` : "N/A"}
                                </td>
                                <td className="px-6 py-4 text-sm text-muted-foreground">
                                  {record.permanentministryevent?.name || record.trainings?.name || "N/A"}
                                </td>
                                <td className="px-6 py-4 text-sm">
                                  {editingId === record.id ? (
                                    <div className="flex gap-2">
                                      {attendanceStatuses.map((statusOpt) => (
                                        <Button
                                          key={statusOpt.value}
                                          type="button"
                                          variant={editStatus === statusOpt.value ? "default" : "outline"}
                                          size="sm"
                                          className={`px-3 py-1 text-xs ${
                                            editStatus === statusOpt.value
                                              ? statusOpt.value === 'present'
                                                ? 'bg-green-500 hover:bg-green-600 text-white'
                                                : statusOpt.value === 'excused'
                                                  ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                                                  : 'bg-red-500 hover:bg-red-600 text-white'
                                              : statusOpt.value === 'present'
                                                ? 'border-green-400 text-green-700 hover:bg-green-50'
                                                : statusOpt.value === 'excused'
                                                  ? 'border-yellow-400 text-yellow-700 hover:bg-yellow-50'
                                                  : 'border-red-400 text-red-700 hover:bg-red-50'
                                          }`}
                                          onClick={() => setEditStatus(statusOpt.value)}
                                        >
                                          {statusOpt.label}
                                        </Button>
                                      ))}
                                      <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => handleSave(record)}
                                        className="ml-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs"
                                      >
                                        Save
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCancel}
                                        className="px-3 py-1 text-xs"
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                        record.status === 'present'
                                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                          : record.status === 'excused'
                                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                      }`}>
                                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                                      </span>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEdit(record)}
                                        className="px-2 py-1 text-xs"
                                      >
                                        Edit
                                      </Button>
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-sm text-muted-foreground">
                                  {formatDate(record.recordedAt)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {editMessage && (
                      <div className="p-4 bg-green-50 border-t border-green-200">
                        <div className="flex items-center text-green-800">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {editMessage}
                        </div>
                      </div>
                    )}
                    {editError && (
                      <div className="p-4 bg-red-50 border-t border-red-200">
                        <div className="flex items-center text-red-800">
                          <XCircle className="w-4 h-4 mr-2" />
                          {editError}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
