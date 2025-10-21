import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserScope, getTableRLSConditions } from '@/lib/rls';

export async function GET(request: NextRequest) {
  try {
    // Get user scope for RLS
    const userScope = await getUserScope();
    if (!userScope) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    
    // Get filter parameters
    const regionId = searchParams.get("regionId");
    const universityId = searchParams.get("universityId");
    const smallGroupId = searchParams.get("smallGroupId");
    const alumniGroupId = searchParams.get("alumniGroupId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const eventId = searchParams.get("eventId");
    const status = searchParams.get("status");

    // Build where clause with RLS conditions
    const memberRLSConditions = getTableRLSConditions(userScope, 'member');
    const where: any = {
      member: { ...memberRLSConditions }
    };

    // Override with explicit filters for super admin
    if (userScope.scope === 'superadmin') {
        const hasExplicitFilters = (regionId && regionId !== 'all') || 
            (universityId && universityId !== 'all') || 
            (smallGroupId && smallGroupId !== 'all') || 
            (alumniGroupId && alumniGroupId !== 'all');
        
        if (hasExplicitFilters) {
            where.member = {} as any;
            
            if (regionId && regionId !== 'all') {
                (where.member as any).regionId = Number(regionId);
            }
            if (universityId && universityId !== 'all') {
                (where.member as any).universityId = Number(universityId);
            }
            if (smallGroupId && smallGroupId !== 'all') {
                (where.member as any).smallGroupId = Number(smallGroupId);
            }
            if (alumniGroupId && alumniGroupId !== 'all') {
                (where.member as any).alumniGroupId = Number(alumniGroupId);
            }
        }
    }

    // Event filter
    if (eventId && eventId !== 'all') {
        where.OR = [
            { permanentEventId: Number(eventId) },
            { trainingId: Number(eventId) }
        ];
    }

    // Status filter
    if (status && status !== 'all') {
        where.status = status;
    }

    // Enhanced date range filter with predefined ranges support
    const dateRange = searchParams.get("dateRange");
    if (dateFrom || dateTo || dateRange) {
        where.recordedAt = {} as any;
        
        // Handle predefined date ranges
        if (dateRange && dateRange !== 'all') {
            const { dateFrom: rangeFrom, dateTo: rangeTo } = getDateRangeFromPredefined(dateRange);
            
            if (rangeFrom) {
                const fromDate = new Date(rangeFrom);
                fromDate.setHours(0, 0, 0, 0);
                (where.recordedAt as any).gte = fromDate;
            }
            
            if (rangeTo) {
                const toDate = new Date(rangeTo);
                toDate.setHours(23, 59, 59, 999);
                (where.recordedAt as any).lte = toDate;
            }
        } else {
            // Handle custom date range
            if (dateFrom) {
                const dateFromObj = new Date(dateFrom);
                dateFromObj.setHours(0, 0, 0, 0);
                (where.recordedAt as any).gte = dateFromObj;
            }
            if (dateTo) {
                const dateToObj = new Date(dateTo);
                dateToObj.setHours(23, 59, 59, 999);
                (where.recordedAt as any).lte = dateToObj;
            }
        }
    }

    // Get attendance records with full details
    const attendanceRecords = await prisma.attendance.findMany({
        where,
        include: {
            member: {
                include: {
                    region: { select: { name: true } },
                    university: { select: { name: true } },
                    smallgroup: { select: { name: true } },
                    alumnismallgroup: { select: { name: true } }
                }
            },
            permanentministryevent: {
                select: { name: true, type: true }
            },
            trainings: {
                select: { name: true, description: true }
            }
        },
        orderBy: {
            recordedAt: 'desc'
        }
    });

    // Format the data for export
    const attendanceDetails = attendanceRecords.map(record => ({
        id: record.id,
        memberName: `${record.member.firstname || ''} ${record.member.secondname || ''}`.trim(),
        memberEmail: record.member.email,
        memberPhone: record.member.phone,
        memberGender: record.member.gender,
        memberType: record.member.type,
        memberStatus: record.member.status,
        region: record.member.region?.name || 'N/A',
        university: record.member.university?.name || 'N/A',
        smallGroup: record.member.smallgroup?.name || 'N/A',
        alumniGroup: record.member.alumnismallgroup?.name || 'N/A',
        eventName: record.permanentministryevent?.name || record.trainings?.name || 'Unknown Event',
        eventType: record.permanentministryevent?.type || 'Training',
        attendanceStatus: record.status,
        recordedAt: record.recordedAt,
        notes: record.notes || ''
    }));

    return NextResponse.json({
        attendanceDetails,
        totalCount: attendanceDetails.length,
        appliedFilters: {
            regionId,
            universityId,
            smallGroupId,
            alumniGroupId,
            dateFrom,
            dateTo,
            eventId,
            status
        }
    });

  } catch (error) {
    console.error('Error fetching attendance export details:', error);
    return NextResponse.json(
        { error: "Failed to fetch attendance details" },
        { status: 500 }
    );
  }
}

/**
 * Get date range from predefined range identifier
 */
function getDateRangeFromPredefined(rangeId: string): { dateFrom: string | null; dateTo: string | null } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (rangeId) {
        case 'today':
            return {
                dateFrom: today.toISOString().split('T')[0],
                dateTo: today.toISOString().split('T')[0]
            };
        case 'yesterday':
            const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
            return {
                dateFrom: yesterday.toISOString().split('T')[0],
                dateTo: yesterday.toISOString().split('T')[0]
            };
        case 'last7days':
            return {
                dateFrom: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                dateTo: today.toISOString().split('T')[0]
            };
        case 'last14days':
            return {
                dateFrom: new Date(today.getTime() - 13 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                dateTo: today.toISOString().split('T')[0]
            };
        case 'last30days':
            return {
                dateFrom: new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                dateTo: today.toISOString().split('T')[0]
            };
        case 'thisweek':
            return {
                dateFrom: getWeekStart(today).toISOString().split('T')[0],
                dateTo: getWeekEnd(today).toISOString().split('T')[0]
            };
        case 'lastweek':
            const lastWeekStart = getWeekStart(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000));
            const lastWeekEnd = getWeekEnd(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000));
            return {
                dateFrom: lastWeekStart.toISOString().split('T')[0],
                dateTo: lastWeekEnd.toISOString().split('T')[0]
            };
        case 'thismonth':
            return {
                dateFrom: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0],
                dateTo: new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]
            };
        case 'lastmonth':
            return {
                dateFrom: new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0],
                dateTo: new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0]
            };
        case 'last3months':
            return {
                dateFrom: new Date(today.getFullYear(), today.getMonth() - 3, 1).toISOString().split('T')[0],
                dateTo: today.toISOString().split('T')[0]
            };
        case 'last6months':
            return {
                dateFrom: new Date(today.getFullYear(), today.getMonth() - 6, 1).toISOString().split('T')[0],
                dateTo: today.toISOString().split('T')[0]
            };
        case 'thisyear':
            return {
                dateFrom: new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0],
                dateTo: new Date(today.getFullYear(), 11, 31).toISOString().split('T')[0]
            };
        default:
            return { dateFrom: null, dateTo: null };
    }
}

/**
 * Get the start of the week (Monday) for a given date
 */
function getWeekStart(date: Date): Date {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(date.setDate(diff));
}

/**
 * Get the end of the week (Sunday) for a given date
 */
function getWeekEnd(date: Date): Date {
    const weekStart = getWeekStart(new Date(date));
    return new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
}

