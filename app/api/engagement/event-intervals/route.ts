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
        const regionId = searchParams.get("regionId");
        const universityId = searchParams.get("universityId");
        const smallGroupId = searchParams.get("smallGroupId");
        const alumniGroupId = searchParams.get("alumniGroupId");
        const eventId = searchParams.get("eventId");
        const status = searchParams.get("status"); // 'active', 'inactive', or 'all'
        const dateFrom = searchParams.get("dateFrom");
        const dateTo = searchParams.get("dateTo");

        // Apply RLS conditions
        const rlsConditions = getTableRLSConditions(userScope, 'permanentministryevent');
        const where: any = { ...rlsConditions };

        // Apply additional filters
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

        // Filter by specific event
        if (eventId && eventId !== 'all') {
            where.id = Number(eventId);
        }

        // Filter by event status
        if (status && status !== 'all') {
            where.isActive = status === 'active';
        }

        // Apply date filters to event creation/update dates
        if (dateFrom || dateTo) {
            where.OR = [];
            
            if (dateFrom) {
                const fromDate = new Date(dateFrom);
                fromDate.setHours(0, 0, 0, 0);
                
                // Events that started within the date range
                where.OR.push({
                    createdAt: { gte: fromDate }
                });
            }
            
            if (dateTo) {
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59, 999);
                
                // Events that ended within the date range
                where.OR.push({
                    updatedAt: { lte: toDate }
                });
            }
        }

        // Get events with engagement data
        const events = await prisma.permanentministryevent.findMany({
            where,
            include: {
                region: { select: { id: true, name: true } },
                university: { select: { id: true, name: true } },
                smallgroup: { select: { id: true, name: true } },
                alumnismallgroup: { select: { id: true, name: true } },
                attendance: {
                    where: {
                        status: 'present'
                    },
                    include: {
                        member: {
                            select: {
                                id: true,
                                firstname: true,
                                secondname: true,
                                regionId: true,
                                universityId: true,
                                smallGroupId: true,
                                alumniGroupId: true
                            }
                        }
                    }
                }
            },
            orderBy: [
                { isActive: 'desc' }, // Active events first
                { createdAt: 'desc' }
            ]
        });

        // Calculate engagement metrics for each event
        const eventEngagementData = events.map(event => {
            // Calculate engagement period duration
            const startDate = new Date(event.createdAt);
            const endDate = event.isActive ? new Date() : new Date(event.updatedAt);
            const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            
            // Get unique members who attended during the event's active period
            const uniqueMembers = new Set();
            const attendanceInPeriod = event.attendance.filter(att => {
                const attendanceDate = new Date(att.recordedAt);
                return attendanceDate >= startDate && attendanceDate <= endDate;
            });
            
            attendanceInPeriod.forEach(att => uniqueMembers.add(att.memberId));
            
            // Calculate engagement metrics
            const totalAttendance = attendanceInPeriod.length;
            const uniqueAttendees = uniqueMembers.size;
            const averageAttendancePerMember = uniqueAttendees > 0 ? (totalAttendance / uniqueAttendees) : 0;
            
            // Calculate engagement rate based on potential members in scope
            const potentialMembers = event.attendance.reduce((acc, att) => {
                const memberScope = att.member;
                if (memberScope.regionId === event.regionId) acc++;
                return acc;
            }, 0);
            
            const engagementRate = potentialMembers > 0 ? (uniqueAttendees / potentialMembers) * 100 : 0;
            
            return {
                id: event.id,
                name: event.name,
                type: event.type,
                status: event.isActive ? 'active' : 'inactive',
                region: event.region,
                university: event.university,
                smallGroup: event.smallgroup,
                alumniGroup: event.alumnismallgroup,
                startDate: event.createdAt,
                endDate: event.isActive ? null : event.updatedAt,
                durationDays,
                totalAttendance,
                uniqueAttendees,
                averageAttendancePerMember: Math.round(averageAttendancePerMember * 100) / 100,
                engagementRate: Math.round(engagementRate * 100) / 100,
                attendanceRecords: attendanceInPeriod.map(att => ({
                    id: att.id,
                    memberId: att.memberId,
                    memberName: `${att.member.firstname} ${att.member.secondname}`,
                    recordedAt: att.recordedAt,
                    status: att.status
                }))
            };
        });

        // Calculate summary statistics
        const summary = {
            totalEvents: events.length,
            activeEvents: events.filter(e => e.isActive).length,
            inactiveEvents: events.filter(e => !e.isActive).length,
            totalEngagementPeriod: eventEngagementData.reduce((sum, e) => sum + e.durationDays, 0),
            totalAttendance: eventEngagementData.reduce((sum, e) => sum + e.totalAttendance, 0),
            totalUniqueAttendees: eventEngagementData.reduce((sum, e) => sum + e.uniqueAttendees, 0),
            averageEngagementRate: eventEngagementData.length > 0 
                ? Math.round((eventEngagementData.reduce((sum, e) => sum + e.engagementRate, 0) / eventEngagementData.length) * 100) / 100
                : 0
        };

        return NextResponse.json({
            events: eventEngagementData,
            summary,
            filters: {
                regionId,
                universityId,
                smallGroupId,
                alumniGroupId,
                eventId,
                status,
                dateFrom,
                dateTo
            }
        });

    } catch (error) {
        console.error("Error fetching event interval engagement data:", error);
        return NextResponse.json({ error: 'Failed to fetch event interval engagement data' }, { status: 500 });
    }
}
