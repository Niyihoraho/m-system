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
}

export function MarkAttendanceForm({ 
  regionId, 
  universityId, 
  smallGroupId, 
  alumniGroupId 
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
      let url = '/api/events';
      const params = new URLSearchParams();
      
      if (regionId) params.append("regionId", regionId);
      if (universityId) params.append("universityId", universityId);
      if (smallGroupId) params.append("smallGroupId", smallGroupId);
      if (alumniGroupId) params.append("alumniGroupId", alumniGroupId);
      
      if (params.toString()) {
        url += "?" + params.toString();
      }
      
      const response = await axios.get(url);
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  }, [regionId, universityId, smallGroupId, alumniGroupId]);

  const fetchMembers = useCallback(async () => {
    setIsLoadingMembers(true);
    setMembers([]);
    setAttendance({});
    setMemberError(null);
    
    try {
      let url = "/api/members";
      const params = new URLSearchParams();
      
      if (smallGroupId) {
        params.append("smallGroupId", smallGroupId);
      } else if (alumniGroupId) {
        params.append("alumniGroupId", alumniGroupId);
      } else if (universityId) {
        params.append("universityId", universityId);
      } else if (regionId) {
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
  }, [regionId, universityId, smallGroupId, alumniGroupId]);

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
    
    const attendanceRecords = members.map(m => ({
      memberId: m.id,
      status: attendance[m.id] || "present",
      permanentEventId: parseInt(selectedEvent)
    }));
    
    try {
      const response = await axios.post("/api/attendance", attendanceRecords);
      
      if (response.status === 201 && response.data.results?.every((r: Record<string, unknown>) => r.success)) {
        const eventName = events.find(e => e.id.toString() === selectedEvent)?.name || "the selected event";
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
      setSubmitError("Failed to save attendance. " + (err.message || ""));
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
  );
}
