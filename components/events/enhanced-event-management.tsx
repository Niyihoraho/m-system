"use client";

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Calendar, 
  Users, 
  TrendingUp, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  RefreshCw,
  Eye,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  Shield,
  MapPin,
  X,
  Play,
  Building2,
  GraduationCap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { DeleteEventModal } from "@/components/delete-event-modal";

interface Event {
  id: number;
  name: string;
  type: string;
  regionId: number | null;
  universityId: number | null;
  smallGroupId: number | null;
  alumniGroupId: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  region?: { id: number; name: string } | null;
  university?: { id: number; name: string } | null;
  smallGroup?: { id: number; name: string } | null;
  alumniGroup?: { id: number; name: string } | null;
  totalAttendance?: number;
  recentAttendance?: number;
  attendanceRate?: number;
}

interface EventStats {
  totalEvents: number;
  activeEvents: number;
  totalAttendance: number;
  averageAttendanceRate: number;
}

interface EnhancedEventManagementProps {
  regionId: string;
  universityId: string;
  smallGroupId: string;
  alumniGroupId: string;
  userScope?: {
    scope: string;
  } | null;
}

export function EnhancedEventManagement({ 
  regionId, 
  universityId, 
  smallGroupId, 
  alumniGroupId,
  userScope 
}: EnhancedEventManagementProps) {
  // State management
  const [activeTab, setActiveTab] = useState<'list' | 'stats' | 'create'>('list');
  
  // Scope-based field visibility logic
  const getVisibleFields = () => {
    if (!userScope) {
      return {
        scope: true,
        region: true,
        university: true,
        smallGroup: true,
        alumniGroup: true
      };
    }

    switch (userScope.scope) {
      case 'superadmin':
        return {
          scope: true,
          region: true,
          university: true,
          smallGroup: true,
          alumniGroup: true
        };
      case 'national':
        return {
          scope: true,
          region: true,
          university: true,
          smallGroup: true,
          alumniGroup: true
        };
      case 'region':
        return {
          scope: false, // Scope is pre-selected
          region: false, // Region is pre-selected
          university: true,
          smallGroup: true,
          alumniGroup: true
        };
      case 'university':
        return {
          scope: false, // Scope is pre-selected
          region: false, // Region is pre-selected
          university: false, // University is pre-selected
          smallGroup: true,
          alumniGroup: true
        };
      case 'smallgroup':
        return {
          scope: false, // Scope is pre-selected
          region: false, // Region is pre-selected
          university: false, // University is pre-selected
          smallGroup: false, // Small group is pre-selected
          alumniGroup: true
        };
      case 'alumnismallgroup':
        return {
          scope: false, // Scope is pre-selected
          region: false, // Region is pre-selected
          university: false, // University is pre-selected
          smallGroup: true,
          alumniGroup: false // Alumni group is pre-selected
        };
      default:
        return {
          scope: true,
          region: true,
          university: true,
          smallGroup: true,
          alumniGroup: true
        };
    }
  };

  const visibleFields = getVisibleFields();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Loading states
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Error states
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Create event form
  const [createForm, setCreateForm] = useState({
    name: '',
    type: '',
    isActive: true,
    // Scope fields (following assign-role-modal pattern)
    scope: 'superadmin',
    regionId: '',
    universityId: '',
    smallGroupId: '',
    alumniGroupId: ''
  });
  
  // Edit mode state
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  
  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Scope selection state (following assign-role-modal pattern)
  const [regions, setRegions] = useState<Array<{id: number; name: string}>>([]);
  const [universities, setUniversities] = useState<Array<{id: number; name: string; regionId: number}>>([]);
  const [smallGroups, setSmallGroups] = useState<Array<{id: number; name: string; regionId: number; universityId: number}>>([]);
  const [alumniGroups, setAlumniGroups] = useState<Array<{id: number; name: string; regionId: number}>>([]);

  // Event types
  const eventTypes = [
    { value: 'bible_study', label: 'Bible Study' },
    { value: 'discipleship', label: 'Discipleship' },
    { value: 'evangelism', label: 'Evangelism' },
    { value: 'cell_meeting', label: 'Cell Meeting' },
    { value: 'alumni_meeting', label: 'Alumni Meeting' },
    { value: 'other', label: 'Other' }
  ];

  // Scope options (following assign-role-modal pattern)
  const scopeOptions = [
    { value: "superadmin", label: "Super Admin" },
    { value: "national", label: "National" },
    { value: "region", label: "Region" },
    { value: "university", label: "University" },
    { value: "smallgroup", label: "Small Group" },
    { value: "alumnismallgroup", label: "Alumni Small Group" }
  ];

  // Fetch events with statistics
  const fetchEvents = useCallback(async () => {
    try {
      setIsLoadingEvents(true);
      let url = '/api/events/enhanced?includeStats=true';
      const params = new URLSearchParams();
      
      if (userScope?.scope === 'superadmin') {
        if (regionId && regionId !== 'all') params.append("regionId", regionId);
        if (universityId && universityId !== 'all') params.append("universityId", universityId);
        if (smallGroupId && smallGroupId !== 'all') params.append("smallGroupId", smallGroupId);
        if (alumniGroupId && alumniGroupId !== 'all') params.append("alumniGroupId", alumniGroupId);
      }
      
      if (params.toString()) {
        url += "&" + params.toString();
      }
      
      const response = await axios.get(url);
      setEvents(response.data);
      setFilteredEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to load events');
    } finally {
      setIsLoadingEvents(false);
    }
  }, [regionId, universityId, smallGroupId, alumniGroupId, userScope]);

  // Load events on mount
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Fetch regions on component mount (following assign-role-modal pattern)
  useEffect(() => {
    fetchRegions();
  }, []);

  // Fetch universities when region changes (following assign-role-modal pattern)
  useEffect(() => {
    if (createForm.regionId) {
      fetchUniversities(Number(createForm.regionId));
      fetchAlumniGroups(Number(createForm.regionId));
    } else {
      setUniversities([]);
      setAlumniGroups([]);
      setCreateForm(prev => ({ ...prev, universityId: "", alumniGroupId: "" }));
    }
  }, [createForm.regionId]);

  // Fetch small groups when university changes (following assign-role-modal pattern)
  useEffect(() => {
    if (createForm.universityId && createForm.regionId) {
      fetchSmallGroups(Number(createForm.regionId), Number(createForm.universityId));
    } else {
      setSmallGroups([]);
      setCreateForm(prev => ({ ...prev, smallGroupId: "" }));
    }
  }, [createForm.universityId, createForm.regionId]);

  // Data fetching functions (following assign-role-modal pattern)
  const fetchRegions = async () => {
    try {
      const response = await axios.get('/api/regions');
      if (response.data && Array.isArray(response.data)) {
        setRegions(response.data);
      }
    } catch (error) {
      console.error('Error fetching regions:', error);
    }
  };

  const fetchUniversities = async (regionId: number) => {
    try {
      const response = await axios.get(`/api/universities?regionId=${regionId}`);
      if (response.data && Array.isArray(response.data)) {
        setUniversities(response.data);
      }
    } catch (error) {
      console.error('Error fetching universities:', error);
    }
  };

  const fetchSmallGroups = async (regionId: number, universityId: number) => {
    try {
      const response = await axios.get(`/api/small-groups?regionId=${regionId}&universityId=${universityId}`);
      if (response.data && Array.isArray(response.data)) {
        setSmallGroups(response.data);
      }
    } catch (error) {
      console.error('Error fetching small groups:', error);
    }
  };

  const fetchAlumniGroups = async (regionId: number) => {
    try {
      const response = await axios.get(`/api/alumni-small-groups?regionId=${regionId}`);
      if (response.data && Array.isArray(response.data)) {
        setAlumniGroups(response.data);
      }
    } catch (error) {
      console.error('Error fetching alumni groups:', error);
    }
  };

  // Scope input handler (following assign-role-modal pattern)
  const handleScopeInputChange = (field: string, value: string) => {
    // Clear dependent fields when scope changes
    if (field === "scope") {
      setCreateForm(prev => ({
        ...prev,
        scope: value,
        regionId: "",
        universityId: "",
        smallGroupId: "",
        alumniGroupId: ""
      }));
    } else if (field === "regionId") {
      setCreateForm(prev => ({
        ...prev,
        regionId: value,
        universityId: "",
        smallGroupId: "",
        alumniGroupId: ""
      }));
    } else if (field === "universityId") {
      setCreateForm(prev => ({
        ...prev,
        universityId: value,
        smallGroupId: ""
      }));
    } else {
      setCreateForm(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Filter events based on search and filters
  useEffect(() => {
    let filtered = events;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(event =>
        event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.region?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.university?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.smallGroup?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.alumniGroup?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getHierarchicalScope(event).toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(event => event.type === typeFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(event => 
        statusFilter === 'active' ? event.isActive : !event.isActive
      );
    }

    setFilteredEvents(filtered);
  }, [events, searchQuery, typeFilter, statusFilter]);

  // Create or Update event
  const handleCreateOrUpdateEvent = async () => {
    if (!createForm.name.trim() || !createForm.type) {
      setError('Please fill in all required fields');
      return;
    }

    // Validate scope fields (following assign-role-modal pattern)
    if (createForm.scope === "region" && !createForm.regionId) {
      setError('Region is required for region scope');
      return;
    }
    if (createForm.scope === "university" && !createForm.universityId) {
      setError('University is required for university scope');
      return;
    }
    if (createForm.scope === "smallgroup" && !createForm.smallGroupId) {
      setError('Small group is required for small group scope');
      return;
    }
    if (createForm.scope === "alumnismallgroup" && !createForm.alumniGroupId) {
      setError('Alumni small group is required for alumni small group scope');
      return;
    }

    setIsCreating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const eventData = {
        name: createForm.name.trim(),
        type: createForm.type,
        isActive: createForm.isActive,
        // Use scope-based data instead of props
        regionId: createForm.regionId ? parseInt(createForm.regionId) : undefined,
        universityId: createForm.universityId ? parseInt(createForm.universityId) : undefined,
        smallGroupId: createForm.smallGroupId ? parseInt(createForm.smallGroupId) : undefined,
        alumniGroupId: createForm.alumniGroupId ? parseInt(createForm.alumniGroupId) : undefined
      };

      let response;
      if (editingEventId) {
        // Update existing event
        response = await axios.put(`/api/events/enhanced?id=${editingEventId}`, eventData);
        if (response.status === 200) {
          setSuccessMessage(`✅ Event "${response.data.name}" updated successfully!`);
          // Auto-dismiss success message after 3 seconds
          setTimeout(() => {
            setSuccessMessage(null);
          }, 3000);
        }
      } else {
        // Create new event
        response = await axios.post('/api/events/enhanced', eventData);
        if (response.status === 201) {
          setSuccessMessage(`✅ Event "${response.data.name}" created successfully!`);
          // Auto-dismiss success message after 3 seconds
          setTimeout(() => {
            setSuccessMessage(null);
          }, 3000);
        }
      }
      
      setCreateForm({ 
        name: '', 
        type: '', 
        isActive: true,
        scope: 'superadmin',
        regionId: '',
        universityId: '',
        smallGroupId: '',
        alumniGroupId: ''
      });
      setEditingEventId(null);
      fetchEvents(); // Refresh events list
      setActiveTab('list');
    } catch (err: any) {
      const action = editingEventId ? 'update' : 'create';
      setError(`Failed to ${action} event: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  // Edit event
  const handleEditEvent = async (eventId: number) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    setCreateForm({
      name: event.name,
      type: event.type,
      isActive: event.isActive,
      // Set scope based on event's organizational level
      scope: event.alumniGroupId ? 'alumnismallgroup' : 
             event.smallGroupId ? 'smallgroup' : 
             event.universityId ? 'university' : 
             event.regionId ? 'region' : 'superadmin',
      regionId: event.regionId?.toString() || '',
      universityId: event.universityId?.toString() || '',
      smallGroupId: event.smallGroupId?.toString() || '',
      alumniGroupId: event.alumniGroupId?.toString() || ''
    });
    setEditingEventId(eventId);
    setActiveTab('create');
  };

  // Toggle event status (active/inactive)
  const handleToggleEventStatus = async (eventId: number, newStatus: boolean) => {
    try {
      const response = await axios.put(`/api/events/enhanced?id=${eventId}`, {
        isActive: newStatus
      });
      
      if (response.status === 200) {
        setSuccessMessage(`✅ Event "${response.data.name}" ${newStatus ? 'activated' : 'ended'} successfully!`);
        fetchEvents(); // Refresh events list
        
        // Auto-dismiss success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      }
    } catch (err: any) {
      setError(`Failed to update event status: ${err.response?.data?.error || err.message}`);
    }
  };

  // Delete event
  const handleDeleteEvent = async (eventId: number) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    setEventToDelete(event);
    setDeleteModalOpen(true);
  };

  // Confirm delete event
  const handleConfirmDelete = async () => {
    if (!eventToDelete) return;

    setIsDeleting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await axios.delete(`/api/events/enhanced?id=${eventToDelete.id}`);
      
      if (response.status === 200) {
        setSuccessMessage(`✅ Event "${eventToDelete.name}" deleted successfully!`);
        fetchEvents(); // Refresh events list
        setDeleteModalOpen(false);
        setEventToDelete(null);
        
        // Auto-dismiss success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      }
    } catch (err: any) {
      // Handle specific error cases
      if (err.response?.status === 409) {
        setError(`Cannot delete "${eventToDelete.name}". It has attendance records associated with it. Please remove all attendance records first.`);
      } else if (err.response?.status === 403) {
        setError(`Access denied. You don't have permission to delete this event.`);
      } else if (err.response?.status === 404) {
        setError(`Event not found. It may have been deleted by another user.`);
      } else {
        setError(`Failed to delete event: ${err.response?.data?.error || err.message}`);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Cancel delete
  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setEventToDelete(null);
    setIsDeleting(false);
  };

  // Calculate statistics
  const calculateStats = (): EventStats => {
    const totalEvents = events.length;
    const activeEvents = events.filter(e => e.isActive).length;
    const totalAttendance = events.reduce((sum, e) => sum + (e.totalAttendance || 0), 0);
    const averageAttendanceRate = events.length > 0 
      ? Math.round(events.reduce((sum, e) => sum + (e.attendanceRate || 0), 0) / events.length)
      : 0;

    return {
      totalEvents,
      activeEvents,
      totalAttendance,
      averageAttendanceRate
    };
  };

  const stats = calculateStats();

  // Helper function to get hierarchical scope display (following assign-role-modal pattern)
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

  // Helper function to get scope level badge
  const getScopeLevel = (event: Event): { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' } => {
    if (event.alumniGroupId) return { label: 'Alumni Group', variant: 'destructive' };
    if (event.smallGroupId) return { label: 'Small Group', variant: 'outline' };
    if (event.universityId) return { label: 'University', variant: 'secondary' };
    if (event.regionId) return { label: 'Region', variant: 'default' };
    return { label: 'Super Admin', variant: 'default' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Event Management</h2>
          <p className="text-muted-foreground">Manage ministry events and track attendance</p>
        </div>
        <Button onClick={fetchEvents} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 flex items-center justify-between">
            <span>{successMessage}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSuccessMessage(null)}
              className="h-6 w-6 p-0 text-green-600 hover:text-green-800 hover:bg-green-100"
            >
              <X className="h-3 w-3" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{stats.totalEvents}</div>
                <div className="text-sm text-muted-foreground">Total Events</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{stats.activeEvents}</div>
                <div className="text-sm text-muted-foreground">Active Events</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{stats.totalAttendance}</div>
                <div className="text-sm text-muted-foreground">Total Attendance</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">{stats.averageAttendanceRate}%</div>
                <div className="text-sm text-muted-foreground">Avg. Attendance Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Event List
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Statistics
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Event
          </TabsTrigger>
        </TabsList>

        {/* Event List Tab */}
        <TabsContent value="list" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {eventTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Events Table */}
          <Card>
            <CardHeader>
              <CardTitle>Events ({filteredEvents.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingEvents ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                  Loading events...
                </div>
              ) : filteredEvents.length > 0 ? (
                <Table>
                   <TableHeader>
                     <TableRow>
                       <TableHead>Event Name</TableHead>
                       <TableHead>Type</TableHead>
                       <TableHead>Hierarchical Scope</TableHead>
                       <TableHead>Scope Level</TableHead>
                       <TableHead>Status</TableHead>
                       <TableHead>Attendance</TableHead>
                       <TableHead>Actions</TableHead>
                     </TableRow>
                   </TableHeader>
                  <TableBody>
                    {filteredEvents.map((event) => {
                      const scopeLevel = getScopeLevel(event);
                      return (
                        <TableRow key={event.id}>
                          <TableCell className="font-medium">{event.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {eventTypes.find(t => t.value === event.type)?.label || event.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="font-medium text-foreground">
                              {getHierarchicalScope(event)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={scopeLevel.variant}>
                              {scopeLevel.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${event.isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                              <Badge variant={event.isActive ? "default" : "destructive"} className={event.isActive ? "bg-green-100 text-green-800 border-green-200" : "bg-red-100 text-red-800 border-red-200"}>
                                {event.isActive ? '🟢 Active' : '🔴 Inactive'}
                              </Badge>
                            </div>
                            {!event.isActive && (
                              <div className="text-xs text-red-600 mt-1">
                                Ended: {new Date(event.updatedAt).toLocaleDateString()}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">{event.totalAttendance || 0} total</div>
                              <div className="text-muted-foreground">{event.attendanceRate || 0}% rate</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditEvent(event.id)}
                                title="Edit Event"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant={event.isActive ? "destructive" : "default"}
                                size="sm"
                                onClick={() => handleToggleEventStatus(event.id, !event.isActive)}
                                title={event.isActive ? "End Event" : "Reactivate Event"}
                              >
                                {event.isActive ? (
                                  <X className="w-4 h-4" />
                                ) : (
                                  <Play className="w-4 h-4" />
                                )}
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteEvent(event.id)}
                                title="Delete Event"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No events found matching your criteria.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Event Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Event Distribution by Type</h3>
                  <div className="space-y-2">
                    {eventTypes.map(type => {
                      const count = events.filter(e => e.type === type.value).length;
                      const percentage = events.length > 0 ? Math.round((count / events.length) * 100) : 0;
                      return (
                        <div key={type.value} className="flex items-center justify-between">
                          <span className="text-sm">{type.label}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full" 
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground w-8">{count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3">Top Events by Attendance</h3>
                  <div className="space-y-2">
                    {events
                      .sort((a, b) => (b.totalAttendance || 0) - (a.totalAttendance || 0))
                      .slice(0, 5)
                      .map(event => (
                        <div key={event.id} className="flex items-center justify-between">
                          <span className="text-sm truncate">{event.name}</span>
                          <Badge variant="outline">{event.totalAttendance || 0}</Badge>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Create/Edit Event Tab */}
        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {editingEventId ? 'Edit Event' : 'Create New Event'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="eventName">Event Name *</Label>
                <Input
                  id="eventName"
                  placeholder="Enter event name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="eventType">Event Type *</Label>
                <Select value={createForm.type} onValueChange={(value) => setCreateForm(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Event Scope Selection (following assign-role-modal pattern) */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-foreground border-b pb-2">Event Scope</h4>
                
                {/* Show pre-selected scope information */}
                {userScope && userScope.scope !== 'superadmin' && (
                  <div className="space-y-3">
                    <h5 className="text-sm font-medium text-foreground">Pre-selected Scope</h5>
                    
                    {!visibleFields.scope && (
                      <div className="flex items-center gap-2 p-3 bg-muted/50 border border-border rounded-lg">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">
                          Scope: <span className="font-semibold">{userScope.scope.charAt(0).toUpperCase() + userScope.scope.slice(1)}</span>
                        </span>
                      </div>
                    )}
                    
                    {!visibleFields.region && regionId && (
                      <div className="flex items-center gap-2 p-3 bg-muted/50 border border-border rounded-lg">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">
                          Region: <span className="font-semibold">{regions.find(r => r.id.toString() === regionId)?.name || 'Selected'}</span>
                        </span>
                      </div>
                    )}
                    
                    {!visibleFields.university && universityId && (
                      <div className="flex items-center gap-2 p-3 bg-muted/50 border border-border rounded-lg">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">
                          University: <span className="font-semibold">{universities.find(u => u.id.toString() === universityId)?.name || 'Selected'}</span>
                        </span>
                      </div>
                    )}
                    
                    {!visibleFields.smallGroup && smallGroupId && (
                      <div className="flex items-center gap-2 p-3 bg-muted/50 border border-border rounded-lg">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">
                          Small Group: <span className="font-semibold">{smallGroups.find(sg => sg.id.toString() === smallGroupId)?.name || 'Selected'}</span>
                        </span>
                      </div>
                    )}
                    
                    {!visibleFields.alumniGroup && alumniGroupId && (
                      <div className="flex items-center gap-2 p-3 bg-muted/50 border border-border rounded-lg">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">
                          Alumni Group: <span className="font-semibold">{alumniGroups.find(ag => ag.id.toString() === alumniGroupId)?.name || 'Selected'}</span>
                        </span>
                      </div>
                    )}
                  </div>
                )}
                
                {visibleFields.scope && (
                  <div className="space-y-2">
                    <Label htmlFor="scope" className="text-sm font-medium flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Event Scope *
                    </Label>
                    <Select
                      value={createForm.scope}
                      onValueChange={(value) => handleScopeInputChange("scope", value)}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select event scope" />
                      </SelectTrigger>
                      <SelectContent>
                        {scopeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Region (for region, university, smallgroup, alumnismallgroup scopes) */}
                {visibleFields.region && (createForm.scope === "region" || createForm.scope === "university" || createForm.scope === "smallgroup" || createForm.scope === "alumnismallgroup") && (
                  <div className="space-y-2">
                    <Label htmlFor="regionId" className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Region{createForm.scope === "region" ? " *" : ""}
                    </Label>
                    <Select
                      value={createForm.regionId}
                      onValueChange={(value) => handleScopeInputChange("regionId", value)}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select region" />
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
                )}

                {/* University (required for university scope; shown for smallgroup scope) */}
                {visibleFields.university && (createForm.scope === "university" || createForm.scope === "smallgroup") && (
                  <div className="space-y-2">
                    <Label htmlFor="universityId" className="text-sm font-medium flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      University{createForm.scope === "university" ? " *" : ""}
                    </Label>
                    <Select
                      value={createForm.universityId}
                      onValueChange={(value) => handleScopeInputChange("universityId", value)}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select university" />
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
                )}

                {/* Small Group (only for smallgroup scope) */}
                {visibleFields.smallGroup && createForm.scope === "smallgroup" && (
                  <div className="space-y-2">
                    <Label htmlFor="smallGroupId" className="text-sm font-medium flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Small Group *
                    </Label>
                    <Select
                      value={createForm.smallGroupId}
                      onValueChange={(value) => handleScopeInputChange("smallGroupId", value)}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select small group" />
                      </SelectTrigger>
                      <SelectContent>
                        {smallGroups.map((group) => (
                          <SelectItem key={group.id} value={group.id.toString()}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Alumni Small Group (only for alumnismallgroup scope) */}
                {visibleFields.alumniGroup && createForm.scope === "alumnismallgroup" && (
                  <div className="space-y-2">
                    <Label htmlFor="alumniGroupId" className="text-sm font-medium flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Alumni Small Group *
                    </Label>
                    <Select
                      value={createForm.alumniGroupId}
                      onValueChange={(value) => handleScopeInputChange("alumniGroupId", value)}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select alumni small group" />
                      </SelectTrigger>
                      <SelectContent>
                        {alumniGroups.map((group) => (
                          <SelectItem key={group.id} value={group.id.toString()}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                <Label className="text-sm font-medium">Event Status</Label>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="create-active"
                      name="create-status"
                      value="active"
                      checked={createForm.isActive}
                      onChange={() => setCreateForm(prev => ({ ...prev, isActive: true }))}
                      className="h-4 w-4 text-green-600 focus:ring-green-500"
                    />
                    <Label htmlFor="create-active" className="text-sm font-medium text-green-700 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Active (Event is running)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="create-inactive"
                      name="create-status"
                      value="inactive"
                      checked={!createForm.isActive}
                      onChange={() => setCreateForm(prev => ({ ...prev, isActive: false }))}
                      className="h-4 w-4 text-red-600 focus:ring-red-500"
                    />
                    <Label htmlFor="create-inactive" className="text-sm font-medium text-red-700 flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      Inactive (Event has ended)
                    </Label>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded-md">
                  <strong>Status Explanation:</strong><br/>
                  • <strong>Active:</strong> Event is currently running, members can attend (🟢 Green)<br/>
                  • <strong>Inactive:</strong> Event has ended, engagement period is complete (🔴 Red)
                </div>
              </div>
              
              <Button 
                onClick={handleCreateOrUpdateEvent}
                disabled={isCreating || !createForm.name.trim() || !createForm.type}
                className="w-full"
              >
                {isCreating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    {editingEventId ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    {editingEventId ? 'Update Event' : 'Create Event'}
                  </>
                )}
              </Button>
              
              {editingEventId && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setEditingEventId(null);
                    setCreateForm({ 
                      name: '', 
                      type: '', 
                      isActive: true,
                      scope: 'superadmin',
                      regionId: '',
                      universityId: '',
                      smallGroupId: '',
                      alumniGroupId: ''
                    });
                  }}
                  className="w-full"
                >
                  Cancel Edit
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Delete Confirmation Modal */}
      {eventToDelete && (
        <DeleteEventModal
          isOpen={deleteModalOpen}
          onClose={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          eventName={eventToDelete.name}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}
