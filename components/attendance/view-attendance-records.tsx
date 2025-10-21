"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { Search, RefreshCw, Calendar, CheckCircle, XCircle, Download, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProfessionalDateFilter } from "./professional-date-filter";

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

interface ViewAttendanceRecordsProps {
  regionId: string;
  universityId: string;
  smallGroupId: string;
  alumniGroupId: string;
  userScope?: {
    scope: string;
  } | null;
}

export function ViewAttendanceRecords({ 
  regionId, 
  universityId, 
  smallGroupId, 
  alumniGroupId,
  userScope 
}: ViewAttendanceRecordsProps) {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [loadingDates, setLoadingDates] = useState(true);

  const latestFormattedDate = useMemo(() => {
    if (availableDates.length > 0) {
      const latestDate = availableDates[0]; // API returns dates in descending order
      return latestDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
    return "Loading Dates...";
  }, [availableDates]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState<string>("");
  const [editMessage, setEditMessage] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);

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

  const fetchAttendanceRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // For superadmin users, require scope selection before showing records
      if (userScope?.scope === 'superadmin') {
        const hasScopeSelected = selectedRegionFilter && selectedRegionFilter !== 'all';
        const hasEventSelected = eventFilter && eventFilter !== 'all';
        
        // If no scope or event selected, return empty records
        if (!hasScopeSelected || !hasEventSelected) {
          setAttendanceRecords([]);
          return;
        }
      } else {
        // For other roles, require event selection before showing records
        const hasEventSelected = eventFilter && eventFilter !== 'all';
        
        // If no event selected, return empty records
        if (!hasEventSelected) {
          setAttendanceRecords([]);
          return;
        }
      }
      
      const params = new URLSearchParams();
      
      // Always require a specific event (not 'all')
      if (eventFilter && eventFilter !== "all") {
        // Parse event type and ID from eventFilter (format: "type-id")
        const [eventType, eventId] = eventFilter.split('-');
        params.append("eventId", eventId);
        params.append("eventType", eventType);
      }
      if (statusFilter) params.append("status", statusFilter);
      
      // Handle date filtering - support both old single date and new date range format
      if (selectedDate && selectedDate !== "latest") {
        if (selectedDate.includes(" to ")) {
          // Handle date range format "YYYY-MM-DD to YYYY-MM-DD"
          const [dateFrom, dateTo] = selectedDate.split(" to ");
          params.append("dateFrom", dateFrom);
          params.append("dateTo", dateTo);
        } else {
          // Handle single date format "YYYY-MM-DD"
          params.append("dateFrom", selectedDate);
          params.append("dateTo", selectedDate);
        }
      }
      
      // Only apply explicit scope filters for superadmin users
      // For other users, let the API apply RLS automatically
      if (userScope?.scope === 'superadmin') {
        // Apply dropdown filter selections (these override the scope filters)
        if (selectedRegionFilter && selectedRegionFilter !== "all") params.append("regionId", selectedRegionFilter);
        if (selectedUniversityFilter && selectedUniversityFilter !== "all") params.append("universityId", selectedUniversityFilter);
        if (selectedSmallGroupFilter && selectedSmallGroupFilter !== "all") params.append("smallGroupId", selectedSmallGroupFilter);
        if (selectedAlumniGroupFilter && selectedAlumniGroupFilter !== "all") params.append("alumniGroupId", selectedAlumniGroupFilter);
        
        // Apply scope filters when explicitly selected (for superadmin only)
        // Only if no dropdown filters are selected
        if (!selectedRegionFilter && regionId && regionId !== "") params.append("regionId", regionId);
        if (!selectedUniversityFilter && universityId && universityId !== "") params.append("universityId", universityId);
        if (!selectedSmallGroupFilter && smallGroupId && smallGroupId !== "") params.append("smallGroupId", smallGroupId);
        if (!selectedAlumniGroupFilter && alumniGroupId && alumniGroupId !== "") params.append("alumniGroupId", alumniGroupId);
      }
      
      const response = await axios.get(`/api/attendance?${params.toString()}`);
      setAttendanceRecords(response.data);
    } catch (err) {
      console.error('Error fetching attendance records:', err);
      setError('Failed to fetch attendance records. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [eventFilter, statusFilter, selectedDate, selectedRegionFilter, selectedUniversityFilter, selectedSmallGroupFilter, selectedAlumniGroupFilter, regionId, universityId, smallGroupId, alumniGroupId, availableDates, userScope]);

  const fetchRegions = useCallback(async () => {
    try {
      const response = await axios.get('/api/regions');
      setRegions(response.data);
    } catch (error) {
      console.error('Error fetching regions:', error);
    }
  }, []);

  const fetchUniversities = useCallback(async (regionId: number) => {
    try {
      const response = await axios.get(`/api/universities?regionId=${regionId}`);
      setUniversities(response.data);
    } catch (error) {
      console.error('Error fetching universities:', error);
    }
  }, []);

  const fetchSmallGroups = useCallback(async (universityId: number) => {
    try {
      const response = await axios.get(`/api/small-groups?universityId=${universityId}`);
      setSmallGroups(response.data);
    } catch (error) {
      console.error('Error fetching small groups:', error);
    }
  }, []);

  const fetchAlumniGroups = useCallback(async (regionId: number) => {
    try {
      const response = await axios.get(`/api/alumni-small-groups?regionId=${regionId}`);
      setAlumniGroups(response.data);
    } catch (error) {
      console.error('Error fetching alumni groups:', error);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      let url = '/api/events/enhanced?includeStats=true';
      const params = new URLSearchParams();
      
      // Apply scope-based filtering based on selected filters
      if (userScope?.scope === 'superadmin') {
        // Only apply filters that are actually selected (not 'all' or empty)
        if (regionId && regionId !== '' && regionId !== 'all') params.append("regionId", regionId);
        if (universityId && universityId !== '' && universityId !== 'all') params.append("universityId", universityId);
        if (smallGroupId && smallGroupId !== '' && smallGroupId !== 'all') params.append("smallGroupId", smallGroupId);
        if (alumniGroupId && alumniGroupId !== '' && alumniGroupId !== 'all') params.append("alumniGroupId", alumniGroupId);
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
          if (regionId && regionId !== '' && regionId !== 'all' && event.regionId !== parseInt(regionId)) {
            return false;
          }
          
          // If university is selected, event must match that university
          if (universityId && universityId !== '' && universityId !== 'all' && event.universityId !== parseInt(universityId)) {
            return false;
          }
          
          // If small group is selected, event must match that small group
          if (smallGroupId && smallGroupId !== '' && smallGroupId !== 'all' && event.smallGroupId !== parseInt(smallGroupId)) {
            return false;
          }
          
          // If alumni group is selected, event must match that alumni group
          if (alumniGroupId && alumniGroupId !== '' && alumniGroupId !== 'all' && event.alumniGroupId !== parseInt(alumniGroupId)) {
            return false;
          }
        }
        
        return true;
      }).map((event: Event) => ({
        ...event,
        hierarchicalScope: getHierarchicalScope(event)
      }));
      
      setEvents(scopeFilteredEvents);
      
      // Clear selected event filter if it's no longer in the filtered list
      if (eventFilter !== 'all' && !scopeFilteredEvents.find(e => e.id.toString() === eventFilter)) {
        setEventFilter('all');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  }, [regionId, universityId, smallGroupId, alumniGroupId, userScope, eventFilter]);

  // Helper function to get hierarchical scope display
  const getHierarchicalScope = (event: Event): string => {
    const scopeParts: string[] = [];
    
    if (event.region?.name) scopeParts.push(event.region.name);
    if (event.university?.name) scopeParts.push(event.university.name);
    if (event.smallGroup?.name) scopeParts.push(event.smallGroup.name);
    if (event.alumniGroup?.name) scopeParts.push(event.alumniGroup.name);
    
    return scopeParts.length > 0 ? scopeParts.join(' ') : 'Super Admin';
  };

  const fetchAvailableDates = useCallback(async () => {
    try {
      setLoadingDates(true);
      const response = await axios.get('/api/attendance/dates');
      const dates = response.data.dates.map((dateStr: string) => new Date(dateStr));
      setAvailableDates(dates);
      
      // Set the latest date as default if no date is selected
      if (!selectedDate && dates.length > 0) {
        setSelectedDate("latest");
      }
      
      // If current selected date is not in available dates, reset to latest
      if (selectedDate && selectedDate !== "latest") {
        const selectedDateObj = new Date(selectedDate);
        const isDateAvailable = dates.some(date => 
          date.getTime() === selectedDateObj.getTime()
        );
        if (!isDateAvailable) {
          setSelectedDate("latest");
        }
      }
    } catch (error) {
      console.error('Error fetching available dates:', error);
    } finally {
      setLoadingDates(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchRegions();
    fetchEvents();
    fetchAvailableDates();
  }, [fetchRegions, fetchEvents, fetchAvailableDates]);

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
  }, [selectedRegionFilter, fetchUniversities, fetchAlumniGroups]);

  useEffect(() => {
    if (selectedUniversityFilter) {
      fetchSmallGroups(Number(selectedUniversityFilter));
    } else {
      setSmallGroups([]);
      setSelectedSmallGroupFilter("");
    }
  }, [selectedUniversityFilter, fetchSmallGroups]);

  useEffect(() => {
    fetchAttendanceRecords();
  }, [fetchAttendanceRecords]);

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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setEditError("Failed to update attendance. " + errorMessage);
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

  const exportToPDF = async (exportStatus: string = 'all') => {
    setIsExporting(true);
    try {
      // Export logic here - simplified for now
      const fileName = `attendance-records-${exportStatus}-${new Date().toISOString().split('T')[0]}.pdf`;
      // PDF generation logic would go here
      console.log('Exporting to PDF:', fileName);
    } catch (error) {
      console.error('Error exporting attendance records:', error);
      alert('Failed to export attendance records. Please try again.');
    } finally {
      setIsExporting(false);
      setShowExportOptions(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Professional Date Filter */}
        <ProfessionalDateFilter
          onDateRangeChange={(dateFrom, dateTo, rangeId) => {
            if (rangeId === 'all' || !dateFrom || !dateTo) {
              setSelectedDate('');
            } else if (dateFrom === dateTo) {
              setSelectedDate(dateFrom);
            } else {
              setSelectedDate(`${dateFrom} to ${dateTo}`);
            }
            fetchAttendanceRecords();
          }}
          showStats={true}
          showQuickActions={true}
          className="lg:col-span-1"
        />

        {/* Event and Status Filters */}
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>Note:</strong> Use the date filter to view attendance records for specific periods. 
                By default, only the latest attendance record per member/event is shown.
              </div>
            </div>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="min-w-[180px]">
                <Label htmlFor="eventFilter">Event</Label>
                <Select value={eventFilter} onValueChange={setEventFilter}>
                  <SelectTrigger className="h-11">
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
              {userScope?.scope === 'superadmin' && (
                <>
                  <div className="min-w-[180px]">
                    <Label htmlFor="regionFilter">Region</Label>
                    <Select value={selectedRegionFilter} onValueChange={handleRegionFilterChange}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="All Regions" />
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
                        <SelectItem value="all">All Universities</SelectItem>
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
                        <SelectItem value="all">All Small Groups</SelectItem>
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
                        <SelectItem value="all">All Alumni Groups</SelectItem>
                        {alumniGroups.map((alumniGroup) => (
                          <SelectItem key={alumniGroup.id} value={alumniGroup.id.toString()}>
                            {alumniGroup.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
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
              <div className="flex items-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEventFilter("all");
                    setStatusFilter("all");
                    setSelectedDate("latest");
                    setSearchQuery("");
                    setSelectedRegionFilter("all");
                    setSelectedUniversityFilter("all");
                    setSelectedSmallGroupFilter("all");
                    setSelectedAlumniGroupFilter("all");
                  }}
                  className="h-11"
                >
                  Clear Filters
                </Button>
                
                <DropdownMenu open={showExportOptions} onOpenChange={setShowExportOptions}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 h-11"
                      disabled={isExporting}
                    >
                      <Download className="w-4 h-4" />
                      {isExporting ? 'Exporting...' : 'Export Document'}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => exportToPDF('all')}>
                      Export All Records
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportToPDF('present')}>
                      Export Present Only
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportToPDF('absent')}>
                      Export Absent Only
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportToPDF('excused')}>
                      Export Excused Only
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Statistics */}
      {filteredAttendance.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-6 items-center">
              <div className="text-sm font-medium text-muted-foreground">
                Total Records: <span className="font-bold text-foreground">{attendanceStats.total}</span>
                {(!selectedDate || selectedDate === "latest") && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Latest Only
                  </span>
                )}
                {selectedDate && selectedDate !== "latest" && (
                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
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
                    <tr key={record.id}>
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
  );
}
