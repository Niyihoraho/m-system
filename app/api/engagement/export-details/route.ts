import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserScope, generateRLSConditions } from '@/lib/rls';

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
    const engagementType = searchParams.get("engagementType");
    const selectedEvent = searchParams.get("selectedEvent");
    const selectedDesignation = searchParams.get("selectedDesignation");

    // Build where clause with RLS conditions
    const rlsConditions = generateRLSConditions(userScope);
    let where: any = { ...rlsConditions };

    // Apply explicit filters if they exist (but they must be within user's scope)
    if (regionId && regionId !== 'all') {
        const requestedRegionId = Number(regionId);
        if (rlsConditions.regionId && requestedRegionId !== rlsConditions.regionId) {
            return NextResponse.json({ error: "Access denied to requested region" }, { status: 403 });
        }
        where.regionId = requestedRegionId;
    }
    if (universityId && universityId !== 'all') {
        const requestedUniversityId = Number(universityId);
        if (rlsConditions.universityId && requestedUniversityId !== rlsConditions.universityId) {
            return NextResponse.json({ error: "Access denied to requested university" }, { status: 403 });
        }
        where.universityId = requestedUniversityId;
    }
    if (smallGroupId && smallGroupId !== 'all') {
        const requestedSmallGroupId = Number(smallGroupId);
        if (rlsConditions.smallGroupId && requestedSmallGroupId !== rlsConditions.smallGroupId) {
            return NextResponse.json({ error: "Access denied to requested small group" }, { status: 403 });
        }
        where.smallGroupId = requestedSmallGroupId;
    }
    if (alumniGroupId && alumniGroupId !== 'all') {
        const requestedAlumniGroupId = Number(alumniGroupId);
        if (rlsConditions.alumniGroupId && requestedAlumniGroupId !== rlsConditions.alumniGroupId) {
            return NextResponse.json({ error: "Access denied to requested alumni group" }, { status: 403 });
        }
        where.alumniGroupId = requestedAlumniGroupId;
    }

    // Date range filter
    if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(dateFrom);
        if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    // Get engagement details based on type
    let engagementDetails = [];
    let totalCount = 0;

    if (engagementType === 'event' || !engagementType) {
      // Get event attendance details
      const eventAttendance = await prisma.attendance.findMany({
        where: {
          status: 'present',
          member: where,
          ...(selectedEvent && selectedEvent !== 'all' ? {
            OR: [
              { permanentEventId: Number(selectedEvent) },
              { trainingId: Number(selectedEvent) }
            ]
          } : {})
        },
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

      engagementDetails = eventAttendance.map(attendance => ({
        id: attendance.id,
        type: 'event',
        memberName: `${attendance.member.firstname || ''} ${attendance.member.secondname || ''}`.trim(),
        memberEmail: attendance.member.email,
        memberPhone: attendance.member.phone,
        memberGender: attendance.member.gender,
        memberType: attendance.member.type,
        memberStatus: attendance.member.status,
        region: attendance.member.region?.name || 'N/A',
        university: attendance.member.university?.name || 'N/A',
        smallGroup: attendance.member.smallgroup?.name || 'N/A',
        alumniGroup: attendance.member.alumnismallgroup?.name || 'N/A',
        eventName: attendance.permanentministryevent?.name || attendance.trainings?.name || 'Unknown Event',
        eventType: attendance.permanentministryevent?.type || 'training',
        eventDescription: attendance.trainings?.description || '',
        attendanceStatus: attendance.status,
        recordedAt: attendance.recordedAt,
        notes: attendance.notes
      }));

      totalCount += eventAttendance.length;
    }

    if (engagementType === 'designation' || !engagementType) {
      // Get contribution/designation details
      const contributions = await prisma.contribution.findMany({
        where: {
          status: 'completed',
          member: where,
          ...(selectedDesignation && selectedDesignation !== 'all' ? {
            designationId: Number(selectedDesignation)
          } : {})
        },
        include: {
          member: {
            include: {
              region: { select: { name: true } },
              university: { select: { name: true } },
              smallgroup: { select: { name: true } },
              alumnismallgroup: { select: { name: true } }
            }
          },
          contributiondesignation: {
            select: { name: true, description: true }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      const contributionDetails = contributions.map(contribution => ({
        id: contribution.id,
        type: 'designation',
        memberName: `${contribution.member.firstname || ''} ${contribution.member.secondname || ''}`.trim(),
        memberEmail: contribution.member.email,
        memberPhone: contribution.member.phone,
        memberGender: contribution.member.gender,
        memberType: contribution.member.type,
        memberStatus: contribution.member.status,
        region: contribution.member.region?.name || 'N/A',
        university: contribution.member.university?.name || 'N/A',
        smallGroup: contribution.member.smallgroup?.name || 'N/A',
        alumniGroup: contribution.member.alumnismallgroup?.name || 'N/A',
        designationName: contribution.contributiondesignation?.name || 'Unknown Designation',
        designationDescription: contribution.contributiondesignation?.description || '',
        amount: contribution.amount,
        method: contribution.method,
        status: contribution.status,
        createdAt: contribution.createdAt,
        transactionId: contribution.transactionId
      }));

      if (engagementType === 'designation') {
        engagementDetails = contributionDetails;
      } else {
        engagementDetails = [...engagementDetails, ...contributionDetails];
      }

      totalCount += contributions.length;
    }

    // Sort by creation/recorded date
    engagementDetails.sort((a, b) => {
      const dateA = a.recordedAt || a.createdAt;
      const dateB = b.recordedAt || b.createdAt;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    return NextResponse.json({
      engagementDetails,
      totalCount,
      appliedFilters: {
        regionId,
        universityId,
        smallGroupId,
        alumniGroupId,
        dateFrom,
        dateTo,
        engagementType,
        selectedEvent,
        selectedDesignation
      }
    });

  } catch (error) {
    console.error('Error fetching engagement details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch engagement details' },
      { status: 500 }
    );
  }
}
