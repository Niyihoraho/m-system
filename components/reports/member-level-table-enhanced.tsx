"use client";

import React, { useMemo } from 'react';
import { EnhancedPowerBITable } from './enhanced-power-bi-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface MemberStatistics {
  memberId: number;
  memberName: string;
  email?: string;
  phone?: string;
  region: string;
  regionId: number;
  university: string;
  universityId: number;
  smallGroup: string;
  smallGroupId: number;
  
  // Student-friendly attendance statistics
  totalAttendanceDays: number; // "How many times we had events"
  totalDaysAttended: number; // "How many times you came"
  totalDaysAbsent: number; // "How many times you missed"
  totalDaysExcused: number; // "How many times you had a valid reason"
  attendanceRate: number; // "Your attendance percentage"
  
  // Recent activity in simple terms
  latestAttendanceStatus: 'present' | 'absent' | 'excuse';
  lastAttendanceDate: string | null; // "Last time you came to an event"
  daysSinceLastAttendance: number; // "Days since you last attended"
  
  // Engagement in everyday language
  totalEventsParticipated: number; // "Events you attended"
  totalDesignationsParticipated: number; // "Tasks you completed"
  totalEngagementScore: number; // "Your overall participation score"
  
  // Member info
  memberType: string;
  memberStatus: string;
  
  // Event timeline context
  activeEventsCount: number; // "How many events are currently running"
  inactiveEventsCount: number; // "How many events have ended"
  totalEventDays: number; // "Total days events were active"
  participationRatio: string; // "You attended X out of Y event days"
  
  // Additional member info
  memberSince: string;
  graduationYear?: number;
  faculty?: string;
  profession?: string;
  
  // Trends (compared to previous period)
  attendanceTrend: number; // percentage change
  engagementTrend: number; // percentage change
  participationTrend: number; // percentage change
}

interface MemberLevelTableProps {
  data: MemberStatistics[];
  loading?: boolean;
  onExport?: () => void;
  selectedEvent?: string;
  onEventChange?: (value: string) => void;
  events?: Array<{id: number; name: string; type: string}>;
  loadingEvents?: boolean;
  selectedDate?: string;
  onDateChange?: (value: string) => void;
  availableDates?: Array<Date>;
  loadingDates?: boolean;
  smallGroupName?: string;
}

export function MemberLevelTable({ 
  data, 
  loading = false, 
  onExport,
  selectedEvent = "all",
  onEventChange,
  events = [],
  loadingEvents = false,
  selectedDate = "",
  onDateChange,
  availableDates = [],
  loadingDates = false,
  smallGroupName = "Small Group"
}: MemberLevelTableProps) {
  
  const tableData = useMemo(() => {
    return data.map(member => ({
      memberId: member.memberId,
      memberName: member.memberName,
      email: member.email,
      phone: member.phone,
      region: member.region,
      regionId: member.regionId,
      university: member.university,
      universityId: member.universityId,
      smallGroup: member.smallGroup,
      smallGroupId: member.smallGroupId,
      
      // Attendance metrics with comparison
      attendanceRate: {
        current: member.attendanceRate,
        previous: Math.max(0, member.attendanceRate - member.attendanceTrend),
        change: member.attendanceTrend
      },
      
      totalAttendanceDays: member.totalAttendanceDays,
      totalDaysAttended: member.totalDaysAttended || 0,
      
      // Status indicators
      latestAttendanceStatus: member.latestAttendanceStatus,
      lastAttendanceDate: member.lastAttendanceDate,
      daysSinceLastAttendance: member.daysSinceLastAttendance,
      
      // Engagement metrics
      totalEngagementScore: {
        current: member.totalEngagementScore,
        previous: Math.max(0, member.totalEngagementScore - Math.round(member.totalEngagementScore * member.engagementTrend / 100)),
        change: Math.round(member.totalEngagementScore * member.engagementTrend / 100)
      },
      
      totalEventsParticipated: member.totalEventsParticipated,
      totalDesignationsParticipated: member.totalDesignationsParticipated,
      
      // Member details
      memberType: member.memberType,
      memberStatus: member.memberStatus,
      memberSince: member.memberSince,
      graduationYear: member.graduationYear,
      faculty: member.faculty,
      profession: member.profession,
      
      // Trend indicators
      attendanceTrend: member.attendanceTrend,
      engagementTrend: member.engagementTrend,
      participationTrend: member.participationTrend,
      
      // Add progress data
      participationProgress: {
        capacity: member.totalAttendanceDays || 0,
        attendance: member.totalDaysAttended || 0,
        percentage: member.totalAttendanceDays > 0 ? Math.round((member.totalDaysAttended / member.totalAttendanceDays) * 100) : 0
      }
    }));
  }, [data]);

  const columns = [
    {
      key: 'memberName',
      label: 'STUDENT NAME',
      type: 'text' as const,
      sortable: true,
      width: '200px'
    },
    {
      key: 'latestAttendanceStatus',
      label: 'CURRENT STATUS',
      type: 'status' as const,
      sortable: true,
      width: '140px'
    },
    {
      key: 'attendanceRate',
      label: 'YOUR ATTENDANCE',
      type: 'comparison' as const,
      sortable: true,
      width: '200px'
    },
    {
      key: 'totalEngagementScore',
      label: 'YOUR PARTICIPATION SCORE',
      type: 'comparison' as const,
      sortable: true,
      width: '200px'
    },
    {
      key: 'lastAttendanceDate',
      label: 'LAST TIME YOU CAME',
      type: 'date' as const,
      sortable: true,
      width: '180px'
    },
    {
      key: 'memberType',
      label: 'TYPE',
      type: 'text' as const,
      sortable: true,
      width: '120px'
    },
    {
      key: 'attendanceTrend',
      label: 'ATTENDANCE TREND',
      type: 'indicator' as const,
      sortable: true,
      width: '160px'
    },
    {
      key: 'participationProgress',
      label: 'PARTICIPATION PROGRESS',
      type: 'progress' as const,
      sortable: false,
      align: 'center' as const,
      width: '200px'
    }
  ];

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (data.length === 0) return null;

    const totalMembers = data.length;
    const activeMembers = data.filter(m => m.memberStatus === 'active').length;
    const averageAttendanceRate = data.reduce((sum, m) => sum + m.attendanceRate, 0) / totalMembers;
    const totalEngagementScore = data.reduce((sum, m) => sum + m.totalEngagementScore, 0);
    const membersWithRecentAttendance = data.filter(m => m.daysSinceLastAttendance <= 7).length;
    
    return {
      totalMembers,
      activeMembers,
      averageAttendanceRate,
      totalEngagementScore,
      membersWithRecentAttendance,
      inactiveMembers: totalMembers - activeMembers
    };
  }, [data]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summaryStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {summaryStats.totalMembers}
                  </p>
                  <p className="text-sm text-blue-500 dark:text-blue-300">
                    Total Members
                  </p>
                </div>
                <User className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {summaryStats.averageAttendanceRate.toFixed(1)}%
                  </p>
                  <p className="text-sm text-green-500 dark:text-green-300">
                    Avg Attendance Rate
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {summaryStats.totalEngagementScore}
                  </p>
                  <p className="text-sm text-purple-500 dark:text-purple-300">
                    Total Engagement Score
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {summaryStats.membersWithRecentAttendance}
                  </p>
                  <p className="text-sm text-orange-500 dark:text-orange-300">
                    Active This Week
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enhanced Table */}
      <EnhancedPowerBITable
        title={`${smallGroupName} - Student Participation Report`}
        description={`See how students are participating in ministry events and activities`}
        columns={columns}
        data={tableData}
        loading={loading}
        onExport={onExport}
        className="w-full"
        selectedEvent={selectedEvent}
        onEventChange={onEventChange}
        events={events}
        loadingEvents={loadingEvents}
        selectedDate={selectedDate}
        onDateChange={onDateChange}
        availableDates={availableDates}
        loadingDates={loadingDates}
        showColumnSettings={true}
        pagination={true}
        pageSize={20}
      />
    </div>
  );
}

