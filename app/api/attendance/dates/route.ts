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
        
        const { searchParams } = new URL(request.url);
        
        // Build where clause with RLS
        const where: Record<string, unknown> = {};
        const conditions: any[] = [];
        
        // Apply RLS - users can only see attendance records within their scope
        if (userScope.scope !== 'superadmin') {
            try {
                // For attendance records, we need to filter by member's scope
                const memberConditions: any = {};
                
                if (userScope.smallGroupId) {
                    memberConditions.smallGroupId = userScope.smallGroupId;
                } else if (userScope.universityId) {
                    memberConditions.universityId = userScope.universityId;
                } else if (userScope.regionId) {
                    memberConditions.regionId = userScope.regionId;
                }
                
                if (Object.keys(memberConditions).length > 0) {
                    conditions.push({
                        member: memberConditions
                    });
                }
                
                console.log('Member conditions for RLS:', memberConditions);
            } catch (rlsError) {
                console.error('Error getting RLS conditions:', rlsError);
            }
        }

        // Event filter
        if (searchParams.has("eventId") && searchParams.get("eventId") !== "all") {
            const eventId = Number(searchParams.get("eventId"));
            conditions.push({
                OR: [
                    { permanentEventId: eventId },
                    { trainingId: eventId }
                ]
            });
        }

        // Combine all conditions
        if (conditions.length > 0) {
            where.AND = conditions;
        }

        // Debug logging
        console.log('Attendance dates API - User scope:', userScope.scope);
        console.log('Attendance dates API - Where clause:', JSON.stringify(where, null, 2));

        // Scope filters for superadmin
        if (userScope.scope === 'superadmin') {
            const memberConditions: any = {};
            
            if (searchParams.has("regionId") && searchParams.get("regionId") !== "all") {
                const regionId = Number(searchParams.get("regionId"));
                memberConditions.regionId = regionId;
            }
            if (searchParams.has("universityId") && searchParams.get("universityId") !== "all") {
                const universityId = Number(searchParams.get("universityId"));
                memberConditions.universityId = universityId;
            }
            if (searchParams.has("smallGroupId") && searchParams.get("smallGroupId") !== "all") {
                const smallGroupId = Number(searchParams.get("smallGroupId"));
                memberConditions.smallGroupId = smallGroupId;
            }
            if (searchParams.has("alumniGroupId") && searchParams.get("alumniGroupId") !== "all") {
                const alumniGroupId = Number(searchParams.get("alumniGroupId"));
                memberConditions.alumniGroupId = alumniGroupId;
            }
            
            if (Object.keys(memberConditions).length > 0) {
                conditions.push({
                    member: memberConditions
                });
            }
        }

        // Get unique dates from attendance records
        let attendanceRecords;
        try {
            attendanceRecords = await prisma.attendance.findMany({
                where,
            select: {
                recordedAt: true
            },
            orderBy: {
                recordedAt: 'desc'
            }
        });
        } catch (dbError) {
            console.error('Database error:', dbError);
            // If there's a database error, return empty dates instead of crashing
            return NextResponse.json({ 
                dates: [],
                total: 0,
                error: 'Database query failed'
            });
        }

        console.log('Attendance dates API - Found records:', attendanceRecords.length);

        // Extract unique dates (YYYY-MM-DD format)
        const uniqueDates = Array.from(
            new Set(
                attendanceRecords.map(record => 
                    new Date(record.recordedAt).toISOString().split('T')[0]
                )
            )
        );

        console.log('Attendance dates API - Unique dates:', uniqueDates);
        
        return NextResponse.json({
            dates: uniqueDates,
            total: uniqueDates.length
        });
        
    } catch (error) {
        console.error("Error fetching attendance dates:", error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}