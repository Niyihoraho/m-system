import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserScope, getTableRLSConditions } from "@/lib/rls";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get user scope for RLS
    const userScope = await getUserScope();
    if (!userScope) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Parse query parameters
    const eventType = searchParams.get("eventType") || "all";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const regionId = searchParams.get("regionId");
    const universityId = searchParams.get("universityId");
    const smallGroupId = searchParams.get("smallGroupId");
    const alumniGroupId = searchParams.get("alumniGroupId");
    
    // Build member where clause - simplified approach
    const memberWhere: any = {};
    
    // Apply RLS conditions
    const memberRLSConditions = getTableRLSConditions(userScope, 'member');
    Object.assign(memberWhere, memberRLSConditions);
    
    // Override with explicit filters for super admin
    if (userScope.scope === 'superadmin') {
      const hasExplicitFilters = (regionId && regionId !== "all") || 
        (universityId && universityId !== "all") || 
        (smallGroupId && smallGroupId !== "all") || 
        (alumniGroupId && alumniGroupId !== "all");
      
      if (hasExplicitFilters) {
        // Clear existing conditions
        Object.keys(memberWhere).forEach(key => delete memberWhere[key]);
        
        if (regionId && regionId !== "all") {
          memberWhere.regionId = parseInt(regionId);
        }
        if (universityId && universityId !== "all") {
          memberWhere.universityId = parseInt(universityId);
        }
        if (smallGroupId && smallGroupId !== "all") {
          memberWhere.smallGroupId = parseInt(smallGroupId);
        }
        if (alumniGroupId && alumniGroupId !== "all") {
          memberWhere.alumniGroupId = parseInt(alumniGroupId);
        }
      }
    }
    
    // Build attendance where clause
    const attendanceWhere: any = {};
    
    // Event type filter
    if (eventType !== "all") {
      if (eventType === "permanent") {
        attendanceWhere.permanentEventId = { not: null };
      } else if (eventType === "training") {
        attendanceWhere.trainingId = { not: null };
      }
    }
    
    // Date filtering
    if (dateFrom || dateTo) {
      attendanceWhere.recordedAt = {};
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        attendanceWhere.recordedAt.gte = fromDate;
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        attendanceWhere.recordedAt.lte = toDate;
      }
    }
    
    // Get members first (simplified query)
    const members = await prisma.member.findMany({
      where: memberWhere,
      include: {
        region: { select: { name: true } },
        university: { select: { name: true } },
        smallgroup: { select: { name: true } },
        alumnismallgroup: { select: { name: true } }
      },
      orderBy: { firstname: 'asc' }
    });
    
    // Get attendance records separately to avoid complex nested queries
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        memberId: { in: members.map(m => m.id) },
        ...attendanceWhere
      },
      include: {
        permanentministryevent: { select: { name: true, type: true } },
        trainings: { select: { name: true, description: true } }
      },
      orderBy: { recordedAt: 'desc' }
    });
    
    // Group attendance by member
    const attendanceByMember = attendanceRecords.reduce((acc, record) => {
      if (!acc[record.memberId]) {
        acc[record.memberId] = [];
      }
      acc[record.memberId].push(record);
      return acc;
    }, {} as Record<number, any[]>);
    
    // Calculate overall statistics
    let totalCapacity = 0;
    let totalAttendance = 0;
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalExcused = 0;
    
    // Get all active events to calculate capacity
    let activeEvents = [];
    let activeTrainings = [];
    
    try {
      activeEvents = await prisma.permanentministryevent.findMany({
        where: {
          isActive: true,
          ...(dateFrom && dateTo ? {
            createdAt: {
              gte: new Date(dateFrom),
              lte: new Date(dateTo)
            }
          } : {})
        },
        select: { id: true, name: true, createdAt: true }
      });
    } catch (error) {
      console.error('Error fetching active events:', error);
      activeEvents = [];
    }
    
    try {
      activeTrainings = await prisma.trainings.findMany({
        where: {
          ...(dateFrom && dateTo ? {
            startDateTime: {
              gte: new Date(dateFrom),
              lte: new Date(dateTo)
            }
          } : {})
        },
        select: { id: true, name: true, startDateTime: true }
      });
    } catch (error) {
      console.error('Error fetching active trainings:', error);
      activeTrainings = [];
    }
    
    // Calculate capacity based on active events and member count
    totalCapacity = members.length * (activeEvents.length + activeTrainings.length);
    
    // Process member data and calculate individual statistics
    const studentAnalytics = members.map(member => {
      const memberAttendance = attendanceByMember[member.id] || [];
      const totalDays = memberAttendance.length;
      const presentDays = memberAttendance.filter(a => a.status === 'present').length;
      const absentDays = memberAttendance.filter(a => a.status === 'absent').length;
      const excusedDays = memberAttendance.filter(a => a.status === 'excused').length;
      
      // Calculate attendance rate
      const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
      
      // Calculate individual capacity (member count * events they could attend)
      const memberCapacity = activeEvents.length + activeTrainings.length;
      
      // Add to overall totals
      totalAttendance += totalDays;
      totalPresent += presentDays;
      totalAbsent += absentDays;
      totalExcused += excusedDays;
      
      return {
        memberId: member.id,
        memberName: `${member.firstname || ''} ${member.secondname || ''}`.trim() || 'Unknown Member',
        email: member.email,
        phone: member.phone,
        region: member.region?.name || 'N/A',
        university: member.university?.name || 'N/A',
        smallGroup: member.smallgroup?.name || 'N/A',
        alumniGroup: member.alumnismallgroup?.name || 'N/A',
        status: member.status,
        memberSince: member.createdAt,
        
        // Individual statistics
        totalDays,
        presentDays,
        absentDays,
        excusedDays,
        attendanceRate,
        memberCapacity,
        
        // Recent attendance
        lastAttendanceDate: memberAttendance[0]?.recordedAt || null,
        lastAttendanceStatus: memberAttendance[0]?.status || 'absent',
        lastEventName: memberAttendance[0]?.permanentministryevent?.name || 
                      memberAttendance[0]?.trainings?.name || 'N/A',
        
        // Attendance breakdown by event type
        permanentEventsAttended: memberAttendance.filter(a => a.permanentEventId).length,
        trainingEventsAttended: memberAttendance.filter(a => a.trainingId).length,
        
        // Monthly attendance trend (last 6 months)
        monthlyAttendance: getMonthlyAttendanceTrend(memberAttendance)
      };
    });
    
    // Calculate overall attendance rate
    const overallAttendanceRate = totalAttendance > 0 ? Math.round((totalPresent / totalAttendance) * 100) : 0;
    
    // Get event type distribution
    let eventTypeDistribution = { permanent: { count: 0, percentage: 0 }, training: { count: 0, percentage: 0 }, total: 0 };
    try {
      eventTypeDistribution = await getEventTypeDistribution(attendanceWhere);
    } catch (error) {
      console.error('Error getting event type distribution:', error);
    }
    
    // Get monthly trends
    let monthlyTrends = [];
    try {
      monthlyTrends = await getMonthlyTrends(attendanceWhere);
    } catch (error) {
      console.error('Error getting monthly trends:', error);
    }
    
    return NextResponse.json({
      overallStats: {
        totalMembers: members.length,
        totalCapacity,
        totalAttendance,
        totalPresent,
        totalAbsent,
        totalExcused,
        overallAttendanceRate,
        activeEventsCount: activeEvents.length,
        activeTrainingsCount: activeTrainings.length
      },
      studentAnalytics,
      eventTypeDistribution,
      monthlyTrends,
      filters: {
        eventType,
        dateFrom,
        dateTo,
        regionId,
        universityId,
        smallGroupId,
        alumniGroupId
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error("Error fetching student attendance analytics:", error);
    return NextResponse.json({ 
      error: 'Failed to fetch student attendance analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper function to get monthly attendance trend for a member
function getMonthlyAttendanceTrend(attendance: any[]) {
  const monthlyData: { [key: string]: { present: number; total: number } } = {};
  
  attendance.forEach(record => {
    const month = record.recordedAt.toISOString().substring(0, 7); // YYYY-MM format
    
    if (!monthlyData[month]) {
      monthlyData[month] = { present: 0, total: 0 };
    }
    
    monthlyData[month].total++;
    if (record.status === 'present') {
      monthlyData[month].present++;
    }
  });
  
  // Convert to array format and sort by month
  return Object.entries(monthlyData)
    .map(([month, data]) => ({
      month,
      present: data.present,
      total: data.total,
      rate: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0
    }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6); // Last 6 months
}

// Helper function to get event type distribution
async function getEventTypeDistribution(attendanceWhere: any) {
  const permanentEvents = await prisma.attendance.count({
    where: {
      ...attendanceWhere,
      permanentEventId: { not: null }
    }
  });
  
  const trainingEvents = await prisma.attendance.count({
    where: {
      ...attendanceWhere,
      trainingId: { not: null }
    }
  });
  
  const total = permanentEvents + trainingEvents;
  
  return {
    permanent: {
      count: permanentEvents,
      percentage: total > 0 ? Math.round((permanentEvents / total) * 100) : 0
    },
    training: {
      count: trainingEvents,
      percentage: total > 0 ? Math.round((trainingEvents / total) * 100) : 0
    },
    total
  };
}

// Helper function to get monthly trends
async function getMonthlyTrends(attendanceWhere: any) {
  const monthlyData = await prisma.$queryRaw`
    SELECT 
      DATE_FORMAT(recordedAt, '%Y-%m-01') as month,
      COUNT(*) as total_attendance,
      COUNT(CASE WHEN status = 'present' THEN 1 END) as present_attendance,
      COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_attendance,
      COUNT(CASE WHEN status = 'excused' THEN 1 END) as excused_attendance
    FROM attendance
    WHERE recordedAt >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
    ${attendanceWhere.recordedAt ? 
      `AND recordedAt >= ${attendanceWhere.recordedAt.gte || new Date('2020-01-01')}
       AND recordedAt <= ${attendanceWhere.recordedAt.lte || new Date()}` : ''}
    GROUP BY DATE_FORMAT(recordedAt, '%Y-%m-01')
    ORDER BY month DESC
    LIMIT 12
  `;
  
  return monthlyData.map((row: any) => ({
    month: row.month.toISOString().substring(0, 7),
    total: parseInt(row.total_attendance),
    present: parseInt(row.present_attendance),
    absent: parseInt(row.absent_attendance),
    excused: parseInt(row.excused_attendance),
    rate: parseInt(row.total_attendance) > 0 ? 
      Math.round((parseInt(row.present_attendance) / parseInt(row.total_attendance)) * 100) : 0
  }));
}
