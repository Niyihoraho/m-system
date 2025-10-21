"use client";

import React, { useMemo } from 'react';
import { EnhancedPowerBITable } from './enhanced-power-bi-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface EngagementAnalyticsData {
  region?: string;
  university?: string;
  smallGroup?: string;
  totalEngagement: number;
  previousPeriodEngagement: number;
  eventAttendance: number;
  previousPeriodEventAttendance: number;
  designationParticipation: number;
  previousPeriodDesignationParticipation: number;
  engagementRate: number;
  previousPeriodEngagementRate: number;
  averageAttendancePerEvent: number;
  previousPeriodAverageAttendancePerEvent: number;
  totalEvents: number;
  previousPeriodTotalEvents: number;
  totalDesignations: number;
  previousPeriodTotalDesignations: number;
}

interface EngagementAnalyticsTableProps {
  data: EngagementAnalyticsData[];
  loading?: boolean;
  onExport?: () => void;
  onRowClick?: (rowData: any) => void;
  title?: string;
  description?: string;
  selectedEvent?: string;
  onEventChange?: (value: string) => void;
  events?: Array<{id: number; name: string; type: string}>;
  loadingEvents?: boolean;
}

export function EngagementAnalyticsTable({ 
  data, 
  loading = false, 
  onExport,
  onRowClick,
  title = "National Student Participation Overview",
  description = "See how students across all regions are participating in ministry events and activities",
  selectedEvent = "all",
  onEventChange,
  events = [],
  loadingEvents = false
}: EngagementAnalyticsTableProps) {
  
  const tableData = useMemo(() => {
    console.log('🔍 EngagementAnalyticsTable received data:', {
      dataLength: data.length,
      data: data,
      selectedEvent
    });
    
    return data.map(item => ({
      region: item.region || 'All Regions',
      university: item.university || 'All Universities',
      smallGroup: item.smallGroup || 'All Small Groups',
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
      designationParticipation: {
        current: item.designationParticipation,
        previous: item.previousPeriodDesignationParticipation,
        change: item.designationParticipation - item.previousPeriodDesignationParticipation
      },
      engagementRate: {
        current: item.engagementRate,
        previous: item.previousPeriodEngagementRate,
        change: item.engagementRate - item.previousPeriodEngagementRate
      },
      averageAttendancePerEvent: {
        current: item.averageAttendancePerEvent,
        previous: item.previousPeriodAverageAttendancePerEvent,
        change: item.averageAttendancePerEvent - item.previousPeriodAverageAttendancePerEvent
      },
      totalEvents: {
        current: item.totalEvents,
        previous: item.previousPeriodTotalEvents,
        change: item.totalEvents - item.previousPeriodTotalEvents
      },
      totalDesignations: {
        current: item.totalDesignations,
        previous: item.previousPeriodTotalDesignations,
        change: item.totalDesignations - item.previousPeriodTotalDesignations
      },
      engagementTrend: item.engagementRate - item.previousPeriodEngagementRate,
      eventEfficiency: item.totalEvents > 0 ? (item.eventAttendance / item.totalEvents) : 0,
      previousEventEfficiency: item.previousPeriodTotalEvents > 0 ? (item.previousPeriodEventAttendance / item.previousPeriodTotalEvents) : 0,
      eventEfficiencyTrend: (item.totalEvents > 0 ? (item.eventAttendance / item.totalEvents) : 0) - (item.previousPeriodTotalEvents > 0 ? (item.previousPeriodEventAttendance / item.previousPeriodTotalEvents) : 0),
      // Add progress data
      totalMembers: item.totalMembers || 0,
      participatingStudents: item.totalEngagement || 0,
      participationPercentage: item.totalMembers > 0 ? Math.round((item.totalEngagement / item.totalMembers) * 100) : 0,
      participationProgress: {
        capacity: item.totalMembers || 0,
        attendance: item.totalEngagement || 0,
        percentage: item.totalMembers > 0 ? Math.round((item.totalEngagement / item.totalMembers) * 100) : 0
      }
    }));
  }, [data]);

  const columns = [
    {
      key: 'region',
      label: 'REGION',
      type: 'text' as const,
      sortable: true,
      filterable: true,
      width: '150px'
    },
    {
      key: 'totalEngagement',
      label: 'STUDENTS PARTICIPATING',
      type: 'comparison' as const,
      sortable: true,
      align: 'right' as const,
      width: '180px'
    },
    {
      key: 'eventAttendance',
      label: 'EVENTS ATTENDED',
      type: 'comparison' as const,
      sortable: true,
      align: 'right' as const,
      width: '180px'
    },
    {
      key: 'engagementRate',
      label: 'PARTICIPATION RATE',
      type: 'comparison' as const,
      sortable: true,
      align: 'right' as const,
      width: '180px'
    },
    {
      key: 'engagementTrend',
      label: 'GROWTH TREND',
      type: 'indicator' as const,
      sortable: true,
      align: 'center' as const,
      width: '150px'
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
      title={title}
      description={description}
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
    />
  );
}

// Summary Cards Component for Engagement
export function EngagementSummaryCards({ data }: { data: EngagementAnalyticsData[] }) {
  const summary = useMemo(() => {
    const total = data.reduce((acc, item) => ({
      totalEngagement: acc.totalEngagement + item.totalEngagement,
      eventAttendance: acc.eventAttendance + item.eventAttendance,
      designationParticipation: acc.designationParticipation + item.designationParticipation,
      totalEvents: acc.totalEvents + item.totalEvents,
      totalDesignations: acc.totalDesignations + item.totalDesignations,
      previousTotalEngagement: acc.previousTotalEngagement + item.previousPeriodEngagement,
      previousEventAttendance: acc.previousEventAttendance + item.previousPeriodEventAttendance,
      previousDesignationParticipation: acc.previousDesignationParticipation + item.previousPeriodDesignationParticipation,
      previousTotalEvents: acc.previousTotalEvents + item.previousPeriodTotalEvents,
      previousTotalDesignations: acc.previousTotalDesignations + item.previousPeriodTotalDesignations,
      engagementRates: [...acc.engagementRates, item.engagementRate],
      averageAttendancePerEvents: [...acc.averageAttendancePerEvents, item.averageAttendancePerEvent]
    }), {
      totalEngagement: 0,
      eventAttendance: 0,
      designationParticipation: 0,
      totalEvents: 0,
      totalDesignations: 0,
      previousTotalEngagement: 0,
      previousEventAttendance: 0,
      previousDesignationParticipation: 0,
      previousTotalEvents: 0,
      previousTotalDesignations: 0,
      engagementRates: [] as number[],
      averageAttendancePerEvents: [] as number[]
    });

    const totalEngagementChange = total.totalEngagement - total.previousTotalEngagement;
    const totalEngagementPercent = total.previousTotalEngagement !== 0 ? (totalEngagementChange / total.previousTotalEngagement) * 100 : 0;

    const eventAttendanceChange = total.eventAttendance - total.previousEventAttendance;
    const eventAttendancePercent = total.previousEventAttendance !== 0 ? (eventAttendanceChange / total.previousEventAttendance) * 100 : 0;

    const designationParticipationChange = total.designationParticipation - total.previousDesignationParticipation;
    const designationParticipationPercent = total.previousDesignationParticipation !== 0 ? (designationParticipationChange / total.previousDesignationParticipation) * 100 : 0;

    const avgEngagementRate = total.engagementRates.length > 0 
      ? total.engagementRates.reduce((a, b) => a + b, 0) / total.engagementRates.length 
      : 0;

    const avgAttendancePerEvent = total.averageAttendancePerEvents.length > 0 
      ? total.averageAttendancePerEvents.reduce((a, b) => a + b, 0) / total.averageAttendancePerEvents.length 
      : 0;

    return {
      totalEngagement: total.totalEngagement,
      totalEngagementChange,
      totalEngagementPercent,
      eventAttendance: total.eventAttendance,
      eventAttendanceChange,
      eventAttendancePercent,
      designationParticipation: total.designationParticipation,
      designationParticipationChange,
      designationParticipationPercent,
      totalEvents: total.totalEvents,
      totalEventsChange: total.totalEvents - total.previousTotalEvents,
      totalEventsPercent: total.previousTotalEvents !== 0 ? ((total.totalEvents - total.previousTotalEvents) / total.previousTotalEvents) * 100 : 0,
      totalDesignations: total.totalDesignations,
      totalDesignationsChange: total.totalDesignations - total.previousTotalDesignations,
      totalDesignationsPercent: total.previousTotalDesignations !== 0 ? ((total.totalDesignations - total.previousTotalDesignations) / total.previousTotalDesignations) * 100 : 0,
      avgEngagementRate,
      avgAttendancePerEvent
    };
  }, [data]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {summary.totalEngagement.toLocaleString()}
              </p>
              <p className={`text-sm ${summary.totalEngagementPercent >= 0 ? 'text-green-500 dark:text-green-300' : 'text-red-500 dark:text-red-300'}`}>
                {summary.totalEngagementPercent >= 0 ? '+' : ''}{summary.totalEngagementPercent.toFixed(1)}% vs previous period
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <p className="text-sm font-medium text-blue-700 dark:text-blue-200 mt-2">Total Engagement</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {summary.eventAttendance.toLocaleString()}
              </p>
              <p className={`text-sm ${summary.eventAttendancePercent >= 0 ? 'text-green-500 dark:text-green-300' : 'text-red-500 dark:text-red-300'}`}>
                {summary.eventAttendancePercent >= 0 ? '+' : ''}{summary.eventAttendancePercent.toFixed(1)}% vs previous period
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <p className="text-sm font-medium text-green-700 dark:text-green-200 mt-2">Event Attendance</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {summary.designationParticipation.toLocaleString()}
              </p>
              <p className={`text-sm ${summary.designationParticipationPercent >= 0 ? 'text-green-500 dark:text-green-300' : 'text-red-500 dark:text-red-300'}`}>
                {summary.designationParticipationPercent >= 0 ? '+' : ''}{summary.designationParticipationPercent.toFixed(1)}% vs previous period
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
          </div>
          <p className="text-sm font-medium text-purple-700 dark:text-purple-200 mt-2">Designation Participation</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {summary.avgEngagementRate.toFixed(1)}%
              </p>
              <p className="text-sm text-yellow-500 dark:text-yellow-300">
                Average engagement rate
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <p className="text-sm font-medium text-yellow-700 dark:text-yellow-200 mt-2">Engagement Rate</p>
        </CardContent>
      </Card>
    </div>
  );
}
