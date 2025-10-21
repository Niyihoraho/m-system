"use client";

import React, { useMemo } from 'react';
import { PowerBITable } from './power-bi-table';

interface MemberData {
  memberId: number;
  memberName: string;
  region: string;
  regionId: number;
  university: string;
  universityId: number;
  smallGroup: string;
  smallGroupId: number;
  latestAttendanceStatus: 'present' | 'absent' | 'excuse';
  totalAttendanceDays: number;
  totalDaysAttended: number;
  attendanceRate: number;
  dailyActiveDays: number;
  lastAttendanceDate: string;
  memberSince: string;
  designation?: string;
}

interface MemberLevelTableProps {
  data: MemberData[];
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
  loadingDates = false
}: MemberLevelTableProps) {
  
  const tableData = useMemo(() => {
    return data.map(item => ({
      memberId: item.memberId,
      memberName: item.memberName,
      region: item.region,
      regionId: item.regionId,
      university: item.university,
      universityId: item.universityId,
      smallGroup: item.smallGroup,
      smallGroupId: item.smallGroupId,
      latestAttendanceStatus: item.latestAttendanceStatus,
      totalAttendanceDays: item.totalAttendanceDays,
      totalDaysAttended: item.totalDaysAttended,
      attendanceRate: item.attendanceRate,
      dailyActiveDays: item.dailyActiveDays,
      lastAttendanceDate: item.lastAttendanceDate,
      memberSince: item.memberSince,
    }));
  }, [data]);

  const columns = [
    {
      key: 'memberName',
      label: 'MEMBER NAME',
      type: 'text' as const,
      sortable: true,
      width: '200px'
    },
    {
      key: 'latestAttendanceStatus',
      label: 'LATEST STATUS',
      type: 'status' as const,
      sortable: true,
      width: '130px'
    },
    {
      key: 'totalDaysAttended',
      label: 'DAYS ATTENDED',
      type: 'comparison' as const,
      sortable: true,
      width: '150px'
    },
    {
      key: 'attendanceRate',
      label: 'ATTENDANCE RATE',
      type: 'percentage' as const,
      sortable: true,
      width: '150px'
    },
    {
      key: 'dailyActiveDays',
      label: 'DAILY ACTIVE',
      type: 'number' as const,
      sortable: true,
      width: '130px'
    },
    {
      key: 'lastAttendanceDate',
      label: 'LAST ATTENDANCE',
      type: 'date' as const,
      sortable: true,
      width: '150px'
    },
    {
      key: 'memberSince',
      label: 'MEMBER SINCE',
      type: 'date' as const,
      sortable: true,
      width: '150px'
    }
  ];

  return (
    <PowerBITable
      title="Member University Ministry Attendance Overview"
      description="Individual member attendance in university ministry activities - Bible study, discipleship, campus life participation"
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
    />
  );
}
