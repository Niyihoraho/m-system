import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserScope, getTableRLSConditions } from "@/lib/rls";

export async function GET(request: NextRequest) {
    try {
        // Get user scope for RLS
        const userScope = await getUserScope();
        if (!userScope) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Parse query parameters for filtering
        const { searchParams } = new URL(request.url);
        const selectedEvent = searchParams.get("selectedEvent");
        const selectedDate = searchParams.get("selectedDate");
        
        console.log('🔍 Regions API Debug:', { selectedEvent, selectedDate });

        // Apply RLS conditions
        const rlsConditions = getTableRLSConditions(userScope, 'region');
        
        // Get regions with engagement data
        const regions = await prisma.region.findMany({
            where: rlsConditions,
            include: {
                _count: {
                    select: {
                        member: true,
                        university: true,
                        smallgroup: true
                    }
                }
            },
            orderBy: { name: 'asc' }
        });

        // Get attendance data for engagement calculations
        const regionIds = regions.map(region => region.id);
        const members = await prisma.member.findMany({
            where: {
                regionId: { in: regionIds }
            },
            include: {
                attendance: {
                    select: {
                        status: true,
                        recordedAt: true
                    }
                }
            }
        });

        // Calculate engagement metrics for each region using Prisma queries
        const regionData = await Promise.all(regions.map(async (region) => {
            try {
                // Get members in this region
                const regionMembers = await prisma.member.findMany({
                    where: { regionId: region.id },
                    select: { 
                        id: true, 
                        status: true,
                        attendance: {
                            where: {
                                status: 'present',
                                ...(selectedDate && {
                                    recordedAt: {
                                        gte: new Date(selectedDate + 'T00:00:00.000Z'),
                                        lte: new Date(selectedDate + 'T23:59:59.999Z')
                                    }
                                }),
                                ...(selectedEvent && selectedEvent !== 'all' && {
                                    permanentministryeventId: Number(selectedEvent)
                                })
                            },
                            select: {
                                status: true,
                                recordedAt: true,
                                permanentministryeventId: true
                            }
                        },
                        contribution: {
                            select: {
                                status: true,
                                createdAt: true
                            }
                        }
                    }
                });

                // Calculate attendance statistics
                const totalAttendanceRecords = regionMembers.reduce((sum, member) => sum + member.attendance.length, 0);
                const presentAttendance = regionMembers.reduce((sum, member) => 
                    sum + member.attendance.filter(att => att.status === 'present').length, 0
                );

                // Calculate contribution statistics
                const totalContributions = regionMembers.reduce((sum, member) => sum + member.contribution.length, 0);
                const completedContributions = regionMembers.reduce((sum, member) => 
                    sum + member.contribution.filter(cont => cont.status === 'completed').length, 0
                );

                // Calculate previous period data (last 30 days)
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                const sixtyDaysAgo = new Date();
                sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

                const previousPeriodAttendance = regionMembers.reduce((sum, member) => 
                    sum + member.attendance.filter(att => 
                        att.recordedAt >= sixtyDaysAgo && att.recordedAt < thirtyDaysAgo
                    ).length, 0
                );

                const previousPeriodPresent = regionMembers.reduce((sum, member) => 
                    sum + member.attendance.filter(att => 
                        att.recordedAt >= sixtyDaysAgo && 
                        att.recordedAt < thirtyDaysAgo && 
                        att.status === 'present'
                    ).length, 0
                );

                const previousPeriodContributions = regionMembers.reduce((sum, member) => 
                    sum + member.contribution.filter(cont => 
                        cont.createdAt >= sixtyDaysAgo && 
                        cont.createdAt < thirtyDaysAgo && 
                        cont.status === 'completed'
                    ).length, 0
                );

                // Calculate rates and trends
                const engagementRate = totalAttendanceRecords > 0 ? (presentAttendance / totalAttendanceRecords) * 100 : 0;
                const previousEngagementRate = previousPeriodAttendance > 0 ? (previousPeriodPresent / previousPeriodAttendance) * 100 : 0;
                
                const totalEngagement = presentAttendance + completedContributions;
                const previousEngagement = previousPeriodPresent + previousPeriodContributions;
                const engagementTrend = previousEngagement > 0 ? ((totalEngagement - previousEngagement) / previousEngagement) * 100 : 0;

                // Get event counts - only count active events
                const totalEvents = await prisma.permanentministryevent.count({
                    where: { 
                        regionId: region.id,
                        isActive: true  // Only count active events
                    }
                });

                const totalTrainings = await prisma.trainings.count({
                    where: { 
                        regionId: region.id,
                        isActive: true  // Only count active events
                    }
                });

                return {
                    region: region.name,
                    regionId: region.id,
                    university: 'All Universities',
                    universityId: 0,
                    smallGroup: 'All Small Groups',
                    smallGroupId: 0,
                    totalEngagement: totalEngagement,
                    previousPeriodEngagement: previousEngagement,
                    eventAttendance: presentAttendance,
                    previousPeriodEventAttendance: previousPeriodPresent,
                    engagementRate: Math.round(engagementRate * 10) / 10,
                    previousPeriodEngagementRate: Math.round(previousEngagementRate * 10) / 10,
                    engagementTrend: Math.round(engagementTrend * 10) / 10,
                    totalEvents: totalEvents + totalTrainings,
                    previousPeriodTotalEvents: Math.floor((totalEvents + totalTrainings) * 0.9), // Estimate
                    totalDesignations: completedContributions,
                    previousPeriodTotalDesignations: previousPeriodContributions,
                    totalMembers: region._count.member,
                    activeMembers: regionMembers.filter(m => m.status === 'active').length
                };
            } catch (error) {
                console.error(`Error processing region ${region.id}:`, error);
                // Return fallback data for this region
                return {
                    region: region.name,
                    regionId: region.id,
                    university: 'All Universities',
                    universityId: 0,
                    smallGroup: 'All Small Groups',
                    smallGroupId: 0,
                    totalEngagement: 0,
                    previousPeriodEngagement: 0,
                    eventAttendance: 0,
                    previousPeriodEventAttendance: 0,
                    engagementRate: 0,
                    previousPeriodEngagementRate: 0,
                    engagementTrend: 0,
                    totalEvents: 0,
                    previousPeriodTotalEvents: 0,
                    totalDesignations: 0,
                    previousPeriodTotalDesignations: 0,
                    totalMembers: region._count.member,
                    activeMembers: 0
                };
            }
        }));

        return NextResponse.json(regionData, { status: 200 });
        
    } catch (error) {
        console.error("Error fetching regions data:", error);
        return NextResponse.json({ error: 'Failed to fetch regions data' }, { status: 500 });
    }
}

