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
        const memberId = searchParams.get("memberId");
        const selectedDate = searchParams.get("selectedDate");
        const selectedEvent = searchParams.get("selectedEvent");

        // Apply RLS conditions
        const rlsConditions = getTableRLSConditions(userScope, 'member');
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
        if (memberId && memberId !== 'all') {
            where.id = Number(memberId);
        }

        // Get members with engagement data and event status context
        const members = await prisma.member.findMany({
            where,
            include: {
                region: { select: { id: true, name: true } },
                university: { select: { id: true, name: true } },
                smallgroup: { select: { id: true, name: true } },
                alumnismallgroup: { select: { id: true, name: true } },
                attendance: {
                    where: {
                        ...(selectedDate && {
                            recordedAt: {
                                gte: new Date(selectedDate + 'T00:00:00.000Z'),
                                lte: new Date(selectedDate + 'T23:59:59.999Z')
                            }
                        }),
                        ...(selectedEvent && selectedEvent !== 'all' ? {
                            OR: [
                                { permanentEventId: Number(selectedEvent) },
                                { trainingId: Number(selectedEvent) }
                            ]
                        } : {})
                    },
                    include: {
                        permanentministryevent: {
                            select: {
                                id: true,
                                name: true,
                                type: true,
                                isActive: true,
                                createdAt: true,
                                updatedAt: true
                            }
                        },
                        trainings: {
                            select: {
                                id: true,
                                name: true,
                                description: true,
                                startDateTime: true,
                                endDateTime: true,
                                createdAt: true,
                                updatedAt: true
                            }
                        }
                    },
                    orderBy: { recordedAt: 'desc' }
                },
                contribution: {
                    orderBy: { createdAt: 'desc' }
                }
            },
            orderBy: [
                { firstname: 'asc' },
                { secondname: 'asc' }
            ]
        });

        // Calculate student-friendly engagement metrics for each member
        const memberEngagementData = members.map(member => {
            // Get attendance records
            const attendanceRecords = member.attendance;
            const totalAttendanceDays = attendanceRecords.length;
            const totalDaysAttended = attendanceRecords.filter(att => att.status === 'present').length;
            const totalDaysAbsent = attendanceRecords.filter(att => att.status === 'absent').length;
            const totalDaysExcused = attendanceRecords.filter(att => att.status === 'excused').length;
            const attendanceRate = totalAttendanceDays > 0 ? (totalDaysAttended / totalAttendanceDays) * 100 : 0;

            // Get latest attendance status
            const latestAttendanceStatus = attendanceRecords.length > 0 ? attendanceRecords[0].status : 'absent';
            const lastAttendanceDate = attendanceRecords.length > 0 ? attendanceRecords[0].recordedAt : null;
            const daysSinceLastAttendance = lastAttendanceDate ? 
                Math.floor((new Date().getTime() - new Date(lastAttendanceDate).getTime()) / (1000 * 60 * 60 * 24)) : null;

            // Calculate event status context
            const eventStatusContext = calculateEventStatusContext(attendanceRecords);
            
            // Calculate engagement metrics
            const totalEventsParticipated = totalDaysAttended;
            const totalDesignationsParticipated = member.contribution.filter(cont => cont.status === 'completed').length;
            const totalEngagementScore = totalEventsParticipated + totalDesignationsParticipated;

            // Create participation ratio string
            const participationRatio = `${totalDaysAttended} out of ${totalAttendanceDays} event days`;

            return {
                memberId: member.id,
                memberName: `${member.firstname} ${member.secondname}`,
                email: member.email,
                phone: member.phone,
                region: member.region?.name || 'N/A',
                regionId: member.regionId,
                university: member.university?.name || 'N/A',
                universityId: member.universityId,
                smallGroup: member.smallgroup?.name || 'N/A',
                smallGroupId: member.smallGroupId,
                
                // Student-friendly attendance statistics
                totalAttendanceDays,
                totalDaysAttended,
                totalDaysAbsent,
                totalDaysExcused,
                attendanceRate,
                
                // Recent activity in simple terms
                latestAttendanceStatus,
                lastAttendanceDate,
                daysSinceLastAttendance,
                
                // Engagement in everyday language
                totalEventsParticipated,
                totalDesignationsParticipated,
                totalEngagementScore,
                
                // Member info
                memberType: member.memberType || 'student',
                memberStatus: member.status || 'active',
                
                // Event timeline context
                activeEventsCount: eventStatusContext.activeEventsCount,
                inactiveEventsCount: eventStatusContext.inactiveEventsCount,
                totalEventDays: eventStatusContext.totalEventDays,
                participationRatio,
                
                // Additional context
                eventStatusBreakdown: eventStatusContext.breakdown,
                recentEvents: eventStatusContext.recentEvents
            };
        });

        return NextResponse.json({
            members: memberEngagementData,
            summary: {
                totalMembers: members.length,
                totalActiveEvents: memberEngagementData.reduce((sum, m) => sum + m.activeEventsCount, 0),
                totalInactiveEvents: memberEngagementData.reduce((sum, m) => sum + m.inactiveEventsCount, 0),
                averageAttendanceRate: memberEngagementData.length > 0 
                    ? Math.round(memberEngagementData.reduce((sum, m) => sum + m.attendanceRate, 0) / memberEngagementData.length)
                    : 0
            }
        });

    } catch (error) {
        console.error("Error fetching student-friendly engagement data:", error);
        return NextResponse.json({ error: 'Failed to fetch student engagement data' }, { status: 500 });
    }
}

// Helper function to calculate event status context
function calculateEventStatusContext(attendanceRecords: any[]) {
    const eventMap = new Map();
    
    // Group attendance by event
    attendanceRecords.forEach(att => {
        let event = null;
        let eventId = null;
        
        if (att.permanentministryevent) {
            event = att.permanentministryevent;
            eventId = `permanent_${event.id}`;
        } else if (att.trainings) {
            event = att.trainings;
            eventId = `training_${event.id}`;
        }
        
        if (event && eventId) {
            if (!eventMap.has(eventId)) {
                eventMap.set(eventId, {
                    ...event,
                    eventType: att.permanentministryevent ? 'permanent' : 'training',
                    attendanceRecords: []
                });
            }
            eventMap.get(eventId).attendanceRecords.push(att);
        }
    });

    let activeEventsCount = 0;
    let inactiveEventsCount = 0;
    let totalEventDays = 0;
    const breakdown = [];
    const recentEvents = [];

    eventMap.forEach((event, eventId) => {
        const isActive = event.eventType === 'permanent' ? event.isActive : true; // Training events are always "active" during their duration
        const startDate = new Date(event.createdAt);
        const endDate = event.eventType === 'permanent' 
            ? (event.isActive ? new Date() : new Date(event.updatedAt))
            : (event.endDateTime ? new Date(event.endDateTime) : new Date());
        const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        totalEventDays += durationDays;
        
        if (isActive) {
            activeEventsCount++;
        } else {
            inactiveEventsCount++;
        }

        breakdown.push({
            eventId,
            eventName: event.name,
            eventType: event.eventType === 'permanent' ? event.type : 'training',
            status: isActive ? 'active' : 'inactive',
            startDate: event.createdAt,
            endDate: event.eventType === 'permanent' ? (event.isActive ? null : event.updatedAt) : event.endDateTime,
            durationDays,
            attendanceCount: event.attendanceRecords.length
        });

        // Add to recent events (last 5)
        if (recentEvents.length < 5) {
            recentEvents.push({
                eventName: event.name,
                status: isActive ? '🟢 Active' : '🔴 Ended',
                lastAttendance: event.attendanceRecords.length > 0 
                    ? event.attendanceRecords[0].recordedAt 
                    : null
            });
        }
    });

    return {
        activeEventsCount,
        inactiveEventsCount,
        totalEventDays,
        breakdown,
        recentEvents
    };
}
