import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserScope, getTableRLSConditions } from "@/lib/rls";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const smallGroupId = searchParams.get("smallGroupId");
        const selectedDate = searchParams.get("selectedDate");
        const selectedEvent = searchParams.get("selectedEvent");
        
        if (!smallGroupId) {
            return NextResponse.json({ error: "Small Group ID is required" }, { status: 400 });
        }

        // Get user scope for RLS
        const userScope = await getUserScope();
        if (!userScope) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Apply RLS conditions
        const rlsConditions = getTableRLSConditions(userScope, 'member');
        
        // Get members from the specified small group with comprehensive data
        const members = await prisma.member.findMany({
            where: {
                ...rlsConditions,
                smallGroupId: Number(smallGroupId)
            },
            include: {
                region: { select: { id: true, name: true } },
                university: { select: { id: true, name: true } },
                smallgroup: { select: { id: true, name: true } }
            }
        });

        const memberIds = members.map(member => member.id);
        
        // Calculate comprehensive statistics for each member using Prisma queries
        const memberData = await Promise.all(members.map(async (member) => {
            try {
                // Get attendance records for this member
                const attendanceRecords = await prisma.attendance.findMany({
                    where: { memberId: member.id },
                    orderBy: { recordedAt: 'desc' }
                });

                // Get contribution records for this member
                const contributionRecords = await prisma.contribution.findMany({
                    where: { memberId: member.id }
                });

                // Calculate attendance statistics
                const totalAttendanceDays = attendanceRecords.length;
                const totalDaysAttended = attendanceRecords.filter(att => att.status === 'present').length;
                const totalDaysAbsent = attendanceRecords.filter(att => att.status === 'absent').length;
                const totalDaysExcused = attendanceRecords.filter(att => att.status === 'excuse').length;
                const attendanceRate = totalAttendanceDays > 0 ? (totalDaysAttended / totalAttendanceDays) * 100 : 0;

                // Get latest attendance status
                const latestAttendanceStatus = attendanceRecords.length > 0 ? attendanceRecords[0].status : 'absent';
                const lastAttendanceDate = attendanceRecords.length > 0 ? attendanceRecords[0].recordedAt : null;

                // Calculate days since last attendance
                const daysSinceLastAttendance = lastAttendanceDate ? 
                    Math.floor((new Date().getTime() - new Date(lastAttendanceDate).getTime()) / (1000 * 60 * 60 * 24)) : null;

                // Calculate engagement metrics
                const totalEventsParticipated = attendanceRecords.filter(att => att.status === 'present').length;
                const totalDesignationsParticipated = contributionRecords.filter(cont => cont.status === 'completed').length;
                const totalEngagementScore = totalEventsParticipated + totalDesignationsParticipated;

                // Calculate previous period data (last 30 days)
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                const sixtyDaysAgo = new Date();
                sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

                const previousPeriodAttendance = attendanceRecords.filter(att => 
                    att.recordedAt >= sixtyDaysAgo && att.recordedAt < thirtyDaysAgo
                ).length;

                const previousPeriodPresent = attendanceRecords.filter(att => 
                    att.recordedAt >= sixtyDaysAgo && 
                    att.recordedAt < thirtyDaysAgo && 
                    att.status === 'present'
                ).length;

                const previousPeriodContributions = contributionRecords.filter(cont => 
                    cont.createdAt >= sixtyDaysAgo && 
                    cont.createdAt < thirtyDaysAgo && 
                    cont.status === 'completed'
                ).length;

                // Calculate trends
                const attendanceTrend = previousPeriodPresent > 0 ? 
                    ((totalDaysAttended - previousPeriodPresent) / previousPeriodPresent) * 100 : 0;

                const previousEngagement = previousPeriodPresent + previousPeriodContributions;
                const engagementTrend = previousEngagement > 0 ? 
                    ((totalEngagementScore - previousEngagement) / previousEngagement) * 100 : 0;

                return {
                    memberId: member.id,
                    memberName: `${member.firstname || ''} ${member.secondname || ''}`.trim() || 'Unknown Member',
                    email: member.email,
                    phone: member.phone,
                    region: member.region?.name || 'N/A',
                    regionId: member.regionId || 0,
                    university: member.university?.name || 'N/A',
                    universityId: member.universityId || 0,
                    smallGroup: member.smallgroup?.name || 'N/A',
                    smallGroupId: member.smallGroupId || 0,
                    
                    // Real attendance statistics
                    totalAttendanceDays,
                    totalDaysAttended,
                    totalDaysAbsent,
                    totalDaysExcused,
                    attendanceRate: Math.round(attendanceRate * 10) / 10,
                    
                    // Recent activity
                    latestAttendanceStatus,
                    lastAttendanceDate: lastAttendanceDate?.toISOString() || null,
                    daysSinceLastAttendance,
                    
                    // Engagement metrics
                    totalEventsParticipated,
                    totalDesignationsParticipated,
                    totalEngagementScore,
                    
                    // Member info
                    memberType: member.type || 'member',
                    memberStatus: member.status || 'active',
                    memberSince: member.createdAt.toISOString(),
                    graduationYear: member.graduationDate ? new Date(member.graduationDate).getFullYear() : null,
                    faculty: member.faculty,
                    profession: member.professionalism,
                    
                    // Trends (compared to previous period)
                    attendanceTrend: Math.round(attendanceTrend * 10) / 10,
                    engagementTrend: Math.round(engagementTrend * 10) / 10,
                    participationTrend: Math.round(attendanceTrend * 10) / 10
                };
            } catch (error) {
                console.error(`Error processing member ${member.id}:`, error);
                // Return fallback data for this member
                return {
                    memberId: member.id,
                    memberName: `${member.firstname || ''} ${member.secondname || ''}`.trim() || 'Unknown Member',
                    email: member.email,
                    phone: member.phone,
                    region: member.region?.name || 'N/A',
                    regionId: member.regionId || 0,
                    university: member.university?.name || 'N/A',
                    universityId: member.universityId || 0,
                    smallGroup: member.smallgroup?.name || 'N/A',
                    smallGroupId: member.smallGroupId || 0,
                    
                    // Fallback statistics
                    totalAttendanceDays: 0,
                    totalDaysAttended: 0,
                    totalDaysAbsent: 0,
                    totalDaysExcused: 0,
                    attendanceRate: 0,
                    
                    // Recent activity
                    latestAttendanceStatus: 'absent',
                    lastAttendanceDate: null,
                    daysSinceLastAttendance: null,
                    
                    // Engagement metrics
                    totalEventsParticipated: 0,
                    totalDesignationsParticipated: 0,
                    totalEngagementScore: 0,
                    
                    // Member info
                    memberType: member.type || 'member',
                    memberStatus: member.status || 'active',
                    memberSince: member.createdAt.toISOString(),
                    graduationYear: member.graduationDate ? new Date(member.graduationDate).getFullYear() : null,
                    faculty: member.faculty,
                    profession: member.professionalism,
                    
                    // Trends
                    attendanceTrend: 0,
                    engagementTrend: 0,
                    participationTrend: 0
                };
            }
        }));

        return NextResponse.json(memberData, { status: 200 });
        
    } catch (error) {
        console.error("Error fetching member statistics:", error);
        console.error("Error details:", {
            smallGroupId,
            selectedDate,
            selectedEvent,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return NextResponse.json({ 
            error: 'Failed to fetch member statistics',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
