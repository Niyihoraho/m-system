"use client";

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { RefreshCw, Plus, Users, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

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
}

interface MarkAttendanceFormProps {
  regionId: string;
  universityId: string;
  smallGroupId: string;
  alumniGroupId: string;
  userScope?: {
    scope: string;
  } | null;
}

export function MarkAttendanceForm({ 
  regionId, 
  universityId, 
  smallGroupId, 
  alumniGroupId,
  userScope 
}: MarkAttendanceFormProps) {
  const [selectedEvent, setSelectedEvent] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [attendance, setAttendance] = useState<{ [memberId: string]: string }>({});
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const attendanceStatuses = [
    { value: "present", label: "Present" },
    { value: "absent", label: "Absent" },
    { value: "excused", label: "Excused" },
  ];

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
      
      // Clear selected event if it's no longer in the filtered list
      if (selectedEvent && !scopeFilteredEvents.find(e => `${e.type}-${e.id}` === selectedEvent)) {
        setSelectedEvent('');
        setMembers([]);
        setAttendance({});
      }
    } catch (error) {
      console.error('Error fetching events:', error);
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

  const fetchMembers = useCallback(async () => {
    setIsLoadingMembers(true);
    setMembers([]);
    setAttendance({});
    setMemberError(null);
    
    try {
      let url = "/api/members";
      const params = new URLSearchParams();
      
      // Apply scope filters when explicitly selected (for all users including superadmin)
      // Cascading filter: Use the most specific scope available
      if (smallGroupId && smallGroupId !== '' && smallGroupId !== 'all') {
        params.append("smallGroupId", smallGroupId);
      } else if (alumniGroupId && alumniGroupId !== '' && alumniGroupId !== 'all') {
        params.append("alumniGroupId", alumniGroupId);
      } else if (universityId && universityId !== '' && universityId !== 'all') {
        params.append("universityId", universityId);
      } else if (regionId && regionId !== '' && regionId !== 'all') {
        params.append("regionId", regionId);
      }
      
      if (params.toString()) {
        url += "?" + params.toString();
      }
      
      const response = await axios.get(url);
      const membersData = response.data.members || response.data;
      
      if (Array.isArray(membersData)) {
        setMembers(membersData);
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
  }, [regionId, universityId, smallGroupId, alumniGroupId, userScope]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    if (selectedEvent) {
      fetchMembers();
    } else {
      setMembers([]);
      setAttendance({});
    }
  }, [selectedEvent, fetchMembers]);

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
    
    // Parse event type and ID from selectedEvent
    const [eventType, eventId] = selectedEvent.split('-');
    
    const attendanceRecords = members.map(m => {
      const record: any = {
        memberId: m.id,
        status: attendance[m.id] || "present"
      };
      
      // Set the appropriate event ID based on event type
      if (eventType === 'permanent') {
        record.permanentEventId = parseInt(eventId);
      } else if (eventType === 'training') {
        record.trainingId = parseInt(eventId);
      }
      
      return record;
    });
    
    try {
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
        setSubmitMessage(`Attendance for ${memberCount} member(s) at "${eventName}" has been saved successfully!`);
        setSubmitError(null);
        setAttendance({});
        setMembers([]);
        setSelectedEvent("");
      } else {
        const errorMessages = response.data.results
          ?.filter((r: Record<string, unknown>) => !r.success)
          ?.map((r: Record<string, unknown>) => {
            if (typeof r.error === 'object') {
              return Object.values(r.error).flat().join(", ");
            }
            return r.error;
          })
          ?.join(", ") || "Some attendance records could not be saved.";
        setSubmitError(errorMessages);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setSubmitError("Failed to save attendance. " + errorMessage);
    }
  };

  return (
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

          {isLoadingMembers ? (
            <div className="mt-8 p-4 bg-muted/50 border rounded text-muted-foreground text-center">
              <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2" />
              Loading members...
            </div>
          ) : members.length > 0 ? (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>Showing members from:</strong> {
                  smallGroupId && smallGroupId !== '' ? 'Small Group' :
                  alumniGroupId && alumniGroupId !== '' ? 'Alumni Group' :
                  universityId && universityId !== '' ? 'University' :
                  regionId && regionId !== '' ? 'Region' :
                  'All Members'
                } ({members.length} member{members.length !== 1 ? 's' : ''})
              </div>
            </div>
          ) : null}
          {members.length > 0 ? (
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
  );
}
