"use client";

import React, { useMemo } from 'react';
// Date filter support added
import { EnhancedPowerBITable } from './enhanced-power-bi-table';

interface UniversityData {
  region: string;
  regionId: number;
  university: string;
  universityId: number;
  smallGroup: string;
  smallGroupId: number;
  totalEngagement: number;
  previousPeriodEngagement: number;
  eventAttendance: number;
  previousPeriodEventAttendance: number;
  engagementRate: number;
  previousPeriodEngagementRate: number;
  engagementTrend: number;
  totalEvents: number;
  previousPeriodTotalEvents: number;
  totalDesignations: number;
  previousPeriodTotalDesignations: number;
  totalMembers: number;
}

interface UniversityLevelTableProps {
  data: UniversityData[];
  loading?: boolean;
  onExport?: () => void;
  onRowClick?: (rowData: any) => void;
  selectedEvent?: string;
  onEventChange?: (value: string) => void;
  events?: Array<{id: number; name: string; type: string}>;
  loadingEvents?: boolean;
  selectedDate?: string;
  onDateChange?: (value: string) => void;
  availableDates?: Array<Date>;
  loadingDates?: boolean;
}

export function UniversityLevelTable({ 
  data, 
  loading = false, 
  onExport,
  onRowClick,
  selectedEvent = "all",
  onEventChange,
  events = [],
  loadingEvents = false,
  selectedDate = "",
  onDateChange,
  availableDates = [],
  loadingDates = false
}: UniversityLevelTableProps) {
  
  const tableData = useMemo(() => {
    return data.map(item => ({
      smallGroup: item.smallGroup,
      smallGroupId: item.smallGroupId,
      university: item.university,
      universityId: item.universityId,
      region: item.region,
      regionId: item.regionId,
      totalEngagement: {
        current: item.totalEngagement,
        previous: item.previousPeriodEngagement,
        change: item.totalEngagement - item.previousPeriodEngagement
      },
      eventAttendance: {
        current: item.eventAttendance,
        previous: item.previousPeriodEventAttendance,
        change: item.eventAttendance - item.previousPeriodEventAttendance
      },
      engagementRate: {
        current: item.engagementRate,
        previous: item.previousPeriodEngagementRate,
        change: item.engagementRate - item.previousPeriodEngagementRate
      },
      // Add progress data
      participationProgress: {
        capacity: item.totalMembers || 0,
        attendance: item.totalEngagement || 0,
        percentage: item.totalMembers > 0 ? Math.round((item.totalEngagement / item.totalMembers) * 100) : 0
      }
    }));
  }, [data]);

  const columns = [
    {
      key: 'smallGroup',
      label: 'SMALL GROUP',
      type: 'text' as const,
      sortable: true,
      width: '250px'
    },
    {
      key: 'totalEngagement',
      label: 'STUDENTS PARTICIPATING',
      type: 'comparison' as const,
      sortable: true,
      width: '180px'
    },
    {
      key: 'eventAttendance',
      label: 'EVENTS ATTENDED',
      type: 'comparison' as const,
      sortable: true,
      width: '180px'
    },
    {
      key: 'engagementRate',
      label: 'PARTICIPATION RATE',
      type: 'comparison' as const,
      sortable: true,
      width: '180px'
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

  return (
    <EnhancedPowerBITable
      title="Small Group Student Participation Overview"
      description="See how students in each small group are participating in ministry events - Click on a small group to view individual members"
      columns={columns}
      data={tableData}
      loading={loading}
      onExport={onExport}
      onRowClick={onRowClick}
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
