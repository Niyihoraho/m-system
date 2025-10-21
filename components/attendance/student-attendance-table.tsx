"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  Search, 
  Download,
  Filter,
  TrendingUp,
  Calendar,
  GraduationCap,
  Building,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";

interface StudentAttendanceData {
  memberId: number;
  memberName: string;
  email: string;
  phone: string;
  region: string;
  university: string;
  smallGroup: string;
  alumniGroup: string;
  status: string;
  memberSince: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  excusedDays: number;
  attendanceRate: number;
  memberCapacity: number;
  lastAttendanceDate: string | null;
  lastAttendanceStatus: string;
  lastEventName: string;
  permanentEventsAttended: number;
  trainingEventsAttended: number;
  monthlyAttendance: Array<{
    month: string;
    present: number;
    total: number;
    rate: number;
  }>;
}

interface OverallStats {
  totalMembers: number;
  totalCapacity: number;
  totalAttendance: number;
  totalPresent: number;
  totalAbsent: number;
  totalExcused: number;
  overallAttendanceRate: number;
  activeEventsCount: number;
  activeTrainingsCount: number;
}

interface StudentAttendanceTableProps {
  regionId: string;
  universityId: string;
  smallGroupId: string;
  alumniGroupId: string;
  userScope: any;
}

export function StudentAttendanceTable({
  regionId,
  universityId,
  smallGroupId,
  alumniGroupId,
  userScope
}: StudentAttendanceTableProps) {
  const [data, setData] = useState<StudentAttendanceData[]>([]);
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "attendanceRate" | "totalDays">("attendanceRate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (eventTypeFilter !== "all") params.append("eventType", eventTypeFilter);
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);
      if (regionId && regionId !== "all") params.append("regionId", regionId);
      if (universityId && universityId !== "all") params.append("universityId", universityId);
      if (smallGroupId && smallGroupId !== "all") params.append("smallGroupId", smallGroupId);
      if (alumniGroupId && alumniGroupId !== "all") params.append("alumniGroupId", alumniGroupId);

      const response = await fetch(`/api/attendance/student-analytics?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      setData(result.studentAnalytics || []);
      setOverallStats(result.overallStats || null);
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error('Error fetching student attendance data:', error);
      // Set empty data on error to prevent crashes
      setData([]);
      setOverallStats(null);
      setError(error instanceof Error ? error.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [eventTypeFilter, dateFrom, dateTo, regionId, universityId, smallGroupId, alumniGroupId]);

  // Filter and sort data
  const filteredData = data
    .filter(student => {
      const matchesSearch = searchTerm === "" || 
        student.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.university.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.smallGroup.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || student.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "name":
          comparison = a.memberName.localeCompare(b.memberName);
          break;
        case "attendanceRate":
          comparison = a.attendanceRate - b.attendanceRate;
          break;
        case "totalDays":
          comparison = a.totalDays - b.totalDays;
          break;
      }
      
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const getAttendanceRateColor = (rate: number) => {
    if (rate >= 90) return "text-green-600";
    if (rate >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "inactive": return "secondary";
      case "suspended": return "destructive";
      default: return "outline";
    }
  };

  const exportData = () => {
    const csvContent = [
      ["Name", "Email", "Region", "University", "Small Group", "Status", "Total Days", "Present", "Absent", "Excused", "Attendance Rate (%)", "Last Attendance", "Last Event"],
      ...filteredData.map(student => [
        student.memberName,
        student.email,
        student.region,
        student.university,
        student.smallGroup,
        student.status,
        student.totalDays.toString(),
        student.presentDays.toString(),
        student.absentDays.toString(),
        student.excusedDays.toString(),
        student.attendanceRate.toString(),
        student.lastAttendanceDate ? format(new Date(student.lastAttendanceDate), "MMM dd, yyyy") : "Never",
        student.lastEventName
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `student-attendance-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading student attendance data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <h3 className="font-semibold mb-2">Error Loading Data</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchData} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Statistics Cards */}
      {overallStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Capacity</p>
                  <p className="text-2xl font-bold text-blue-600">{overallStats.totalCapacity.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <UserCheck className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Attendance</p>
                  <p className="text-2xl font-bold text-green-600">{overallStats.totalPresent.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <UserX className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Absent</p>
                  <p className="text-2xl font-bold text-red-600">{overallStats.totalAbsent.toLocaleString()}</p>
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
                  <p className="text-2xl font-bold text-yellow-600">{overallStats.totalExcused.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Overall Attendance Rate Card */}
      {overallStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Overall Attendance Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold text-foreground mb-2">
                {overallStats.overallAttendanceRate}%
              </div>
              <p className="text-muted-foreground mb-4">
                {overallStats.totalPresent.toLocaleString()} of {overallStats.totalAttendance.toLocaleString()} total attendance
              </p>
              <div className="w-full bg-muted rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${overallStats.overallAttendanceRate}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span>Active Events: {overallStats.activeEventsCount}</span>
                <span>Active Trainings: {overallStats.activeTrainingsCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Student Attendance Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Event Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="permanent">Permanent Events</SelectItem>
                  <SelectItem value="training">Training Events</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="attendanceRate">Attendance Rate</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="totalDays">Total Days</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </Button>

              <Button onClick={exportData} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <div className="flex gap-4 mb-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">From Date</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">To Date</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Individual Student Attendance ({filteredData.length} students)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>University</TableHead>
                  <TableHead>Small Group</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Capacity</TableHead>
                  <TableHead className="text-center">Present</TableHead>
                  <TableHead className="text-center">Absent</TableHead>
                  <TableHead className="text-center">Excused</TableHead>
                  <TableHead className="text-center">Attendance Rate</TableHead>
                  <TableHead>Last Attendance</TableHead>
                  <TableHead>Last Event</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((student) => (
                  <TableRow key={student.memberId}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{student.memberName}</div>
                        <div className="text-sm text-muted-foreground">{student.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Building className="w-3 h-3 text-muted-foreground" />
                        {student.region}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <GraduationCap className="w-3 h-3 text-muted-foreground" />
                        {student.university}
                      </div>
                    </TableCell>
                    <TableCell>{student.smallGroup}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(student.status)}>
                        {student.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="font-medium">{student.memberCapacity}</div>
                      <div className="text-xs text-muted-foreground">events</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="font-medium text-green-600">{student.presentDays}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="font-medium text-red-600">{student.absentDays}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="font-medium text-yellow-600">{student.excusedDays}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="space-y-2">
                        <div className={`font-bold ${getAttendanceRateColor(student.attendanceRate)}`}>
                          {student.attendanceRate}%
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              student.attendanceRate >= 90 ? 'bg-green-500' :
                              student.attendanceRate >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${student.attendanceRate}%` }}
                          ></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {student.lastAttendanceDate ? (
                        <div>
                          <div className="text-sm">{format(new Date(student.lastAttendanceDate), "MMM dd, yyyy")}</div>
                          <Badge 
                            variant={student.lastAttendanceStatus === 'present' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {student.lastAttendanceStatus}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{student.lastEventName}</div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredData.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No students found matching the current filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
