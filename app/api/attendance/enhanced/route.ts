import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserScope, getTableRLSConditions } from "@/lib/rls";
import { NotificationService } from "@/lib/notification-service";
import { z } from "zod";

// Enhanced validation schemas
const attendanceRecordSchema = z.object({
  memberId: z.number().int().positive(),
  status: z.enum(['present', 'absent', 'excused']),
  permanentEventId: z.number().int().positive().optional(),
  trainingId: z.number().int().positive().optional(),
  notes: z.string().max(500).optional(),
}).refine(data => data.permanentEventId || data.trainingId, {
  message: "Either permanentEventId or trainingId is required"
});

const bulkAttendanceSchema = z.object({
  eventId: z.number().int().positive(),
  eventType: z.enum(['permanent', 'training']),
  attendance: z.array(z.object({
    memberId: z.number().int().positive(),
    status: z.enum(['present', 'absent', 'excused']),
    notes: z.string().max(500).optional(),
  })),
  date: z.string().optional(), // Optional custom date
});

// Enhanced GET endpoint with better filtering and performance
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get user scope for RLS
    const userScope = await getUserScope();
    if (!userScope) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Parse query parameters
    const eventId = searchParams.get("eventId");
    const status = searchParams.get("status");
    const dateRange = searchParams.get("dateRange");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const includeStats = searchParams.get("includeStats") === "true";
    
    // Build where clause
    const where: any = {};
    
    // Event filter
    if (eventId && eventId !== "all") {
      where.OR = [
        { permanentEventId: parseInt(eventId) },
        { trainingId: parseInt(eventId) }
      ];
    }
    
    // Status filter
    if (status && status !== "all") {
      where.status = status;
    }
    
    // Date filtering with enhanced logic
    if (dateRange || dateFrom || dateTo) {
      where.recordedAt = {};
      
      if (dateRange && dateRange !== "all") {
        const { startDate, endDate } = getDateRange(dateRange);
        where.recordedAt.gte = startDate;
        where.recordedAt.lte = endDate;
      } else {
        if (dateFrom) {
          const fromDate = new Date(dateFrom);
          fromDate.setHours(0, 0, 0, 0);
          where.recordedAt.gte = fromDate;
        }
        if (dateTo) {
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999);
          where.recordedAt.lte = toDate;
        }
      }
    }
    
    // Apply RLS conditions
    const memberRLSConditions = getTableRLSConditions(userScope, 'member');
    where.member = { ...memberRLSConditions };
    
    // Override with explicit filters for super admin
    if (userScope.scope === 'superadmin') {
      const regionId = searchParams.get("regionId");
      const universityId = searchParams.get("universityId");
      const smallGroupId = searchParams.get("smallGroupId");
      const alumniGroupId = searchParams.get("alumniGroupId");
      
      const hasExplicitFilters = (regionId && regionId !== "all") || 
        (universityId && universityId !== "all") || 
        (smallGroupId && smallGroupId !== "all") || 
        (alumniGroupId && alumniGroupId !== "all");
      
      if (hasExplicitFilters) {
        where.member = {};
        
        if (regionId && regionId !== "all") {
          where.member.regionId = parseInt(regionId);
        }
        if (universityId && universityId !== "all") {
          where.member.universityId = parseInt(universityId);
        }
        if (smallGroupId && smallGroupId !== "all") {
          where.member.smallGroupId = parseInt(smallGroupId);
        }
        if (alumniGroupId && alumniGroupId !== "all") {
          where.member.alumniGroupId = parseInt(alumniGroupId);
        }
      }
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get total count for pagination
    const totalCount = await prisma.attendance.count({ where });
    
    // Fetch attendance records with enhanced includes
    const attendanceRecords = await prisma.attendance.findMany({
      where,
      include: {
        member: {
          select: {
            id: true,
            firstname: true,
            secondname: true,
            email: true,
            phone: true,
            type: true,
            status: true,
            regionId: true,
            universityId: true,
            smallGroupId: true,
            alumniGroupId: true,
            region: { select: { name: true } },
            university: { select: { name: true } },
            smallgroup: { select: { name: true } },
            alumnismallgroup: { select: { name: true } }
          }
        },
        permanentministryevent: { 
          select: { 
            id: true, 
            name: true, 
            type: true 
          } 
        },
        trainings: { 
          select: { 
            id: true, 
            name: true, 
            description: true,
            startDateTime: true,
            endDateTime: true
          } 
        }
      },
      orderBy: { recordedAt: 'desc' },
      skip,
      take: limit
    });
    
    // Apply search filter if provided
    let filteredRecords = attendanceRecords;
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredRecords = attendanceRecords.filter(record =>
        record.member.firstname?.toLowerCase().includes(searchTerm) ||
        record.member.secondname?.toLowerCase().includes(searchTerm) ||
        record.member.email?.toLowerCase().includes(searchTerm) ||
        record.permanentministryevent?.name?.toLowerCase().includes(searchTerm) ||
        record.trainings?.name?.toLowerCase().includes(searchTerm)
      );
    }
    
    // Calculate statistics if requested
    let stats = null;
    if (includeStats) {
      const allRecords = await prisma.attendance.findMany({
        where,
        select: { status: true }
      });
      
      const total = allRecords.length;
      const present = allRecords.filter(r => r.status === 'present').length;
      const absent = allRecords.filter(r => r.status === 'absent').length;
      const excused = allRecords.filter(r => r.status === 'excused').length;
      const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;
      
      stats = {
        total,
        present,
        absent,
        excused,
        attendanceRate,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page
      };
    }
    
    // Format response
    const response = {
      records: filteredRecords,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      }
    };
    
    if (stats) {
      response.stats = stats;
    }
    
    return NextResponse.json(response, { status: 200 });
    
  } catch (error) {
    console.error("Error fetching attendance records:", error);
    return NextResponse.json({ 
      error: 'Failed to fetch attendance records',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Enhanced POST endpoint with bulk operations support
export async function POST(request: NextRequest) {
  try {
    const userScope = await getUserScope();
    if (!userScope) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await request.json();
    
    // Check if it's a bulk operation
    if (body.eventId && body.eventType && body.attendance) {
      return handleBulkAttendance(userScope, body);
    }
    
    // Handle individual records (legacy support)
    if (Array.isArray(body)) {
      return handleIndividualRecords(userScope, body);
    }
    
    return NextResponse.json({ 
      error: "Invalid request format. Expected bulk attendance or array of records." 
    }, { status: 400 });
    
  } catch (error) {
    console.error("Error creating attendance records:", error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Handle bulk attendance submission
async function handleBulkAttendance(userScope: any, data: any) {
  try {
    // Validate bulk data
    const validation = bulkAttendanceSchema.safeParse(data);
    if (!validation.success) {
      return NextResponse.json({
        error: "Invalid bulk attendance data",
        details: validation.error.flatten().fieldErrors
      }, { status: 400 });
    }
    
    const { eventId, eventType, attendance, date } = validation.data;
    
    // Verify event exists and user has access
    let event;
    if (eventType === 'permanent') {
      event = await prisma.permanentministryevent.findUnique({
        where: { id: eventId }
      });
    } else {
      event = await prisma.trainings.findUnique({
        where: { id: eventId }
      });
    }
    
    if (!event) {
      return NextResponse.json({ 
        error: "Event not found" 
      }, { status: 404 });
    }
    
    // Check user access to event
    const eventRLSConditions = getTableRLSConditions(userScope, eventType === 'permanent' ? 'permanentministryevent' : 'trainings');
    const hasEventAccess = Object.keys(eventRLSConditions).every(key => {
      if (eventRLSConditions[key] === null || eventRLSConditions[key] === undefined) return true;
      return event[key] === eventRLSConditions[key];
    });
    
    if (!hasEventAccess) {
      return NextResponse.json({ 
        error: "Access denied to event" 
      }, { status: 403 });
    }
    
    // Process attendance records
    const results = [];
    const recordDate = date ? new Date(date) : new Date();
    
    for (const record of attendance) {
      try {
        // Verify member exists and user has access
        const member = await prisma.member.findUnique({
          where: { id: record.memberId }
        });
        
        if (!member) {
          results.push({ 
            success: false, 
            memberId: record.memberId, 
            error: "Member not found" 
          });
          continue;
        }
        
        // Check member access
        const memberRLSConditions = getTableRLSConditions(userScope, 'member');
        const hasMemberAccess = Object.keys(memberRLSConditions).every(key => {
          if (memberRLSConditions[key] === null || memberRLSConditions[key] === undefined) return true;
          return member[key] === memberRLSConditions[key];
        });
        
        if (!hasMemberAccess) {
          results.push({ 
            success: false, 
            memberId: record.memberId, 
            error: "Access denied to member" 
          });
          continue;
        }
        
        // Create attendance record
        const attendanceData: any = {
          memberId: record.memberId,
          status: record.status,
          recordedAt: recordDate,
          notes: record.notes || null,
        };
        
        if (eventType === 'permanent') {
          attendanceData.permanentEventId = eventId;
        } else {
          attendanceData.trainingId = eventId;
        }
        
        const created = await prisma.attendance.create({
          data: attendanceData,
          include: {
            member: { select: { firstname: true, secondname: true } },
            permanentministryevent: { select: { name: true } },
            trainings: { select: { name: true } }
          }
        });
        
        results.push({ 
          success: true, 
          memberId: record.memberId, 
          data: created 
        });
        
      } catch (error: any) {
        let errorMessage = "Could not create attendance record";
        
        if (error.code === 'P2002') {
          errorMessage = "Attendance already recorded for this member and event";
        } else if (error.code === 'P2003') {
          errorMessage = "Invalid member or event reference";
        }
        
        results.push({ 
          success: false, 
          memberId: record.memberId, 
          error: errorMessage 
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    // Send notifications for absent members (only if there are absent members)
    const absentMembers = attendance.filter(a => a.status === 'absent');
    if (absentMembers.length > 0) {
      try {
        await sendAttendanceNotifications(eventId, eventType, absentMembers, recordDate);
      } catch (notificationError) {
        console.error('Error sending attendance notifications:', notificationError);
        // Don't fail the entire request if notifications fail
      }
    }
    
    return NextResponse.json({
      success: failureCount === 0,
      message: `Processed ${attendance.length} records: ${successCount} successful, ${failureCount} failed`,
      results,
      summary: {
        total: attendance.length,
        successful: successCount,
        failed: failureCount
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error("Error in bulk attendance:", error);
    return NextResponse.json({ 
      error: 'Failed to process bulk attendance',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Handle individual records (legacy support)
async function handleIndividualRecords(userScope: any, records: any[]) {
  const results = [];
  
  for (const record of records) {
    try {
      const validation = attendanceRecordSchema.safeParse(record);
      if (!validation.success) {
        results.push({ 
          success: false, 
          error: "Invalid record format", 
          details: validation.error.flatten().fieldErrors,
          data: record 
        });
        continue;
      }
      
      const { memberId, status, permanentEventId, trainingId, notes } = validation.data;
      
      // Verify member exists and user has access
      const member = await prisma.member.findUnique({
        where: { id: memberId }
      });
      
      if (!member) {
        results.push({ 
          success: false, 
          error: "Member not found", 
          data: record 
        });
        continue;
      }
      
      // Check member access
      const memberRLSConditions = getTableRLSConditions(userScope, 'member');
      const hasMemberAccess = Object.keys(memberRLSConditions).every(key => {
        if (memberRLSConditions[key] === null || memberRLSConditions[key] === undefined) return true;
        return member[key] === memberRLSConditions[key];
      });
      
      if (!hasMemberAccess) {
        results.push({ 
          success: false, 
          error: "Access denied to member", 
          data: record 
        });
        continue;
      }
      
      // Verify event exists and user has access
      if (permanentEventId) {
        const event = await prisma.permanentministryevent.findUnique({
          where: { id: permanentEventId }
        });
        
        if (!event) {
          results.push({ 
            success: false, 
            error: "Event not found", 
            data: record 
          });
          continue;
        }
        
        const eventRLSConditions = getTableRLSConditions(userScope, 'permanentministryevent');
        const hasEventAccess = Object.keys(eventRLSConditions).every(key => {
          if (eventRLSConditions[key] === null || eventRLSConditions[key] === undefined) return true;
          return event[key] === eventRLSConditions[key];
        });
        
        if (!hasEventAccess) {
          results.push({ 
            success: false, 
            error: "Access denied to event", 
            data: record 
          });
          continue;
        }
      }
      
      if (trainingId) {
        const training = await prisma.trainings.findUnique({
          where: { id: trainingId }
        });
        
        if (!training) {
          results.push({ 
            success: false, 
            error: "Training not found", 
            data: record 
          });
          continue;
        }
      }
      
      // Create attendance record
      const attendanceData: any = {
        memberId,
        status,
        notes: notes || null,
      };
      
      if (permanentEventId) attendanceData.permanentEventId = permanentEventId;
      if (trainingId) attendanceData.trainingId = trainingId;
      
      const created = await prisma.attendance.create({
        data: attendanceData,
      });
      
      results.push({ 
        success: true, 
        data: created 
      });
      
    } catch (error: any) {
      let errorMessage = "Could not create attendance record";
      
      if (error.code === 'P2002') {
        errorMessage = "Attendance already recorded for this member and event";
      } else if (error.code === 'P2003') {
        errorMessage = "Invalid member or event reference";
      }
      
      results.push({ 
        success: false, 
        error: errorMessage, 
        data: record 
      });
    }
  }
  
  return NextResponse.json({ results }, { status: 201 });
}

// Enhanced PUT endpoint
export async function PUT(request: NextRequest) {
  try {
    const userScope = await getUserScope();
    if (!userScope) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const attendanceId = searchParams.get("id");

    if (!attendanceId) {
      return NextResponse.json({ 
        error: "Attendance ID is required" 
      }, { status: 400 });
    }

    const body = await request.json();
    const { status, notes } = body;

    if (!status || !['present', 'absent', 'excused'].includes(status)) {
      return NextResponse.json({ 
        error: "Valid status (present, absent, excused) is required" 
      }, { status: 400 });
    }

    // Check if attendance record exists and user has access
    const existingAttendance = await prisma.attendance.findUnique({
      where: { id: parseInt(attendanceId) },
      include: {
        member: { 
          select: { 
            regionId: true, 
            universityId: true, 
            smallGroupId: true, 
            alumniGroupId: true 
          } 
        }
      }
    });

    if (!existingAttendance) {
      return NextResponse.json({ 
        error: "Attendance record not found" 
      }, { status: 404 });
    }

    // Apply RLS check
    const memberRLSConditions = getTableRLSConditions(userScope, 'member');
    const hasMemberAccess = Object.keys(memberRLSConditions).every(key => {
      if (memberRLSConditions[key] === null || memberRLSConditions[key] === undefined) return true;
      return existingAttendance.member[key] === memberRLSConditions[key];
    });

    if (!hasMemberAccess) {
      return NextResponse.json({ 
        error: "Access denied to attendance record" 
      }, { status: 403 });
    }

    const updatedAttendance = await prisma.attendance.update({
      where: { id: parseInt(attendanceId) },
      data: {
        status: status,
        notes: notes || null,
      },
      include: {
        member: { select: { id: true, firstname: true, secondname: true } },
        permanentministryevent: { select: { id: true, name: true } },
        trainings: { select: { id: true, name: true } }
      }
    });

    return NextResponse.json(updatedAttendance, { status: 200 });
    
  } catch (error) {
    console.error("Error updating attendance record:", error);
    return NextResponse.json({ 
      error: 'Failed to update attendance record',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Enhanced DELETE endpoint
export async function DELETE(request: NextRequest) {
  try {
    const userScope = await getUserScope();
    if (!userScope) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const attendanceId = searchParams.get("id");

    if (!attendanceId) {
      return NextResponse.json({ 
        error: "Attendance ID is required" 
      }, { status: 400 });
    }

    // Check if attendance record exists and user has access
    const existingAttendance = await prisma.attendance.findUnique({
      where: { id: parseInt(attendanceId) },
      include: {
        member: { 
          select: { 
            regionId: true, 
            universityId: true, 
            smallGroupId: true, 
            alumniGroupId: true 
          } 
        }
      }
    });

    if (!existingAttendance) {
      return NextResponse.json({ 
        error: "Attendance record not found" 
      }, { status: 404 });
    }

    // Apply RLS check
    const memberRLSConditions = getTableRLSConditions(userScope, 'member');
    const hasMemberAccess = Object.keys(memberRLSConditions).every(key => {
      if (memberRLSConditions[key] === null || memberRLSConditions[key] === undefined) return true;
      return existingAttendance.member[key] === memberRLSConditions[key];
    });

    if (!hasMemberAccess) {
      return NextResponse.json({ 
        error: "Access denied to attendance record" 
      }, { status: 403 });
    }

    await prisma.attendance.delete({
      where: { id: parseInt(attendanceId) }
    });

    return NextResponse.json({ 
      message: "Attendance record deleted successfully" 
    }, { status: 200 });
    
  } catch (error) {
    console.error("Error deleting attendance record:", error);
    return NextResponse.json({ 
      error: 'Failed to delete attendance record',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper function to get date ranges
function getDateRange(rangeId: string): { startDate: Date; endDate: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (rangeId) {
    case 'today':
      return {
        startDate: new Date(today),
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
      };
    case 'yesterday':
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      return {
        startDate: yesterday,
        endDate: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1)
      };
    case 'last7days':
      return {
        startDate: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000),
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
      };
    case 'last14days':
      return {
        startDate: new Date(today.getTime() - 13 * 24 * 60 * 60 * 1000),
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
      };
    case 'last30days':
      return {
        startDate: new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000),
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
      };
    case 'thismonth':
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return {
        startDate: monthStart,
        endDate: new Date(monthEnd.getTime() + 24 * 60 * 60 * 1000 - 1)
      };
    case 'lastmonth':
      const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
      return {
        startDate: lastMonthStart,
        endDate: new Date(lastMonthEnd.getTime() + 24 * 60 * 60 * 1000 - 1)
      };
    default:
      return {
        startDate: new Date(0),
        endDate: new Date()
      };
  }
}

/**
 * Send attendance notifications for absent members
 */
async function sendAttendanceNotifications(
  eventId: number, 
  eventType: 'permanent' | 'training', 
  absentMembers: Array<{memberId: number, status: string}>,
  eventDate: Date
): Promise<void> {
  try {
    // Get event details
    let event: any;
    if (eventType === 'permanent') {
      event = await prisma.permanentministryevent.findUnique({
        where: { id: eventId },
        include: {
          smallgroup: { select: { id: true, name: true, universityId: true, regionId: true } },
          university: { select: { id: true, name: true, regionId: true } },
          region: { select: { id: true, name: true } }
        }
      });
    } else {
      event = await prisma.trainings.findUnique({
        where: { id: eventId },
        include: {
          smallgroup: { select: { id: true, name: true, universityId: true, regionId: true } },
          university: { select: { id: true, name: true, regionId: true } },
          region: { select: { id: true, name: true } }
        }
      });
    }

    if (!event) {
      console.error('Event not found for notification:', eventId);
      return;
    }

    // Get absent member details
    const absentMemberIds = absentMembers.map(m => m.memberId);
    const absentMemberDetails = await prisma.member.findMany({
      where: { id: { in: absentMemberIds } },
      select: {
        id: true,
        firstname: true,
        secondname: true,
        phone: true,
        email: true
      }
    });

    // Prepare notification data - send to ALL small groups in the university
    const universityId = event.university?.id || event.smallgroup?.universityId;
    
    // Only send notifications if we have university information
    if (!universityId) {
      console.log(`⚠️ Skipping notifications - Missing universityId for event`);
      return;
    }

    const notificationData = {
      eventId,
      eventType,
      eventName: event.name,
      eventDate,
      absentMembers: absentMemberDetails, // All absent members (will be filtered by small group)
      universityId,
      regionId: event.region?.id || event.university?.regionId || event.smallgroup?.regionId
    };

    // Send notifications
    await NotificationService.sendAttendanceNotifications(notificationData);

  } catch (error) {
    console.error('Error in sendAttendanceNotifications:', error);
    throw error;
  }
}
