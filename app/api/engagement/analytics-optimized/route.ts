import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserScope, generateRLSConditions } from "@/lib/rls";

// Cache for frequently accessed data (in production, use Redis)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(request: NextRequest) {
    try {
        // Get user scope for RLS
        const userScope = await getUserScope();
        if (!userScope) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        
        // Create cache key based on user scope and filters
        const cacheKey = createCacheKey(userScope, searchParams);
        
        // Check cache first
        const cached = cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return NextResponse.json(cached.data, { status: 200 });
        }

        // Get filter parameters
        const currentLevel = searchParams.get("currentLevel") || 'national';
        const level0Id = searchParams.get("level0Id");
        const level1Id = searchParams.get("level1Id");
        const level2Id = searchParams.get("level2Id");
        const selectedEvent = searchParams.get("selectedEvent");
        const selectedDate = searchParams.get("selectedDate");
        
        // Build optimized RLS conditions
        const rlsConditions = generateRLSConditions(userScope);
        
        // Get analytics data based on current level
        let analytics;
        switch (currentLevel) {
            case 'national':
                analytics = await getNationalAnalytics(rlsConditions, selectedEvent, selectedDate);
                break;
            case 'region':
                analytics = await getRegionalAnalytics(rlsConditions, level0Id, selectedEvent, selectedDate);
                break;
            case 'university':
                analytics = await getUniversityAnalytics(rlsConditions, level0Id, level1Id, selectedEvent, selectedDate);
                break;
            case 'member':
                analytics = await getMemberAnalytics(rlsConditions, level0Id, level1Id, level2Id, selectedEvent, selectedDate);
                break;
            default:
                analytics = await getNationalAnalytics(rlsConditions, selectedEvent, selectedDate);
        }

        // Cache the result
        cache.set(cacheKey, { data: analytics, timestamp: Date.now() });
        
        return NextResponse.json(analytics, { status: 200 });

    } catch (error) {
        console.error("Error fetching optimized engagement analytics:", error);
        return NextResponse.json({ error: 'Failed to fetch engagement analytics' }, { status: 500 });
    }
}

function createCacheKey(userScope: any, searchParams: URLSearchParams): string {
    const params = Array.from(searchParams.entries()).sort();
    return `${userScope.scope}-${userScope.regionId || 'null'}-${userScope.universityId || 'null'}-${userScope.smallGroupId || 'null'}-${JSON.stringify(params)}`;
}

async function getNationalAnalytics(rlsConditions: any, selectedEvent?: string | null, selectedDate?: string | null) {
    // Optimized query with single database call using aggregation
    const analytics = await prisma.$queryRaw`
        WITH engagement_metrics AS (
            SELECT 
                r.id as region_id,
                r.name as region_name,
                COUNT(DISTINCT a.id) as total_attendance,
                COUNT(DISTINCT CASE WHEN a.status = 'present' THEN a.id END) as present_attendance,
                COUNT(DISTINCT c.id) as total_contributions,
                COUNT(DISTINCT CASE WHEN c.status = 'completed' THEN c.id END) as completed_contributions,
                COUNT(DISTINCT m.id) as total_members,
                COUNT(DISTINCT CASE WHEN m.status = 'active' THEN m.id END) as active_members
            FROM region r
            LEFT JOIN member m ON m.regionId = r.id
            LEFT JOIN attendance a ON a.memberId = m.id
            LEFT JOIN contribution c ON c.memberId = m.id
            WHERE r.id = ${rlsConditions.regionId || 'NULL'}
            GROUP BY r.id, r.name
        )
        SELECT 
            region_id,
            region_name,
            total_attendance,
            present_attendance,
            total_contributions,
            completed_contributions,
            total_members,
            active_members,
            CASE 
                WHEN total_attendance > 0 THEN ROUND((present_attendance::float / total_attendance) * 100, 2)
                ELSE 0 
            END as engagement_rate
        FROM engagement_metrics
        ORDER BY engagement_rate DESC
    `;

    return {
        keyMetrics: calculateKeyMetrics(analytics),
        regionalEngagement: analytics.map((item: any) => ({
            region: item.region_name,
            regionId: item.region_id,
            totalEngagement: item.present_attendance + item.completed_contributions,
            eventEngagement: item.present_attendance,
            designationEngagement: item.completed_contributions,
            engagementRate: item.engagement_rate,
            totalMembers: item.total_members,
            activeMembers: item.active_members
        })),
        engagementTrends: await getMonthlyTrends(rlsConditions),
        engagementTypeDistribution: await getEngagementTypeDistribution(rlsConditions),
        eventEngagementLevels: await getEventEngagementLevels(rlsConditions)
    };
}

async function getRegionalAnalytics(rlsConditions: any, regionId?: string | null, selectedEvent?: string | null, selectedDate?: string | null) {
    const analytics = await prisma.$queryRaw`
        WITH university_metrics AS (
            SELECT 
                u.id as university_id,
                u.name as university_name,
                COUNT(DISTINCT a.id) as total_attendance,
                COUNT(DISTINCT CASE WHEN a.status = 'present' THEN a.id END) as present_attendance,
                COUNT(DISTINCT c.id) as total_contributions,
                COUNT(DISTINCT CASE WHEN c.status = 'completed' THEN c.id END) as completed_contributions,
                COUNT(DISTINCT m.id) as total_members
            FROM university u
            LEFT JOIN member m ON m.universityId = u.id AND m.regionId = ${regionId}
            LEFT JOIN attendance a ON a.memberId = m.id
            LEFT JOIN contribution c ON c.memberId = m.id
            WHERE u.regionId = ${regionId}
            GROUP BY u.id, u.name
        )
        SELECT 
            university_id,
            university_name,
            total_attendance,
            present_attendance,
            total_contributions,
            completed_contributions,
            total_members,
            CASE 
                WHEN total_attendance > 0 THEN ROUND((present_attendance::float / total_attendance) * 100, 2)
                ELSE 0 
            END as engagement_rate
        FROM university_metrics
        ORDER BY engagement_rate DESC
    `;

    return {
        keyMetrics: calculateKeyMetrics(analytics),
        universityEngagement: analytics.map((item: any) => ({
            region: 'Region', // Will be filled from navigation stack
            regionId: regionId,
            university: item.university_name,
            universityId: item.university_id,
            totalEngagement: item.present_attendance + item.completed_contributions,
            eventEngagement: item.present_attendance,
            designationEngagement: item.completed_contributions,
            engagementRate: item.engagement_rate,
            totalMembers: item.total_members
        })),
        engagementTrends: await getMonthlyTrends({ ...rlsConditions, regionId: Number(regionId) }),
        engagementTypeDistribution: await getEngagementTypeDistribution({ ...rlsConditions, regionId: Number(regionId) }),
        eventEngagementLevels: await getEventEngagementLevels({ ...rlsConditions, regionId: Number(regionId) })
    };
}

async function getUniversityAnalytics(rlsConditions: any, regionId?: string | null, universityId?: string | null, selectedEvent?: string | null, selectedDate?: string | null) {
    const analytics = await prisma.$queryRaw`
        WITH smallgroup_metrics AS (
            SELECT 
                sg.id as smallgroup_id,
                sg.name as smallgroup_name,
                COUNT(DISTINCT a.id) as total_attendance,
                COUNT(DISTINCT CASE WHEN a.status = 'present' THEN a.id END) as present_attendance,
                COUNT(DISTINCT c.id) as total_contributions,
                COUNT(DISTINCT CASE WHEN c.status = 'completed' THEN c.id END) as completed_contributions,
                COUNT(DISTINCT m.id) as total_members
            FROM smallgroup sg
            LEFT JOIN member m ON m.smallGroupId = sg.id AND m.universityId = ${universityId}
            LEFT JOIN attendance a ON a.memberId = m.id
            LEFT JOIN contribution c ON c.memberId = m.id
            WHERE sg.universityId = ${universityId}
            GROUP BY sg.id, sg.name
        )
        SELECT 
            smallgroup_id,
            smallgroup_name,
            total_attendance,
            present_attendance,
            total_contributions,
            completed_contributions,
            total_members,
            CASE 
                WHEN total_attendance > 0 THEN ROUND((present_attendance::float / total_attendance) * 100, 2)
                ELSE 0 
            END as engagement_rate
        FROM smallgroup_metrics
        ORDER BY engagement_rate DESC
    `;

    return {
        keyMetrics: calculateKeyMetrics(analytics),
        smallGroupEngagement: analytics.map((item: any) => ({
            region: 'Region', // Will be filled from navigation stack
            regionId: regionId,
            university: 'University', // Will be filled from navigation stack
            universityId: universityId,
            smallGroup: item.smallgroup_name,
            smallGroupId: item.smallgroup_id,
            totalEngagement: item.present_attendance + item.completed_contributions,
            eventEngagement: item.present_attendance,
            designationEngagement: item.completed_contributions,
            engagementRate: item.engagement_rate,
            totalMembers: item.total_members
        })),
        engagementTrends: await getMonthlyTrends({ ...rlsConditions, universityId: Number(universityId) }),
        engagementTypeDistribution: await getEngagementTypeDistribution({ ...rlsConditions, universityId: Number(universityId) }),
        eventEngagementLevels: await getEventEngagementLevels({ ...rlsConditions, universityId: Number(universityId) })
    };
}

async function getMemberAnalytics(rlsConditions: any, regionId?: string | null, universityId?: string | null, smallGroupId?: string | null, selectedEvent?: string | null, selectedDate?: string | null) {
    const members = await prisma.member.findMany({
        where: {
            ...rlsConditions,
            smallGroupId: Number(smallGroupId)
        },
        include: {
            region: { select: { id: true, name: true } },
            university: { select: { id: true, name: true } },
            smallgroup: { select: { id: true, name: true } },
            attendance: {
                where: selectedEvent && selectedEvent !== 'all' ? { permanentEventId: Number(selectedEvent) } : {},
                select: {
                    status: true,
                    recordedAt: true
                }
            }
        },
        orderBy: { firstname: 'asc' }
    });

    const memberData = members.map(member => {
        const totalDays = member.attendance.length;
        const attendedDays = member.attendance.filter(a => a.status === 'present').length;
        const attendanceRate = totalDays > 0 ? (attendedDays / totalDays) * 100 : 0;
        
        return {
            memberId: member.id,
            memberName: `${member.firstname || ''} ${member.secondname || ''}`.trim() || 'Unknown Member',
            region: member.region?.name || 'N/A',
            regionId: member.regionId || 0,
            university: member.university?.name || 'N/A',
            universityId: member.universityId || 0,
            smallGroup: member.smallgroup?.name || 'N/A',
            smallGroupId: member.smallGroupId || 0,
            latestAttendanceStatus: member.attendance[0]?.status || 'absent',
            totalAttendanceDays: totalDays,
            totalDaysAttended: attendedDays,
            attendanceRate: Math.round(attendanceRate * 10) / 10,
            lastAttendanceDate: member.attendance[0]?.recordedAt?.toISOString() || null,
            memberSince: member.createdAt.toISOString()
        };
    });

    return {
        keyMetrics: {
            totalMembers: members.length,
            activeMembers: members.filter(m => m.status === 'active').length,
            averageAttendanceRate: memberData.reduce((sum, m) => sum + m.attendanceRate, 0) / memberData.length || 0
        },
        memberData,
        engagementTrends: await getMonthlyTrends({ ...rlsConditions, smallGroupId: Number(smallGroupId) }),
        engagementTypeDistribution: await getEngagementTypeDistribution({ ...rlsConditions, smallGroupId: Number(smallGroupId) }),
        eventEngagementLevels: await getEventEngagementLevels({ ...rlsConditions, smallGroupId: Number(smallGroupId) })
    };
}

function calculateKeyMetrics(data: any[]) {
    const totalEngagement = data.reduce((sum, item) => sum + (item.present_attendance || 0) + (item.completed_contributions || 0), 0);
    const totalMembers = data.reduce((sum, item) => sum + (item.total_members || 0), 0);
    const averageEngagementRate = data.length > 0 ? data.reduce((sum, item) => sum + (item.engagement_rate || 0), 0) / data.length : 0;
    
    return {
        totalEngagement,
        totalMembers,
        averageEngagementRate: Math.round(averageEngagementRate * 10) / 10,
        eventParticipation: data.reduce((sum, item) => sum + (item.present_attendance || 0), 0),
        designationParticipation: data.reduce((sum, item) => sum + (item.completed_contributions || 0), 0),
        monthlyGrowth: 0 // Will be calculated from trends
    };
}

async function getMonthlyTrends(where: any) {
    // Optimized monthly trends query
    const trends = await prisma.$queryRaw`
        WITH monthly_data AS (
            SELECT 
                DATE_TRUNC('month', a.recordedAt) as month,
                COUNT(CASE WHEN a.status = 'present' THEN 1 END) as event_attendance,
                COUNT(CASE WHEN c.status = 'completed' THEN 1 END) as designation_participation
            FROM attendance a
            LEFT JOIN contribution c ON DATE_TRUNC('month', c.createdAt) = DATE_TRUNC('month', a.recordedAt)
            WHERE a.memberId IN (
                SELECT id FROM member WHERE 
                ${where.regionId ? 'regionId = ' + where.regionId : '1=1'} AND
                ${where.universityId ? 'universityId = ' + where.universityId : '1=1'} AND
                ${where.smallGroupId ? 'smallGroupId = ' + where.smallGroupId : '1=1'}
            )
            AND a.recordedAt >= NOW() - INTERVAL '12 months'
            GROUP BY DATE_TRUNC('month', a.recordedAt)
            ORDER BY month
        )
        SELECT 
            TO_CHAR(month, 'Mon') as month,
            COALESCE(event_attendance, 0) as event_attendance,
            COALESCE(designation_participation, 0) as designation_participation,
            COALESCE(event_attendance, 0) + COALESCE(designation_participation, 0) as total_engagement,
            CASE 
                WHEN COUNT(*) OVER() > 0 THEN ROUND((COALESCE(event_attendance, 0) + COALESCE(designation_participation, 0))::float / COUNT(*) OVER() * 100, 2)
                ELSE 0 
            END as engagement_rate
        FROM monthly_data
    `;

    return trends;
}

async function getEngagementTypeDistribution(where: any) {
    const eventCount = await prisma.attendance.count({
        where: {
            status: 'present',
            member: where
        }
    });

    const designationCount = await prisma.contribution.count({
        where: {
            status: 'completed',
            member: where
        }
    });

    const total = eventCount + designationCount;

    return [
        {
            name: 'Events',
            value: total > 0 ? Math.round((eventCount / total) * 100) : 0,
            color: '#3B82F6',
            count: eventCount
        },
        {
            name: 'Designations',
            value: total > 0 ? Math.round((designationCount / total) * 100) : 0,
            color: '#10B981',
            count: designationCount
        }
    ];
}

async function getEventEngagementLevels(where: any) {
    const members = await prisma.member.findMany({
        where,
        include: {
            attendance: { where: { status: 'present' } },
            contribution: { where: { status: 'completed' } }
        }
    });

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
}

