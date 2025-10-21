"use client";

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Plus,
  Search,
  RefreshCw,
  UserCheck,
  UserX,
  AlertCircle,
  Smartphone,
  Calendar,
  Edit
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { EditAttendanceModal } from "@/components/attendance/edit-attendance-modal";

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

interface QuickAttendanceProps {
  regionId: string;
  universityId: string;
  smallGroupId: string;
  alumniGroupId: string;
  userScope?: {
    scope: string;
  } | null;
}

export function QuickAttendance({ 
  regionId, 
  universityId, 
  smallGroupId, 
  alumniGroupId,
  userScope 
}: QuickAttendanceProps) {
  // State management
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [events, setEvents] = useState<Event[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [attendance, setAttendance] = useState<{ [memberId: string]: string }>({});
  const [searchQuery, setSearchQuery] = useState('');
  
  // View records state
  const [showRecords, setShowRecords] = useState(false);
  const [records, setRecords] = useState<any[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [availableDates, setAvailableDates] = useState<{value: string, label: string}[]>([]);
  const [dateFilter, setDateFilter] = useState('all');
  
  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<number | null>(null);
  
  // Loading states
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Error states
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Bulk operations
  const [selectedMembers, setSelectedMembers] = useState<Set<number>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

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
      
      // Clear selected event if it's no longer in the filtered list
      if (selectedEvent && !scopeFilteredEvents.find(e => `${e.type}-${e.id}` === selectedEvent)) {
        setSelectedEvent('');
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

  // Helper function to get hierarchical scope display
  const getHierarchicalScope = (event: Event): string => {
    const scopeParts: string[] = [];
    
    if (event.region?.name) scopeParts.push(event.region.name);
    if (event.university?.name) scopeParts.push(event.university.name);
    if (event.smallGroup?.name) scopeParts.push(event.smallGroup.name);
    if (event.alumniGroup?.name) scopeParts.push(event.alumniGroup.name);
    
    return scopeParts.length > 0 ? scopeParts.join(' ') : 'Super Admin';
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
      
      console.log('Quick Attendance - Fetching available dates - API response:', response.data);
      
      if (response.data && response.data.dates) {
        console.log('Quick Attendance - Available dates from API:', response.data.dates);
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
        if (!regionId || regionId === 'all') {
          setRecords([]);
          return;
        }
      }
      
      let url = "/api/attendance/enhanced";
      const params = new URLSearchParams();
      
      if (selectedEvent && selectedEvent !== 'all') {
        // Parse event ID from the format "permanent-1" or "training-1"
        const eventId = selectedEvent.includes('-') ? selectedEvent.split('-')[1] : selectedEvent;
        params.append("eventId", eventId);
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
      
      if (params.toString()) {
        url += "?" + params.toString();
      }
      
      const response = await axios.get(url);
      console.log('Quick Attendance - Fetch records response:', response.data);
      setRecords(response.data?.records || []);
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      setError('Failed to load attendance records');
    } finally {
      setIsLoadingRecords(false);
    }
  }, [selectedEvent, dateFilter, regionId, universityId, smallGroupId, alumniGroupId, userScope]);

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
    if (showRecords) {
      fetchAvailableDates();
      fetchAttendanceRecords();
    }
  }, [showRecords, fetchAvailableDates, fetchAttendanceRecords]);

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
      
      const attendanceRecords = members.map(member => {
        const record: any = {
          memberId: member.id,
          status: attendance[member.id] || "present"
        };
        
        // Set the appropriate event ID based on event type
        if (eventType === 'permanent') {
          record.permanentEventId = parseInt(eventId);
        } else if (eventType === 'training') {
          record.trainingId = parseInt(eventId);
        }
        
        return record;
      });

      // Use the enhanced bulk attendance API
      const response = await axios.post("/api/attendance/enhanced", {
        eventId: parseInt(eventId),
        eventType: eventType as 'permanent' | 'training',
        attendance: attendanceRecords.map(record => ({
          memberId: record.memberId,
          status: record.status,
          notes: record.notes
        }))
      });
      
      if (response.status === 201 && response.data.success) {
        const eventName = events.find(e => `${e.type}-${e.id}` === selectedEvent)?.name || "the selected event";
        const memberCount = members.length;
        setSuccessMessage(`✅ Attendance for ${memberCount} member(s) at "${eventName}" has been saved successfully!`);
        
        // Reset form
        setAttendance({});
        setMembers([]);
        setSelectedEvent("");
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

  // Filtered members for display
  const filteredMembers = members.filter(member => {
    if (!searchQuery) return true;
    const fullName = `${member.firstname} ${member.secondname}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) ||
           member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           member.phone?.includes(searchQuery);
  });

  return (
    <div className="space-y-4">
      {/* Mobile Header */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground md:hidden">
        <Smartphone className="w-4 h-4" />
        <span>Mobile Optimized</span>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Quick Attendance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Event Selection */}
          <div>
            <Label htmlFor="event">Select Event *</Label>
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an event" />
              </SelectTrigger>
              <SelectContent>
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

          {/* Members List */}
          {selectedEvent && (
            <>
              {isLoadingMembers ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                  Loading members...
                </div>
              ) : members.length > 0 ? (
                <>
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search members..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  {/* Bulk Actions */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowBulkActions(!showBulkActions)}
                      className="flex items-center gap-2"
                    >
                      Bulk Actions
                      {showBulkActions ? <Clock className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </Button>
                    
                    {showBulkActions && (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBulkAction('selectAll')}
                        >
                          Select All
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBulkAction('markPresent')}
                          className="text-green-600 border-green-400"
                        >
                          <UserCheck className="w-4 h-4 mr-1" />
                          Mark Present
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBulkAction('markAbsent')}
                          className="text-red-600 border-red-400"
                        >
                          <UserX className="w-4 h-4 mr-1" />
                          Mark Absent
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Members List - Mobile Optimized */}
                  <div className="space-y-2">
                    {filteredMembers.map((member) => (
                      <Card key={member.id} className="p-3">
                        <div className="flex items-center gap-3">
                          {/* Selection Checkbox */}
                          <Checkbox
                            checked={selectedMembers.has(member.id)}
                            onCheckedChange={(checked) => 
                              handleMemberSelection(member.id, checked as boolean)
                            }
                          />
                          
                          {/* Member Info */}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-foreground truncate">
                              {member.firstname} {member.secondname}
                            </div>
                            <div className="text-sm text-muted-foreground truncate">
                              {member.email}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {member.type} • {member.status}
                            </div>
                          </div>
                          
                          {/* Attendance Buttons */}
                          <div className="flex gap-1">
                            {['present', 'absent', 'excused'].map((status) => (
                              <Button
                                key={status}
                                variant={attendance[member.id] === status ? "default" : "outline"}
                                size="sm"
                                className={cn(
                                  "px-2 py-1 text-xs h-auto min-w-0",
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
                                {status === 'present' && <CheckCircle className="w-3 h-3" />}
                                {status === 'absent' && <XCircle className="w-3 h-3" />}
                                {status === 'excused' && <Clock className="w-3 h-3" />}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </Card>
                    ))}
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

                  {/* Submit Button */}
                  <Button 
                    onClick={handleSubmitAttendance}
                    disabled={isSubmitting || members.length === 0}
                    className="w-full"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Save Attendance ({members.length} members)
                      </>
                    )}
                  </Button>
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

      {/* View Records Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            View Attendance Records
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            onClick={() => setShowRecords(!showRecords)}
            className="w-full"
          >
            {showRecords ? 'Hide Records' : 'Show Records'}
          </Button>

          {showRecords && (
            <>
              {/* Event and Date Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recordEvent">Event</Label>
                  <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Events" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex flex-col">
                          <div className="font-medium">All Events</div>
                          <div className="text-xs text-muted-foreground">View all attendance records</div>
                        </div>
                      </SelectItem>
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

                <div>
                  <Label htmlFor="recordDate">Date</Label>
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
              </div>

              {/* Records Display */}
              {isLoadingRecords ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                  Loading records...
                </div>
              ) : records.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground mb-2">
                    Showing {records.length} attendance record(s)
                  </div>
                  {records.map((record, index) => (
                    <Card key={index} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-foreground">
                            {record.member?.firstname} {record.member?.secondname}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {record.permanentministryevent?.name || record.trainings?.name} • 
                            {new Date(record.recordedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={
                              record.status === 'present' ? 'default' : 
                              record.status === 'absent' ? 'destructive' : 
                              'secondary'
                            }
                            className={
                              record.status === 'present' ? 'bg-green-500 hover:bg-green-600' :
                              record.status === 'absent' ? 'bg-red-500 hover:bg-red-600' :
                              'bg-yellow-500 hover:bg-yellow-600'
                            }
                          >
                            {record.status === 'present' && <CheckCircle className="w-3 h-3 mr-1" />}
                            {record.status === 'absent' && <XCircle className="w-3 h-3 mr-1" />}
                            {record.status === 'excused' && <Clock className="w-3 h-3 mr-1" />}
                            {record.status}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditRecord(record.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No attendance records found for the selected criteria.</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

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
