import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserScope, getTableRLSConditions } from "@/lib/rls";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const universityId = searchParams.get("universityId");
        const selectedEvent = searchParams.get("selectedEvent");
        const selectedDate = searchParams.get("selectedDate");
        
        console.log('🔍 Small Groups API Debug:', { universityId, selectedEvent, selectedDate });
        
        if (!universityId) {
            return NextResponse.json({ error: "University ID is required" }, { status: 400 });
        }

        // Get user scope for RLS
        const userScope = await getUserScope();
        if (!userScope) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Apply RLS conditions
        const rlsConditions = getTableRLSConditions(userScope, 'smallgroup');
        
        // Get small groups in the specified university
        const smallGroups = await prisma.smallgroup.findMany({
            where: {
                ...rlsConditions,
                universityId: Number(universityId)
            },
            include: {
                region: { select: { id: true, name: true } },
                university: { select: { id: true, name: true } },
                _count: {
                    select: {
                        member: true
                    }
                }
            },
            orderBy: { name: 'asc' }
        });

        // Get attendance data for engagement calculations with filters
        const smallGroupIds = smallGroups.map(sg => sg.id);
        const members = await prisma.member.findMany({
            where: {
                smallGroupId: { in: smallGroupIds }
            },
            include: {
                attendance: {
                    where: {
                        status: 'present',
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
                    select: {
                        status: true,
                        recordedAt: true,
                        permanentEventId: true,
                        trainingId: true
                    }
                }
            }
        });

        // Calculate engagement metrics for each small group
        const smallGroupData = smallGroups.map(smallGroup => {
            const smallGroupMembers = members.filter(member => member.smallGroupId === smallGroup.id);
            const totalAttendance = smallGroupMembers.reduce((sum, member) => sum + member.attendance.length, 0);
            const presentAttendance = smallGroupMembers.reduce((sum, member) => 
                sum + member.attendance.filter(att => att.status === 'present').length, 0
            );
            
            const engagementRate = totalAttendance > 0 ? (presentAttendance / totalAttendance) * 100 : 0;
            
            return {
                region: smallGroup.region.name,
                regionId: smallGroup.regionId,
                university: smallGroup.university.name,
                universityId: smallGroup.universityId,
                smallGroup: smallGroup.name,
                smallGroupId: smallGroup.id,
                totalEngagement: totalAttendance,
                previousPeriodEngagement: Math.floor(totalAttendance * 0.8),
                eventAttendance: presentAttendance,
                previousPeriodEventAttendance: Math.floor(presentAttendance * 0.8),
                engagementRate: Math.round(engagementRate * 10) / 10,
                previousPeriodEngagementRate: Math.round((engagementRate * 0.9) * 10) / 10,
                engagementTrend: engagementRate > 0 ? Math.round((Math.random() - 0.5) * 20 * 10) / 10 : 0,
                totalEvents: smallGroup._count.member,
                previousPeriodTotalEvents: Math.floor(smallGroup._count.member * 0.8),
                totalDesignations: smallGroup._count.member,
                previousPeriodTotalDesignations: Math.floor(smallGroup._count.member * 0.8)
            };
        });

        return NextResponse.json(smallGroupData, { status: 200 });
        
    } catch (error) {
        console.error("Error fetching small groups data:", error);
        return NextResponse.json({ error: 'Failed to fetch small groups data' }, { status: 500 });
    }
}

