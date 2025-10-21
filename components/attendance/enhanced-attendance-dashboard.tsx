"use client";

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Users, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  UserCheck,
  UserX,
  AlertCircle,
  BarChart3,
  Settings,
  Edit
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { EditAttendanceModal } from "@/components/attendance/edit-attendance-modal";
import { StudentAttendanceTable } from "./student-attendance-table";

interface Event {
  id: number;
  name: string;
  type: string;
  isActive: boolean;
  regionId?: number | null;
  universityId?: number | null;
  smallGroupId?: number | null;
  alumniGroupId?: number | null;
  region?: { id: number; name: string } | null;
  university?: { id: number; name: string } | null;
  smallGroup?: { id: number; name: string } | null;
  alumniGroup?: { id: number; name: string } | null;
  hierarchicalScope?: string;
}

interface Member {
  id: number;
  firstname: string;
  secondname: string;
  email?: string;
  phone?: string;
  type: string;
  status: string;
}

interface AttendanceRecord {
  id: number;
  memberId: number;
  status: 'present' | 'absent' | 'excused';
  recordedAt: string;
  notes?: string;
  member: Member;
  event: Event;
}

interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  excused: number;
  attendanceRate: number;
}

interface EnhancedAttendanceDashboardProps {
  regionId: string;
  universityId: string;
  smallGroupId: string;
  alumniGroupId: string;
  userScope?: {
    scope: string;
  } | null;
}

export function EnhancedAttendanceDashboard({
  regionId,
  universityId,
  smallGroupId,
  alumniGroupId,
  userScope
}: EnhancedAttendanceDashboardProps) {
  // State management
  const [activeTab, setActiveTab] = useState<'mark' | 'view' | 'analytics' | 'students'>('mark');
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [events, setEvents] = useState<Event[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendance, setAttendance] = useState<{ [memberId: string]: string }>({});
  
  // Loading states
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Error states
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [availableDates, setAvailableDates] = useState<{value: string, label: string}[]>([]);
  
  // Bulk operations
  const [selectedMembers, setSelectedMembers] = useState<Set<number>>(new Set());
  const [bulkAction, setBulkAction] = useState<string>('');
  
  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<number | null>(null);

  // Fetch events with dynamic scope-based filtering
  const fetchEvents = useCallback(async () => {
    try {
      setIsLoadingEvents(true);
      let url = '/api/events/enhanced?includeStats=true';
      const params = new URLSearchParams();
      
      // Apply scope-based filtering based on selected filters
      if (userScope?.scope === 'superadmin') {
        // Only apply filters that are actually selected (not 'all')
        if (regionId && regionId !== 'all') params.append("regionId", regionId);
        if (universityId && universityId !== 'all') params.append("universityId", universityId);
        if (smallGroupId && smallGroupId !== 'all') params.append("smallGroupId", smallGroupId);
        if (alumniGroupId && alumniGroupId !== 'all') params.append("alumniGroupId", alumniGroupId);
      }
      
      if (params.toString()) {
        url += "&" + params.toString();
      }
      
      const response = await axios.get(url);
      
      // Filter events based on exact scope matching
      const scopeFilteredEvents = response.data.filter((event: Event) => {
        if (!event.isActive) return false;
        
        // For superadmin users, apply exact scope matching
        if (userScope?.scope === 'superadmin') {
          // If region is selected, event must match that region
          if (regionId && regionId !== 'all' && event.regionId !== parseInt(regionId)) {
            return false;
          }
          
          // If university is selected, event must match that university
          if (universityId && universityId !== 'all' && event.universityId !== parseInt(universityId)) {
            return false;
          }
          
          // If small group is selected, event must match that small group
          if (smallGroupId && smallGroupId !== 'all' && event.smallGroupId !== parseInt(smallGroupId)) {
            return false;
          }
          
          // If alumni group is selected, event must match that alumni group
          if (alumniGroupId && alumniGroupId !== 'all' && event.alumniGroupId !== parseInt(alumniGroupId)) {
            return false;
          }
        }
        
        return true;
      }).map((event: Event) => ({
        ...event,
        hierarchicalScope: getHierarchicalScope(event)
      }));
      
      setEvents(scopeFilteredEvents);
      
      // Debug logging to understand event filtering
      console.log('Event filtering debug:', {
        totalEvents: response.data.length,
        scopeFilteredEvents: scopeFilteredEvents.length,
        selectedEvent,
        availableEventIds: scopeFilteredEvents.map(e => `${e.type}-${e.id}`)
      });
      
      // Only clear selected event if it's no longer in the filtered list AND we have events available
      // This prevents clearing when events are still loading or temporarily filtered out
      if (selectedEvent && selectedEvent !== 'all' && scopeFilteredEvents.length > 0 && !scopeFilteredEvents.find(e => `${e.type}-${e.id}` === selectedEvent)) {
        console.log('Clearing selected event because it\'s not in filtered list:', selectedEvent);
        setSelectedEvent('all');
        setMembers([]);
        setAttendance({});
        setSelectedMembers(new Set());
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to load events');
    } finally {
      setIsLoadingEvents(false);
    }
  }, [regionId, universityId, smallGroupId, alumniGroupId, userScope, selectedEvent]);

  // Helper function to get hierarchical scope display (same as events management)
  const getHierarchicalScope = (event: Event): string => {
    const scopeParts: string[] = [];
    
    // Add region if available
    if (event.region?.name) {
      scopeParts.push(event.region.name);
    }
    
    // Add university if available
    if (event.university?.name) {
      scopeParts.push(event.university.name);
    }
    
    // Add small group if available
    if (event.smallGroup?.name) {
      scopeParts.push(event.smallGroup.name);
    }
    
    // Add alumni group if available
    if (event.alumniGroup?.name) {
      scopeParts.push(event.alumniGroup.name);
    }
    
    // Return hierarchical path or fallback
    if (scopeParts.length > 0) {
      return scopeParts.join(' ');
    }
    
    // Determine scope level based on available data
    if (event.alumniGroupId) return 'Alumni Small Group';
    if (event.smallGroupId) return 'Small Group';
    if (event.universityId) return 'University';
    if (event.regionId) return 'Region';
    return 'Super Admin';
  };

  // Fetch members
  const fetchMembers = useCallback(async () => {
    if (!selectedEvent) return;
    
    try {
      setIsLoadingMembers(true);
      let url = "/api/members";
      const params = new URLSearchParams();
      
      // Apply scope filters
      if (smallGroupId && smallGroupId !== 'all') {
        params.append("smallGroupId", smallGroupId);
      } else if (alumniGroupId && alumniGroupId !== 'all') {
        params.append("alumniGroupId", alumniGroupId);
      } else if (universityId && universityId !== 'all') {
        params.append("universityId", universityId);
      } else if (regionId && regionId !== 'all') {
        params.append("regionId", regionId);
      }
      
      if (params.toString()) {
        url += "?" + params.toString();
      }
      
      const response = await axios.get(url);
      const membersData = response.data.members || response.data;
      
      if (Array.isArray(membersData)) {
        setMembers(membersData);
        // Initialize attendance with all present
        const initialAttendance: { [memberId: string]: string } = {};
        membersData.forEach((member: Member) => {
          initialAttendance[member.id] = "present";
        });
        setAttendance(initialAttendance);
        setSelectedMembers(new Set(membersData.map((m: Member) => m.id)));
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      setError('Failed to load members');
    } finally {
      setIsLoadingMembers(false);
    }
  }, [selectedEvent, regionId, universityId, smallGroupId, alumniGroupId]);

  // Fetch available dates for the selected event and scope
  const fetchAvailableDates = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      
      // Apply scope filters for superadmin
      if (userScope?.scope === 'superadmin') {
        if (regionId && regionId !== 'all') params.append("regionId", regionId);
        if (universityId && universityId !== 'all') params.append("universityId", universityId);
        if (smallGroupId && smallGroupId !== 'all') params.append("smallGroupId", smallGroupId);
        if (alumniGroupId && alumniGroupId !== 'all') params.append("alumniGroupId", alumniGroupId);
      }
      
      // If a specific event is selected, filter by that event
      if (selectedEvent && selectedEvent !== 'all') {
        const eventId = selectedEvent.includes('-') ? selectedEvent.split('-')[1] : selectedEvent;
        params.append("eventId", eventId);
      }
      
      // Fetch all attendance records to get unique dates
      const response = await axios.get(`/api/attendance/dates?${params.toString()}`);
      
      console.log('Fetching available dates - API response:', response.data);
      
      if (response.data && response.data.dates) {
        console.log('Available dates from API:', response.data.dates);
        const dates = response.data.dates.map((date: string) => {
          const dateObj = new Date(date);
          const formattedDate = dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
          const isoDate = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD format
          
          return {
            value: isoDate,
            label: formattedDate
          };
        });
        
        // Sort dates in descending order (most recent first)
        dates.sort((a: any, b: any) => new Date(b.value).getTime() - new Date(a.value).getTime());
        
        setAvailableDates(dates);
        
        // Reset date filter if the currently selected date is no longer available
        if (dateFilter && dateFilter !== 'all' && !dates.find(d => d.value === dateFilter)) {
          setDateFilter('all');
        }
      } else {
        setAvailableDates([]);
        // Reset date filter if no dates are available
        if (dateFilter && dateFilter !== 'all') {
          setDateFilter('all');
        }
      }
    } catch (error) {
      console.error('Error fetching available dates:', error);
      setAvailableDates([]);
      
      // If there's an error, reset date filter to 'all' to avoid issues
      if (dateFilter && dateFilter !== 'all') {
        setDateFilter('all');
      }
    }
  }, [selectedEvent, regionId, universityId, smallGroupId, alumniGroupId, userScope, dateFilter]);

  // Fetch attendance records
  const fetchAttendanceRecords = useCallback(async () => {
    try {
      setIsLoadingRecords(true);
      
      // For superadmin users, require scope selection before showing records
      if (userScope?.scope === 'superadmin') {
        const hasScopeSelected = regionId && regionId !== 'all';
        const hasEventSelected = selectedEvent && selectedEvent !== 'all';
        
        // If no scope or event selected, return empty records
        if (!hasScopeSelected || !hasEventSelected) {
          setAttendanceRecords([]);
          return;
        }
      } else {
        // For other roles, require event selection before showing records
        const hasEventSelected = selectedEvent && selectedEvent !== 'all';
        
        // If no event selected, return empty records
        if (!hasEventSelected) {
          setAttendanceRecords([]);
          return;
        }
      }
      
      const params = new URLSearchParams();
      
      // Always require a specific event (not 'all')
      if (selectedEvent && selectedEvent !== 'all') {
        // Parse event ID from the format "permanent-1" or "training-1"
        const eventId = selectedEvent.includes('-') ? selectedEvent.split('-')[1] : selectedEvent;
        params.append("eventId", eventId);
      }
      if (statusFilter && statusFilter !== 'all') {
        params.append("status", statusFilter);
      }
      if (dateFilter && dateFilter !== 'all') {
        // If it's a specific date (YYYY-MM-DD format), use dateFrom and dateTo
        if (dateFilter.match(/^\d{4}-\d{2}-\d{2}$/)) {
          params.append("dateFrom", dateFilter);
          params.append("dateTo", dateFilter);
        } else {
          // Otherwise use the old dateRange parameter for relative dates
          params.append("dateRange", dateFilter);
        }
      }
      
      // Apply scope filters for superadmin
      if (userScope?.scope === 'superadmin') {
        if (regionId && regionId !== 'all') params.append("regionId", regionId);
        if (universityId && universityId !== 'all') params.append("universityId", universityId);
        if (smallGroupId && smallGroupId !== 'all') params.append("smallGroupId", smallGroupId);
        if (alumniGroupId && alumniGroupId !== 'all') params.append("alumniGroupId", alumniGroupId);
      }
      
      const response = await axios.get(`/api/attendance?${params.toString()}`);
      setAttendanceRecords(response.data);
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      setError('Failed to load attendance records');
    } finally {
      setIsLoadingRecords(false);
    }
  }, [selectedEvent, statusFilter, dateFilter, regionId, universityId, smallGroupId, alumniGroupId, userScope]);

  // Handle edit record
  const handleEditRecord = (recordId: number) => {
    setEditingRecordId(recordId);
    setEditModalOpen(true);
  };

  // Handle edit success
  const handleEditSuccess = () => {
    // Refresh the records list
    fetchAttendanceRecords();
    fetchAvailableDates();
  };

  // Load data on mount and when dependencies change
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    if (selectedEvent) {
      fetchMembers();
    } else {
      setMembers([]);
      setAttendance({});
      setSelectedMembers(new Set());
    }
  }, [selectedEvent, fetchMembers]);

  useEffect(() => {
    if (activeTab === 'view' || activeTab === 'analytics') {
      fetchAvailableDates();
      fetchAttendanceRecords();
    }
  }, [activeTab, fetchAvailableDates, fetchAttendanceRecords]);

  // Handle attendance change
  const handleAttendanceChange = (memberId: number, status: string) => {
    setAttendance(prev => ({ ...prev, [memberId]: status }));
  };

  // Handle bulk actions
  const handleBulkAction = (action: string) => {
    if (action === 'selectAll') {
      const allMemberIds = members.map(m => m.id);
      setSelectedMembers(new Set(allMemberIds));
    } else if (action === 'deselectAll') {
      setSelectedMembers(new Set());
    } else if (action === 'markPresent') {
      const newAttendance = { ...attendance };
      selectedMembers.forEach(memberId => {
        newAttendance[memberId] = 'present';
      });
      setAttendance(newAttendance);
    } else if (action === 'markAbsent') {
      const newAttendance = { ...attendance };
      selectedMembers.forEach(memberId => {
        newAttendance[memberId] = 'absent';
      });
      setAttendance(newAttendance);
    } else if (action === 'markExcused') {
      const newAttendance = { ...attendance };
      selectedMembers.forEach(memberId => {
        newAttendance[memberId] = 'excused';
      });
      setAttendance(newAttendance);
    }
  };

  // Handle member selection
  const handleMemberSelection = (memberId: number, selected: boolean) => {
    const newSelection = new Set(selectedMembers);
    if (selected) {
      newSelection.add(memberId);
    } else {
      newSelection.delete(memberId);
    }
    setSelectedMembers(newSelection);
  };

  // Submit attendance
  const handleSubmitAttendance = async () => {
    if (!selectedEvent || members.length === 0) {
      setError('Please select an event and ensure members are loaded');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Parse event type and ID from selectedEvent
      const [eventType, eventId] = selectedEvent.split('-');
      
      // Use the enhanced bulk attendance API
      const response = await axios.post("/api/attendance/enhanced", {
        eventId: parseInt(eventId),
        eventType: eventType as 'permanent' | 'training',
        attendance: members.map(member => ({
          memberId: member.id,
          status: attendance[member.id] || "present"
        }))
      });
      
      if (response.status === 201 && response.data.success) {
        const eventName = events.find(e => `${e.type}-${e.id}` === selectedEvent)?.name || "the selected event";
        const memberCount = members.length;
        setSuccessMessage(`✅ Attendance for ${memberCount} member(s) at "${eventName}" has been saved successfully!`);
        
        // Reset form
        setAttendance({});
        setMembers([]);
        setSelectedEvent("all");
        setSelectedMembers(new Set());
      } else {
        setError(response.data.message || "Failed to save attendance");
      }
    } catch (err: any) {
      setError(`Failed to save attendance: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate statistics
  const calculateStats = (): AttendanceStats => {
    const filteredRecords = attendanceRecords.filter(record => {
      const matchesSearch = !searchQuery || 
        record.member.firstname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.member.secondname.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    const total = filteredRecords.length;
    const present = filteredRecords.filter(r => r.status === 'present').length;
    const absent = filteredRecords.filter(r => r.status === 'absent').length;
    const excused = filteredRecords.filter(r => r.status === 'excused').length;
    const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;

    return { total, present, absent, excused, attendanceRate };
  };

  const stats = calculateStats();

  // Filtered members for display
  const filteredMembers = members.filter(member => {
    if (!searchQuery) return true;
    const fullName = `${member.firstname} ${member.secondname}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) ||
           member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           member.phone?.includes(searchQuery);
  });

  // Filtered attendance records
  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSearch = !searchQuery || 
      record.member.firstname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.member.secondname.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    const matchesEvent = !selectedEvent || selectedEvent === 'all' || 
      record.permanentministryevent?.id.toString() === (selectedEvent.includes('-') ? selectedEvent.split('-')[1] : selectedEvent) ||
      record.trainings?.id.toString() === (selectedEvent.includes('-') ? selectedEvent.split('-')[1] : selectedEvent);
    return matchesSearch && matchesStatus && matchesEvent;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Attendance Management</h2>
          <p className="text-muted-foreground">Track and manage member attendance for events</p>
        </div>
        
        {/* Quick Stats */}
        {activeTab === 'view' && (
          <div className="flex gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {stats.total} Total
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1 text-green-600">
              <CheckCircle className="w-3 h-3" />
              {stats.present} Present
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1 text-red-600">
              <XCircle className="w-3 h-3" />
              {stats.absent} Absent
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1 text-yellow-600">
              <Clock className="w-3 h-3" />
              {stats.excused} Excused
            </Badge>
          </div>
        )}
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="mark" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Mark Attendance
          </TabsTrigger>
          <TabsTrigger value="view" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            View Records
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Student Analytics
          </TabsTrigger>
        </TabsList>

        {/* Mark Attendance Tab */}
        <TabsContent value="mark" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Mark Attendance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Event Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="event">Select Event *</Label>
                  <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an event" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex flex-col">
                          <div className="font-medium">All Events</div>
                          <div className="text-xs text-muted-foreground">Select an event to mark attendance</div>
                        </div>
                      </SelectItem>
                      {events.length > 0 ? (
                        events.map((event) => (
                          <SelectItem key={`${event.type}-${event.id}`} value={`${event.type}-${event.id}`}>
                            <div className="flex flex-col">
                              <div className="font-medium">{event.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {event.type === 'permanent' ? 'Permanent Event' : 'Training Event'}
                                {event.hierarchicalScope && ` • ${event.hierarchicalScope}`}
                              </div>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          No events found for the selected scope
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedEvent && selectedEvent !== 'all' && (
                  <div className="flex items-end">
                    <Button 
                      onClick={handleSubmitAttendance}
                      disabled={isSubmitting || members.length === 0}
                      className="w-full"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Save Attendance
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {/* Members List */}
              {selectedEvent && selectedEvent !== 'all' && (
                <>
                  {isLoadingMembers ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                      Loading members...
                    </div>
                  ) : members.length > 0 ? (
                    <>
                      {/* Search and Bulk Actions */}
                      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <div className="flex-1 min-w-[200px]">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input
                              placeholder="Search members..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-10"
                            />
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                Bulk Actions
                                <ChevronDown className="w-4 h-4 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => handleBulkAction('selectAll')}>
                                Select All
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleBulkAction('deselectAll')}>
                                Deselect All
                              </DropdownMenuItem>
                              <Separator />
                              <DropdownMenuItem onClick={() => handleBulkAction('markPresent')}>
                                <UserCheck className="w-4 h-4 mr-2" />
                                Mark Selected Present
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleBulkAction('markAbsent')}>
                                <UserX className="w-4 h-4 mr-2" />
                                Mark Selected Absent
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleBulkAction('markExcused')}>
                                <Clock className="w-4 h-4 mr-2" />
                                Mark Selected Excused
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Members Table */}
                      <div className="border rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-muted/50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                                  <Checkbox
                                    checked={selectedMembers.size === filteredMembers.length && filteredMembers.length > 0}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        handleBulkAction('selectAll');
                                      } else {
                                        handleBulkAction('deselectAll');
                                      }
                                    }}
                                  />
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                                  Member
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                                  Contact
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                                  Status
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {filteredMembers.map((member) => (
                                <tr key={member.id}>
                                  <td className="px-4 py-3">
                                    <Checkbox
                                      checked={selectedMembers.has(member.id)}
                                      onCheckedChange={(checked) => 
                                        handleMemberSelection(member.id, checked as boolean)
                                      }
                                    />
                                  </td>
                                  <td className="px-4 py-3">
                                    <div>
                                      <div className="font-medium text-foreground">
                                        {member.firstname} {member.secondname}
                                      </div>
                                      <div className="text-sm text-muted-foreground capitalize">
                                        {member.type} • {member.status}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-muted-foreground">
                                    <div>{member.email}</div>
                                    <div>{member.phone}</div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex gap-1">
                                      {['present', 'absent', 'excused'].map((status) => (
                                        <Button
                                          key={status}
                                          variant={attendance[member.id] === status ? "default" : "outline"}
                                          size="sm"
                                          className={cn(
                                            "px-2 py-1 text-xs h-auto",
                                            attendance[member.id] === status
                                              ? status === 'present'
                                                ? 'bg-green-500 hover:bg-green-600 text-white'
                                                : status === 'excused'
                                                  ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                                                  : 'bg-red-500 hover:bg-red-600 text-white'
                                              : status === 'present'
                                                ? 'border-green-400 text-green-700 hover:bg-green-50'
                                                : status === 'excused'
                                                  ? 'border-yellow-400 text-yellow-700 hover:bg-yellow-50'
                                                  : 'border-red-400 text-red-700 hover:bg-red-50'
                                          )}
                                          onClick={() => handleAttendanceChange(member.id, status)}
                                        >
                                          {status.charAt(0).toUpperCase() + status.slice(1)}
                                        </Button>
                                      ))}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Summary */}
                      <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <span>
                          Showing {filteredMembers.length} of {members.length} members
                        </span>
                        <span>
                          Selected: {selectedMembers.size} members
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No members found for the selected criteria.</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* View Records Tab */}
        <TabsContent value="view" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Attendance Records
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                <div className="flex-1 min-w-[200px]">
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search by member name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="min-w-[180px]">
                  <Label htmlFor="event">Event</Label>
                  <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Events" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Events</SelectItem>
                      {events.map((event) => (
                        <SelectItem key={`${event.type}-${event.id}`} value={`${event.type}-${event.id}`}>
                          <div className="flex flex-col">
                            <div className="font-medium">{event.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {event.type === 'permanent' ? 'Permanent Event' : 'Training Event'}
                              {event.hierarchicalScope && ` • ${event.hierarchicalScope}`}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="min-w-[150px]">
                  <Label htmlFor="status">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="absent">Absent</SelectItem>
                      <SelectItem value="excused">Excused</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="min-w-[150px]">
                  <Label htmlFor="date">Date</Label>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Dates" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Dates</SelectItem>
                      {availableDates.length > 0 ? (
                        availableDates.map((date) => (
                          <SelectItem key={date.value} value={date.value}>
                            {date.label}
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="yesterday">Yesterday</SelectItem>
                          <SelectItem value="last7days">Last 7 Days</SelectItem>
                          <SelectItem value="thismonth">This Month</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setDateFilter('all');
                  }}
                >
                  Clear
                </Button>
              </div>

              {/* Records Table */}
              {isLoadingRecords ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                  Loading records...
                </div>
              ) : filteredRecords.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Member
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Event
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Date
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredRecords.map((record) => (
                          <tr key={record.id}>
                            <td className="px-4 py-3">
                              <div className="font-medium text-foreground">
                                {record.member.firstname} {record.member.secondname}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {record.member.email || 'No email'}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {record.permanentministryevent?.name || record.trainings?.name || 'Unknown Event'}
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                variant={
                                  record.status === 'present' ? 'default' :
                                  record.status === 'absent' ? 'destructive' : 'secondary'
                                }
                                className={
                                  record.status === 'present' ? 'bg-green-100 text-green-800' :
                                  record.status === 'absent' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }
                              >
                                {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {new Date(record.recordedAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditRecord(record.id)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No attendance records found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Capacity</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Attendance</p>
                    <p className="text-2xl font-bold text-green-600">{stats.present}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Absent</p>
                    <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Excused</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.excused}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Attendance Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold text-foreground mb-2">
                  {stats.attendanceRate}%
                </div>
                <p className="text-muted-foreground mb-4">
                  {stats.present} of {stats.total} total attendance
                </p>
                <div className="w-full bg-muted rounded-full h-3">
                  <div 
                    className="bg-green-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${stats.attendanceRate}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Student Analytics Tab */}
        <TabsContent value="students" className="space-y-4">
          <StudentAttendanceTable
            regionId={regionId}
            universityId={universityId}
            smallGroupId={smallGroupId}
            alumniGroupId={alumniGroupId}
            userScope={userScope}
          />
        </TabsContent>
      </Tabs>

      {/* Edit Attendance Modal */}
      <EditAttendanceModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingRecordId(null);
        }}
        attendanceId={editingRecordId}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}
