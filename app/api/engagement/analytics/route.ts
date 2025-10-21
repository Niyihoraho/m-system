import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserScope, generateRLSConditions } from "@/lib/rls";

export async function GET(request: NextRequest) {
    try {
        // Get user scope for RLS
        const userScope = await getUserScope();
        if (!userScope) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        
        // Get filter parameters
        const regionId = searchParams.get("regionId");
        const universityId = searchParams.get("universityId");
        const smallGroupId = searchParams.get("smallGroupId");
        const alumniGroupId = searchParams.get("alumniGroupId");
        const dateFrom = searchParams.get("dateFrom");
        const dateTo = searchParams.get("dateTo");
        const selectedDate = searchParams.get("selectedDate");
        
        // Engagement type filters
        const _engagementType = searchParams.get("engagementType");
        const selectedEvent = searchParams.get("selectedEvent");
        const selectedDesignation = searchParams.get("selectedDesignation");
        
        // Debug: Log the received parameters
        console.log('🔍 Analytics API Debug:', {
            selectedEvent,
            selectedDesignation,
            selectedDate,
            dateFrom,
            dateTo
        });

        // Build the filter object with RLS conditions
        const rlsConditions = generateRLSConditions(userScope);
        const where: Record<string, unknown> = { ...rlsConditions };

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

        // Convert selectedDate to dateFrom/dateTo if provided
        let finalDateFrom = dateFrom;
        let finalDateTo = dateTo;
        
        if (selectedDate && !dateFrom && !dateTo) {
            // If selectedDate is provided but no date range, use it as both from and to
            finalDateFrom = selectedDate;
            finalDateTo = selectedDate;
        }

        // Apply date filters - Note: Date filtering is now handled in getEventAttendanceData
        // Remove the incorrect createdAt filter that was filtering events by creation date
        // instead of attendance by recorded date

        // Get event attendance data
        const eventAttendanceData = await getEventAttendanceData(where, selectedEvent, finalDateFrom, finalDateTo);
        
        // Get designation participation data
        const designationData = await getDesignationData(where, selectedDesignation);
        
        // Get monthly engagement trends
        const monthlyTrends = await getMonthlyEngagementTrends(where, finalDateFrom, finalDateTo);
        
        // Get regional engagement data with hierarchical comparisons
        console.log('🔍 Getting regional engagement with params:', {
            where,
            regionId,
            universityId,
            selectedEvent,
            finalDateFrom,
            finalDateTo,
            userScope: userScope.scope
        });
        const regionalEngagement = await getRegionalEngagementData(where, regionId, universityId, selectedEvent, finalDateFrom, finalDateTo);
        
        // Get engagement type distribution
        const engagementTypeDistribution = await getEngagementTypeDistribution(where);
        
        // Get event engagement levels
        const eventEngagementLevels = await getEventEngagementLevels(where);
        
        // Calculate key metrics
        const keyMetrics = {
            totalEngagement: eventAttendanceData.totalAttendance + designationData.totalContributions,
            averageEngagementRate: calculateEngagementRate(eventAttendanceData, designationData),
            eventParticipation: eventAttendanceData.totalAttendance,
            designationParticipation: designationData.totalContributions,
            monthlyGrowth: calculateMonthlyGrowth(monthlyTrends)
        };

        // Format the response
        const analytics = {
            keyMetrics,
            engagementTrends: monthlyTrends,
            engagementTypeDistribution,
            regionalEngagement,
            eventEngagementLevels
        };

        // Always return real data - no fallback to mock data
        // If no data exists, return zeros but keep the structure
        if (keyMetrics.totalEngagement === 0 && keyMetrics.eventParticipation === 0 && keyMetrics.designationParticipation === 0) {
            analytics.keyMetrics = {
                totalEngagement: 0,
                averageEngagementRate: 0,
                eventParticipation: 0,
                designationParticipation: 0,
                monthlyGrowth: 0
            };

            analytics.engagementTrends = [];
            analytics.engagementTypeDistribution = [
                { name: 'Events', value: 0, color: '#3B82F6', count: 0 },
                { name: 'Designations', value: 0, color: '#10B981', count: 0 }
            ];
            analytics.eventEngagementLevels = [
                { name: 'High Engagement', value: 0, color: '#10B981', count: 0 },
                { name: 'Medium Engagement', value: 0, color: '#F59E0B', count: 0 },
                { name: 'Low Engagement', value: 0, color: '#EF4444', count: 0 }
            ];
        }

        console.log('🔍 Final Analytics Response:', {
            selectedEvent,
            selectedDate,
            keyMetrics: analytics.keyMetrics,
            totalEvents: analytics.eventEngagementLevels?.reduce((sum, level) => sum + level.count, 0) || 0,
            regionalEngagementLength: analytics.regionalEngagement?.length || 0,
            regionalEngagement: analytics.regionalEngagement
        });
        
        return NextResponse.json(analytics, { status: 200 });

    } catch (error) {
        console.error("Error fetching engagement analytics:", error);
        return NextResponse.json({ error: 'Failed to fetch engagement analytics' }, { status: 500 });
    }
}

// Helper function to get event attendance data
async function getEventAttendanceData(where: Record<string, unknown>, selectedEvent?: string | null, dateFrom?: string | null, dateTo?: string | null) {
    try {
        let eventWhere: Record<string, unknown>;
        
        // Filter by specific event if selected
        if (selectedEvent && selectedEvent !== 'all') {
            // When a specific event is selected, only filter by that event ID
            eventWhere = { id: Number(selectedEvent) };
            console.log('🔍 Event Filter Applied:', { selectedEvent, eventWhere });
        } else {
            // When no specific event is selected, use the general where clause
            eventWhere = { ...where };
            console.log('🔍 No Event Filter:', { eventWhere });
        }

        // Add university ministry filter to only show relevant events
        const universityMinistryFilter = {
            OR: [
                { name: { contains: 'Bible Study' } },
                { name: { contains: 'Discipleship' } },
                { name: { contains: 'Ministry' } },
                { name: { contains: 'Fellowship' } },
                { name: { contains: 'Prayer' } },
                { name: { contains: 'Worship' } },
                { name: { contains: 'Evangelism' } },
                { name: { contains: 'Leadership' } },
                { name: { contains: 'Training' } },
                { name: { contains: 'Conference' } },
                { name: { contains: 'Retreat' } },
                { name: { contains: 'Seminar' } },
                { name: { contains: 'Workshop' } },
                { name: { contains: 'Cell Group' } },
                { name: { contains: 'Small Group' } },
                { name: { contains: 'Campus' } },
                { name: { contains: 'University' } },
                { name: { contains: 'Student' } },
                { type: { in: ['bible_study', 'discipleship', 'evangelism', 'cell_meeting'] } }
            ]
        };

        // Get permanent ministry events with attendance
        const permanentEvents = await prisma.permanentministryevent.findMany({
            where: {
                ...eventWhere,
                // Only apply university ministry filter if no specific event is selected
                ...(selectedEvent && selectedEvent !== 'all' ? {} : universityMinistryFilter)
            },
            include: {
                attendance: {
                    where: {
                        status: 'present',
                        ...(dateFrom && {
                            recordedAt: {
                                gte: new Date(dateFrom + 'T00:00:00.000Z'),
                                lte: new Date((dateTo || dateFrom) + 'T23:59:59.999Z')
                            }
                        }),
                        // Filter attendance by specific event if selected
                        ...(selectedEvent && selectedEvent !== 'all' ? {
                            permanentEventId: Number(selectedEvent)
                        } : {})
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
            }
        });

        // Get training events with attendance
        const trainingEvents = await prisma.trainings.findMany({
            where: eventWhere,
            include: {
                attendance: {
                    where: {
                        status: 'present',
                        ...(dateFrom && {
                            recordedAt: {
                                gte: new Date(dateFrom + 'T00:00:00.000Z'),
                                lte: new Date((dateTo || dateFrom) + 'T23:59:59.999Z')
                            }
                        }),
                        // Filter attendance by specific event if selected
                        ...(selectedEvent && selectedEvent !== 'all' ? {
                            trainingId: Number(selectedEvent)
                        } : {})
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
            }
        });

        const totalAttendance = permanentEvents.reduce((sum, event) => sum + event.attendance.length, 0) +
                               trainingEvents.reduce((sum, event) => sum + event.attendance.length, 0);

        const result = {
            totalAttendance,
            permanentEvents: permanentEvents.length,
            trainingEvents: trainingEvents.length,
            events: [...permanentEvents, ...trainingEvents]
        };
        
        console.log('🔍 Event Attendance Data Result:', {
            selectedEvent,
            dateFrom,
            dateTo,
            totalAttendance: result.totalAttendance,
            permanentEventsCount: result.permanentEvents,
            trainingEventsCount: result.trainingEvents,
            totalEventsCount: result.events.length
        });
        
        return result;
    } catch (error) {
        console.error('Error fetching event attendance data:', error);
        return {
            totalAttendance: 0,
            permanentEvents: 0,
            trainingEvents: 0,
            events: []
        };
    }
}

// Helper function to get designation participation data
async function getDesignationData(where: Record<string, unknown>, selectedDesignation?: string | null) {
    try {
        // Get contributions grouped by designation
        const contributions = await prisma.contribution.findMany({
            where: {
                designationId: selectedDesignation && selectedDesignation !== 'all' ? Number(selectedDesignation) : undefined,
                status: 'completed',
                member: {
                    ...where
                }
            },
            include: {
                contributiondesignation: true,
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
        });

        const totalContributions = contributions.length;
        const totalAmount = contributions.reduce((sum, contrib) => sum + contrib.amount, 0);

        return {
            totalContributions,
            totalAmount,
            contributions
        };
    } catch (error) {
        console.error('Error fetching designation data:', error);
        return {
            totalContributions: 0,
            totalAmount: 0,
            contributions: []
        };
    }
}

// Helper function to get monthly engagement trends
async function getMonthlyEngagementTrends(where: Record<string, unknown>, _dateFrom?: string | null, _dateTo?: string | null) {
    try {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const _currentMonth = new Date().getMonth();
        const trends = [];
        
        for (let i = 11; i >= 0; i--) {
            const monthStart = new Date();
            monthStart.setMonth(monthStart.getMonth() - i);
            monthStart.setDate(1);
            monthStart.setHours(0, 0, 0, 0);
            
            const monthEnd = new Date(monthStart);
            monthEnd.setMonth(monthEnd.getMonth() + 1);
            monthEnd.setDate(0);
            monthEnd.setHours(23, 59, 59, 999);

            // Get event attendance for this month
            const eventAttendance = await prisma.attendance.count({
                where: {
                    status: 'present',
                    recordedAt: {
                        gte: monthStart,
                        lte: monthEnd
                    },
                    member: where
                }
            });

            // Get designation participation for this month
            const designationParticipation = await prisma.contribution.count({
                where: {
                    status: 'completed',
                    createdAt: {
                        gte: monthStart,
                        lte: monthEnd
                    },
                    member: where
                }
            });

            // Get total active members for this month
            const activeMembers = await prisma.member.count({
                where: {
                    ...where,
                    status: 'active',
                    createdAt: {
                        lte: monthEnd
                    }
                }
            });

            const totalEngagement = eventAttendance + designationParticipation;
            const engagementRate = activeMembers > 0 ? Math.round((totalEngagement / activeMembers) * 100) : 0;

            trends.push({
                month: months[monthStart.getMonth()],
                eventAttendance,
                designationParticipation,
                totalEngagement,
                engagementRate,
                activeMembers
            });
        }

        return trends;
    } catch (error) {
        console.error('Error fetching monthly trends:', error);
        return [];
    }
}

// Helper function to get regional engagement data with hierarchical comparisons
async function getRegionalEngagementData(where: Record<string, unknown>, regionId?: string | null, universityId?: string | null, selectedEvent?: string | null, dateFrom?: string | null, dateTo?: string | null) {
    try {
        const comparisonData = [];

        // If a specific region is selected, show university comparison within that region
        if (regionId && regionId !== 'all') {
            const universities = await prisma.university.findMany({
                where: {
                    regionId: Number(regionId)
                },
                include: {
                    member: {
                        where: {
                            ...where,
                            regionId: Number(regionId)
                        }
                    }
                }
            });

            for (const university of universities) {
                // Get event engagement for this university
                const eventEngagement = await prisma.attendance.count({
                    where: {
                        status: 'present',
                        member: {
                            ...where,
                            regionId: Number(regionId),
                            universityId: university.id
                        },
                        // Filter by specific event if selected
                        ...(selectedEvent && selectedEvent !== 'all' ? {
                            OR: [
                                { permanentEventId: Number(selectedEvent) },
                                { trainingId: Number(selectedEvent) }
                            ]
                        } : {}),
                        // Filter by date if provided
                        ...(dateFrom ? {
                            recordedAt: {
                                gte: new Date(dateFrom + 'T00:00:00.000Z'),
                                lte: new Date((dateTo || dateFrom) + 'T23:59:59.999Z')
                            }
                        } : {})
                    }
                });

                // Get designation engagement for this university
                const designationEngagement = await prisma.contribution.count({
                    where: {
                        status: 'completed',
                        member: {
                            ...where,
                            regionId: Number(regionId),
                            universityId: university.id
                        }
                    }
                });

                const totalEngagement = eventEngagement + designationEngagement;
                const engagementRate = university.member.length > 0 ? Math.round((totalEngagement / university.member.length) * 100) : 0;

                comparisonData.push({
                    region: university.name, // Using university name as the label
                    totalEngagement,
                    eventEngagement,
                    designationEngagement,
                    engagementRate
                });
            }
        }
        // If a specific university is selected, show small group comparison within that university
        else if (universityId && universityId !== 'all') {
            const smallGroups = await prisma.smallgroup.findMany({
                where: {
                    universityId: Number(universityId)
                },
                include: {
                    member: {
                        where: {
                            ...where,
                            universityId: Number(universityId)
                        }
                    }
                }
            });

            for (const smallGroup of smallGroups) {
                // Get event engagement for this small group
                const eventEngagement = await prisma.attendance.count({
                    where: {
                        status: 'present',
                        member: {
                            ...where,
                            universityId: Number(universityId),
                            smallGroupId: smallGroup.id
                        },
                        // Filter by specific event if selected
                        ...(selectedEvent && selectedEvent !== 'all' ? {
                            OR: [
                                { permanentEventId: Number(selectedEvent) },
                                { trainingId: Number(selectedEvent) }
                            ]
                        } : {}),
                        // Filter by date if provided
                        ...(dateFrom ? {
                            recordedAt: {
                                gte: new Date(dateFrom + 'T00:00:00.000Z'),
                                lte: new Date((dateTo || dateFrom) + 'T23:59:59.999Z')
                            }
                        } : {})
                    }
                });

                // Get designation engagement for this small group
                const designationEngagement = await prisma.contribution.count({
                    where: {
                        status: 'completed',
                        member: {
                            ...where,
                            universityId: Number(universityId),
                            smallGroupId: smallGroup.id
                        }
                    }
                });

                const totalEngagement = eventEngagement + designationEngagement;
                const engagementRate = smallGroup.member.length > 0 ? Math.round((totalEngagement / smallGroup.member.length) * 100) : 0;

                comparisonData.push({
                    region: smallGroup.name, // Using small group name as the label
                    totalEngagement,
                    eventEngagement,
                    designationEngagement,
                    engagementRate
                });
            }
        }
        // Default: show regional comparison
        else {
            console.log('🔍 Getting regions with where clause:', where);
            const regions = await prisma.region.findMany({
                where: where.regionId ? { id: where.regionId } : {},
                include: {
                    member: {
                        where: where
                    }
                }
            });
            console.log('🔍 Found regions:', regions.length, regions.map(r => ({ id: r.id, name: r.name, memberCount: r.member.length })));

            for (const region of regions) {
                // Get event engagement for this region
                const attendanceWhere = {
                    status: 'present',
                    member: {
                        ...where,
                        regionId: region.id
                    },
                    // Filter by specific event if selected
                    ...(selectedEvent && selectedEvent !== 'all' ? {
                        OR: [
                            { permanentEventId: Number(selectedEvent) },
                            { trainingId: Number(selectedEvent) }
                        ]
                    } : {}),
                    // Filter by date if provided
                    ...(dateFrom ? {
                        recordedAt: {
                            gte: new Date(dateFrom + 'T00:00:00.000Z'),
                            lte: new Date((dateTo || dateFrom) + 'T23:59:59.999Z')
                        }
                    } : {})
                };
                console.log('🔍 Region attendance query for', region.name, ':', attendanceWhere);
                const eventEngagement = await prisma.attendance.count({
                    where: attendanceWhere
                });
                console.log('🔍 Region', region.name, 'event engagement count:', eventEngagement);

                // Get designation engagement for this region
                const designationEngagement = await prisma.contribution.count({
                    where: {
                        status: 'completed',
                        member: {
                            ...where,
                            regionId: region.id
                        }
                    }
                });

                const totalEngagement = eventEngagement + designationEngagement;
                const engagementRate = region.member.length > 0 ? Math.round((totalEngagement / region.member.length) * 100) : 0;

                comparisonData.push({
                    region: region.name,
                    totalEngagement,
                    eventEngagement,
                    designationEngagement,
                    engagementRate
                });
            }
        }

        return comparisonData;
    } catch (error) {
        console.error('Error fetching regional engagement data:', error);
        return [];
    }
}

// Helper function to get engagement type distribution
async function getEngagementTypeDistribution(where: Record<string, unknown>) {
    try {
        const eventAttendance = await prisma.attendance.count({
            where: {
                status: 'present',
                member: where
            }
        });

        const designationParticipation = await prisma.contribution.count({
            where: {
                status: 'completed',
                member: where
            }
        });

        const total = eventAttendance + designationParticipation;

        return [
            {
                name: 'Events',
                value: total > 0 ? Math.round((eventAttendance / total) * 100) : 0,
                color: '#3B82F6',
                count: eventAttendance
            },
            {
                name: 'Designations',
                value: total > 0 ? Math.round((designationParticipation / total) * 100) : 0,
                color: '#10B981',
                count: designationParticipation
            }
        ];
    } catch (error) {
        console.error('Error fetching engagement type distribution:', error);
        return [
            { name: 'Events', value: 0, color: '#3B82F6', count: 0 },
            { name: 'Designations', value: 0, color: '#10B981', count: 0 }
        ];
    }
}

// Helper function to get event engagement levels
async function getEventEngagementLevels(where: Record<string, unknown>) {
    try {
        // Get all members with their engagement counts
        const members = await prisma.member.findMany({
            where,
            include: {
                attendance: {
                    where: {
                        status: 'present'
                    }
                },
                contribution: {
                    where: {
                        status: 'completed'
                    }
                }
            }
        });

        // Calculate engagement levels based on actual participation
        let highEngagement = 0;
        let mediumEngagement = 0;
        let lowEngagement = 0;

        members.forEach(member => {
            const totalEngagement = member.attendance.length + member.contribution.length;
            
            if (totalEngagement >= 5) {
                highEngagement++;
            } else if (totalEngagement >= 2) {
                mediumEngagement++;
            } else {
                lowEngagement++;
            }
        });

        const totalMembers = members.length;
        
        if (totalMembers === 0) {
            return [
                { name: 'High Engagement', value: 0, color: '#10B981', count: 0 },
                { name: 'Medium Engagement', value: 0, color: '#F59E0B', count: 0 },
                { name: 'Low Engagement', value: 0, color: '#EF4444', count: 0 }
            ];
        }

        return [
            {
                name: 'High Engagement',
                value: Math.round((highEngagement / totalMembers) * 100),
                color: '#10B981',
                count: highEngagement
            },
            {
                name: 'Medium Engagement',
                value: Math.round((mediumEngagement / totalMembers) * 100),
                color: '#F59E0B',
                count: mediumEngagement
            },
            {
                name: 'Low Engagement',
                value: Math.round((lowEngagement / totalMembers) * 100),
                color: '#EF4444',
                count: lowEngagement
            }
        ];
    } catch (error) {
        console.error('Error fetching event engagement levels:', error);
        return [
            { name: 'High Engagement', value: 0, color: '#10B981', count: 0 },
            { name: 'Medium Engagement', value: 0, color: '#F59E0B', count: 0 },
            { name: 'Low Engagement', value: 0, color: '#EF4444', count: 0 }
        ];
    }
}

// Helper function to calculate engagement rate
function calculateEngagementRate(eventData: Record<string, unknown>, designationData: Record<string, unknown>): number {
    const totalEngagement = eventData.totalAttendance + designationData.totalContributions;
    const totalMembers = eventData.events.length + designationData.contributions.length;
    
    return totalMembers > 0 ? Math.round((totalEngagement / totalMembers) * 100) : 0;
}

// Helper function to calculate monthly growth
function calculateMonthlyGrowth(trends: Record<string, unknown>[]): number {
    if (trends.length < 2) return 0;
    
    const current = trends[trends.length - 1];
    const previous = trends[trends.length - 2];
    
    if (previous.totalEngagement === 0) return 0;
    
    return Math.round(((current.totalEngagement - previous.totalEngagement) / previous.totalEngagement) * 100);
}

// Helper function to generate sample trends data
function _generateSampleTrends() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    return months.slice(currentMonth - 11, currentMonth + 1).map((month, _index) => ({
        month,
        eventAttendance: Math.floor(Math.random() * 100) + 50,
        designationParticipation: Math.floor(Math.random() * 50) + 20,
        totalEngagement: Math.floor(Math.random() * 150) + 70,
        engagementRate: Math.floor(Math.random() * 30) + 50,
        activeMembers: Math.floor(Math.random() * 200) + 100
    }));
}

// Helper function to check if there's any engagement data in the database
async function checkForAnyEngagementData(where: Record<string, unknown>) {
    try {
        // Check for any attendance records
        const attendanceCount = await prisma.attendance.count({
            where: {
                member: where
            }
        });

        // Check for any contributions
        const contributionCount = await prisma.contribution.count({
            where: {
                member: where
            }
        });

        // Check for any university ministry events
        const eventCount = await prisma.permanentministryevent.count({
            where: {
                ...where,
                ...universityMinistryFilter
            }
        });

        // Check for any trainings
        const trainingCount = await prisma.trainings.count({
            where: where
        });

        return attendanceCount > 0 || contributionCount > 0 || eventCount > 0 || trainingCount > 0;
    } catch (error) {
        console.error('Error checking for engagement data:', error);
        return false;
    }
}

// Helper function to generate sample regional data
function _generateSampleRegionalData() {
    const regions = ['Kigali', 'Northern', 'Southern', 'Eastern', 'Western'];
    
    return regions.map(region => ({
        region,
        totalEngagement: Math.floor(Math.random() * 300) + 100,
        eventEngagement: Math.floor(Math.random() * 200) + 50,
        designationEngagement: Math.floor(Math.random() * 100) + 25,
        engagementRate: Math.floor(Math.random() * 40) + 40
    }));
}
