"use client";

import React, { useMemo } from 'react';
import { PowerBITable } from './power-bi-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MembershipAnalyticsData {
  region?: string;
  university?: string;
  smallGroup?: string;
  totalMembers: number;
  previousPeriodMembers: number;
  newMembers: number;
  previousPeriodNewMembers: number;
  graduatedMembers: number;
  previousPeriodGraduatedMembers: number;
  retentionRate: number;
  previousPeriodRetentionRate: number;
  growthRate: number;
  previousPeriodGrowthRate: number;
  memberTypeDistribution: {
    students: number;
    graduates: number;
    alumni: number;
    staff: number;
    volunteers: number;
  };
}

interface MembershipAnalyticsTableProps {
  data: MembershipAnalyticsData[];
  loading?: boolean;
  onExport?: () => void;
  title?: string;
  description?: string;
}

export function MembershipAnalyticsTable({ 
  data, 
  loading = false, 
  onExport,
  title = "Membership Analytics Overview",
  description = "Comprehensive membership metrics with period-over-period comparisons"
}: MembershipAnalyticsTableProps) {
  
  const tableData = useMemo(() => {
    return data.map(item => ({
      region: item.region || 'All Regions',
      university: item.university || 'All Universities',
      smallGroup: item.smallGroup || 'All Small Groups',
      totalMembers: {
        current: item.totalMembers,
        previous: item.previousPeriodMembers,
        change: item.totalMembers - item.previousPeriodMembers
      },
      newMembers: {
        current: item.newMembers,
        previous: item.previousPeriodNewMembers,
        change: item.newMembers - item.previousPeriodNewMembers
      },
      graduatedMembers: {
        current: item.graduatedMembers,
        previous: item.previousPeriodGraduatedMembers,
        change: item.graduatedMembers - item.previousPeriodGraduatedMembers
      },
      netGrowth: {
        current: item.newMembers - item.graduatedMembers,
        previous: item.previousPeriodNewMembers - item.previousPeriodGraduatedMembers,
        change: (item.newMembers - item.graduatedMembers) - (item.previousPeriodNewMembers - item.previousPeriodGraduatedMembers)
      },
      retentionRate: {
        current: item.retentionRate,
        previous: item.previousPeriodRetentionRate,
        change: item.retentionRate - item.previousPeriodRetentionRate
      },
      growthRate: item.growthRate,
      previousGrowthRate: item.previousPeriodGrowthRate,
      growthTrend: item.growthRate - item.previousPeriodGrowthRate,
      memberTypeBreakdown: `${item.memberTypeDistribution.students} Students, ${item.memberTypeDistribution.graduates} Graduates, ${item.memberTypeDistribution.alumni} Alumni`,
      totalStudents: item.memberTypeDistribution.students,
      totalGraduates: item.memberTypeDistribution.graduates,
      totalAlumni: item.memberTypeDistribution.alumni,
      totalStaff: item.memberTypeDistribution.staff,
      totalVolunteers: item.memberTypeDistribution.volunteers
    }));
  }, [data]);

  const columns = [
    {
      key: 'region',
      label: 'Region',
      type: 'text' as const,
      sortable: true,
      filterable: true,
      width: '150px'
    },
    {
      key: 'totalMembers',
      label: 'Total Members',
      type: 'comparison' as const,
      sortable: true,
      align: 'right' as const,
      width: '180px'
    },
    {
      key: 'newMembers',
      label: 'New This Period',
      type: 'comparison' as const,
      sortable: true,
      align: 'right' as const,
      width: '180px'
    },
    {
      key: 'netGrowth',
      label: 'Net Growth',
      type: 'comparison' as const,
      sortable: true,
      align: 'right' as const,
      width: '180px'
    },
    {
      key: 'growthTrend',
      label: 'Growth Trend',
      type: 'indicator' as const,
      sortable: true,
      align: 'center' as const,
      width: '150px'
    }
  ];

  return (
    <PowerBITable
      title={title}
      description={description}
      columns={columns}
      data={tableData}
      loading={loading}
      onExport={onExport}
      className="w-full"
    />
  );
}

// Summary Cards Component
export function MembershipSummaryCards({ data }: { data: MembershipAnalyticsData[] }) {
  const summary = useMemo(() => {
    const total = data.reduce((acc, item) => ({
      totalMembers: acc.totalMembers + item.totalMembers,
      newMembers: acc.newMembers + item.newMembers,
      graduatedMembers: acc.graduatedMembers + item.graduatedMembers,
      previousTotalMembers: acc.previousTotalMembers + item.previousPeriodMembers,
      previousNewMembers: acc.previousNewMembers + item.previousPeriodNewMembers,
      previousGraduatedMembers: acc.previousGraduatedMembers + item.previousPeriodGraduatedMembers,
      retentionRates: [...acc.retentionRates, item.retentionRate],
      growthRates: [...acc.growthRates, item.growthRate]
    }), {
      totalMembers: 0,
      newMembers: 0,
      graduatedMembers: 0,
      previousTotalMembers: 0,
      previousNewMembers: 0,
      previousGraduatedMembers: 0,
      retentionRates: [] as number[],
      growthRates: [] as number[]
    });

    const netGrowth = summary.newMembers - summary.graduatedMembers;
    const previousNetGrowth = summary.previousNewMembers - summary.previousGraduatedMembers;
    const netGrowthChange = netGrowth - previousNetGrowth;
    const netGrowthPercent = summary.previousTotalMembers !== 0 ? (netGrowthChange / summary.previousTotalMembers) * 100 : 0;

    const avgRetentionRate = summary.retentionRates.length > 0 
      ? summary.retentionRates.reduce((a, b) => a + b, 0) / summary.retentionRates.length 
      : 0;

    const avgGrowthRate = summary.growthRates.length > 0 
      ? summary.growthRates.reduce((a, b) => a + b, 0) / summary.growthRates.length 
      : 0;

    return {
      totalMembers: summary.totalMembers,
      totalMembersChange: summary.totalMembers - summary.previousTotalMembers,
      totalMembersPercent: summary.previousTotalMembers !== 0 ? ((summary.totalMembers - summary.previousTotalMembers) / summary.previousTotalMembers) * 100 : 0,
      newMembers: summary.newMembers,
      newMembersChange: summary.newMembers - summary.previousNewMembers,
      newMembersPercent: summary.previousNewMembers !== 0 ? ((summary.newMembers - summary.previousNewMembers) / summary.previousNewMembers) * 100 : 0,
      graduatedMembers: summary.graduatedMembers,
      graduatedMembersChange: summary.graduatedMembers - summary.previousGraduatedMembers,
      graduatedMembersPercent: summary.previousGraduatedMembers !== 0 ? ((summary.graduatedMembers - summary.previousGraduatedMembers) / summary.previousGraduatedMembers) * 100 : 0,
      netGrowth,
      netGrowthChange,
      netGrowthPercent,
      avgRetentionRate,
      avgGrowthRate
    };
  }, [data]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {summary.totalMembers.toLocaleString()}
              </p>
              <p className={`text-sm ${summary.totalMembersPercent >= 0 ? 'text-green-500 dark:text-green-300' : 'text-red-500 dark:text-red-300'}`}>
                {summary.totalMembersPercent >= 0 ? '+' : ''}{summary.totalMembersPercent.toFixed(1)}% vs previous period
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <p className="text-sm font-medium text-blue-700 dark:text-blue-200 mt-2">Total Members</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {summary.newMembers.toLocaleString()}
              </p>
              <p className={`text-sm ${summary.newMembersPercent >= 0 ? 'text-green-500 dark:text-green-300' : 'text-red-500 dark:text-red-300'}`}>
                {summary.newMembersPercent >= 0 ? '+' : ''}{summary.newMembersPercent.toFixed(1)}% vs previous period
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <p className="text-sm font-medium text-green-700 dark:text-green-200 mt-2">New Members</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {summary.graduatedMembers.toLocaleString()}
              </p>
              <p className={`text-sm ${summary.graduatedMembersPercent >= 0 ? 'text-green-500 dark:text-green-300' : 'text-red-500 dark:text-red-300'}`}>
                {summary.graduatedMembersPercent >= 0 ? '+' : ''}{summary.graduatedMembersPercent.toFixed(1)}% vs previous period
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
          </div>
          <p className="text-sm font-medium text-purple-700 dark:text-purple-200 mt-2">Graduated Members</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-2xl font-bold ${summary.netGrowthPercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {summary.netGrowth >= 0 ? '+' : ''}{summary.netGrowth.toLocaleString()}
              </p>
              <p className={`text-sm ${summary.netGrowthPercent >= 0 ? 'text-green-500 dark:text-green-300' : 'text-red-500 dark:text-red-300'}`}>
                {summary.netGrowthPercent >= 0 ? '+' : ''}{summary.netGrowthPercent.toFixed(1)}% vs previous period
              </p>
            </div>
            <div className={`p-3 rounded-full ${summary.netGrowthPercent >= 0 ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
              {summary.netGrowthPercent >= 0 ? (
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              )}
            </div>
          </div>
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-200 mt-2">Net Growth</p>
        </CardContent>
      </Card>
    </div>
  );
}
