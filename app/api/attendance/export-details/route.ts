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
    let where: any = {
      member: { ...memberRLSConditions }
    };

    // Override with explicit filters for super admin
    if (userScope.scope === 'superadmin') {
        const hasExplicitFilters = regionId || universityId || smallGroupId || alumniGroupId;
        
        if (hasExplicitFilters) {
            where.member = {};
            
            if (regionId && regionId !== 'all') {
                where.member.regionId = Number(regionId);
            }
            if (universityId && universityId !== 'all') {
                where.member.universityId = Number(universityId);
            }
            if (smallGroupId && smallGroupId !== 'all') {
                where.member.smallGroupId = Number(smallGroupId);
            }
            if (alumniGroupId && alumniGroupId !== 'all') {
                where.member.alumniGroupId = Number(alumniGroupId);
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

    // Date range filter
    if (dateFrom || dateTo) {
        where.recordedAt = {};
        if (dateFrom) {
            const dateFromObj = new Date(dateFrom);
            dateFromObj.setHours(0, 0, 0, 0);
            where.recordedAt.gte = dateFromObj;
        }
        if (dateTo) {
            const dateToObj = new Date(dateTo);
            dateToObj.setHours(23, 59, 59, 999);
            where.recordedAt.lte = dateToObj;
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

