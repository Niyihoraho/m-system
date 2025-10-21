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
        
        const where: Record<string, unknown> = {};
        
        // Event and status filters
        if (searchParams.has("eventId") && searchParams.get("eventId") !== "all") {
            const eventId = Number(searchParams.get("eventId"));
            where.OR = [
                { permanentEventId: eventId },
                { trainingId: eventId }
            ];
        }
        if (searchParams.has("status") && searchParams.get("status") !== "all") {
            where.status = searchParams.get("status");
        }
        
        // Enhanced date filters with professional options
        if (searchParams.has("dateFrom") || searchParams.has("dateTo") || searchParams.has("dateRange")) {
            where.recordedAt = {};
            
            // Handle predefined date ranges
            if (searchParams.has("dateRange") && searchParams.get("dateRange") !== "all") {
                const dateRange = searchParams.get("dateRange");
                const { dateFrom, dateTo } = getDateRangeFromPredefined(dateRange!);
                
                if (dateFrom) {
                    const fromDate = new Date(dateFrom);
                    fromDate.setHours(0, 0, 0, 0);
                    where.recordedAt.gte = fromDate;
                }
                
                if (dateTo) {
                    const toDate = new Date(dateTo);
                    toDate.setHours(23, 59, 59, 999);
                    where.recordedAt.lte = toDate;
                }
            } else {
                // Handle custom date range
                if (searchParams.has("dateFrom") && searchParams.get("dateFrom")) {
                    const dateFrom = new Date(searchParams.get("dateFrom")!);
                    dateFrom.setHours(0, 0, 0, 0);
                    where.recordedAt.gte = dateFrom;
                }
                if (searchParams.has("dateTo") && searchParams.get("dateTo")) {
                    const dateTo = new Date(searchParams.get("dateTo")!);
                    dateTo.setHours(23, 59, 59, 999);
                    where.recordedAt.lte = dateTo;
                }
            }
        }
        
        // Apply RLS conditions for member filters
        const memberRLSConditions = getTableRLSConditions(userScope, 'member');
        where.member = { ...memberRLSConditions };
        
        // Override with explicit filters for super admin
        if (userScope.scope === 'superadmin') {
            const hasExplicitFilters = (searchParams.has("regionId") && searchParams.get("regionId") !== "" && searchParams.get("regionId") !== "all") || 
                (searchParams.has("universityId") && searchParams.get("universityId") !== "" && searchParams.get("universityId") !== "all") || 
                (searchParams.has("smallGroupId") && searchParams.get("smallGroupId") !== "" && searchParams.get("smallGroupId") !== "all") || 
                (searchParams.has("alumniGroupId") && searchParams.get("alumniGroupId") !== "" && searchParams.get("alumniGroupId") !== "all");
            
            if (hasExplicitFilters) {
                where.member = {};
                
                if (searchParams.has("regionId") && searchParams.get("regionId") !== "" && searchParams.get("regionId") !== "all") {
                    where.member.regionId = Number(searchParams.get("regionId"));
                }
                if (searchParams.has("universityId") && searchParams.get("universityId") !== "" && searchParams.get("universityId") !== "all") {
                    where.member.universityId = Number(searchParams.get("universityId"));
                }
                if (searchParams.has("smallGroupId") && searchParams.get("smallGroupId") !== "" && searchParams.get("smallGroupId") !== "all") {
                    where.member.smallGroupId = Number(searchParams.get("smallGroupId"));
                }
                if (searchParams.has("alumniGroupId") && searchParams.get("alumniGroupId") !== "" && searchParams.get("alumniGroupId") !== "all") {
                    where.member.alumniGroupId = Number(searchParams.get("alumniGroupId"));
                }
            }
        }
        
        // Check if date filters are applied
        const hasDateFilters = searchParams.has("dateFrom") || searchParams.has("dateTo");
        
        let attendance;
        
        if (hasDateFilters) {
            // If date filters are applied, show all records within the date range (no deduplication)
            attendance = await prisma.attendance.findMany({
                where,
                include: {
                    member: { 
                        select: { 
                            id: true, 
                            firstname: true, 
                            secondname: true,
                            email: true,
                            regionId: true,
                            universityId: true,
                            smallGroupId: true,
                            alumniGroupId: true
                        } 
                    },
                    permanentministryevent: { select: { id: true, name: true } },
                    trainings: { select: { id: true, name: true } }
                },
                orderBy: { recordedAt: 'desc' }
            });
        } else {
            // If no date filters, deduplicate to show only latest attendance per member/event
            const allAttendance = await prisma.attendance.findMany({
                where,
                include: {
                    member: { 
                        select: { 
                            id: true, 
                            firstname: true, 
                            secondname: true,
                            email: true,
                            regionId: true,
                            universityId: true,
                            smallGroupId: true,
                            alumniGroupId: true
                        } 
                    },
                    permanentministryevent: { select: { id: true, name: true } },
                    trainings: { select: { id: true, name: true } }
                },
                orderBy: { recordedAt: 'desc' }
            });

            // Deduplicate: Keep only the latest record for each member/event combination
            const attendanceMap = new Map();
            
            for (const record of allAttendance) {
                const key = `${record.memberId}-${record.permanentEventId || record.trainingId}`;
                
                if (!attendanceMap.has(key)) {
                    attendanceMap.set(key, record);
                }
            }
            
            attendance = Array.from(attendanceMap.values());
        }
        
        return NextResponse.json(attendance, { status: 200 });
    } catch (error) {
        console.error("Error fetching attendance records:", error);
        return NextResponse.json({ error: 'Failed to fetch attendance records' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        // Get user scope for RLS
        const userScope = await getUserScope();
        if (!userScope) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        
        const body = await request.json();
        
        if (!Array.isArray(body)) {
            return NextResponse.json({ error: "Expected an array of attendance records" }, { status: 400 });
        }

        const results = [];
        for (const record of body) {
            const { memberId, status, permanentEventId, trainingId, notes } = record;

            if (!memberId) {
                results.push({ error: "Member ID is required", data: record });
                continue;
            }

            if (!status || !['present', 'absent', 'excused'].includes(status)) {
                results.push({ error: "Valid status (present, absent, excused) is required", data: record });
                continue;
            }

            if (!permanentEventId && !trainingId) {
                results.push({ error: "Either permanent event ID or training ID is required", data: record });
                continue;
            }

            try {
                // Check if member exists and user has access
                const member = await prisma.member.findUnique({
                    where: { id: Number(memberId) }
                });

                if (!member) {
                    results.push({ error: "Member not found", data: record });
                    continue;
                }

                // Apply RLS check for member access
                const memberRLSConditions = getTableRLSConditions(userScope, 'member');
                const hasMemberAccess = Object.keys(memberRLSConditions).every(key => {
                    if (memberRLSConditions[key] === null || memberRLSConditions[key] === undefined) return true;
                    return member[key] === memberRLSConditions[key];
                });

                if (!hasMemberAccess) {
                    results.push({ error: "Access denied to member", data: record });
                    continue;
                }

                // Check if event exists and user has access (if provided)
                if (permanentEventId) {
                    const event = await prisma.permanentministryevent.findUnique({
                        where: { id: Number(permanentEventId) }
                    });

                    if (!event) {
                        results.push({ error: "Event not found", data: record });
                        continue;
                    }

                    // Apply RLS check for event access
                    const eventRLSConditions = getTableRLSConditions(userScope, 'permanentministryevent');
                    const hasEventAccess = Object.keys(eventRLSConditions).every(key => {
                        if (eventRLSConditions[key] === null || eventRLSConditions[key] === undefined) return true;
                        return event[key] === eventRLSConditions[key];
                    });

                    if (!hasEventAccess) {
                        results.push({ error: "Access denied to event", data: record });
                        continue;
                    }
                }

                // Check if training exists (if provided)
                if (trainingId) {
                    const training = await prisma.trainings.findUnique({
                        where: { id: Number(trainingId) }
                    });

                    if (!training) {
                        results.push({ error: "Training not found", data: record });
                        continue;
                    }
                }

                const attendanceData: Record<string, unknown> = {
                    memberId: Number(memberId),
                    status: status,
                    notes: notes || null,
                };
                
                if (permanentEventId) attendanceData.permanentEventId = Number(permanentEventId);
                if (trainingId) attendanceData.trainingId = Number(trainingId);

                const created = await prisma.attendance.create({
                    data: attendanceData,
                });
            
                results.push({ success: true, data: created });
            } catch (error: unknown) {
                let errorMessage = "Could not create attendance record.";
                if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
                    const target = (error.meta && typeof error.meta === 'object' && 'target' in error.meta ? error.meta.target as string[] : []) || [];
                    if (target.includes('permanentEventId')) {
                         errorMessage = "Attendance already recorded for this member and event.";
                    } else if (target.includes('trainingId')) {
                         errorMessage = "Attendance already recorded for this member and training.";
                    } else {
                         errorMessage = "This attendance record already exists.";
                    }
                } else if (error && typeof error === 'object' && 'code' in error && error.code === 'P2003') {
                    errorMessage = "The specified member, event, or training does not exist.";
                }
                results.push({ error: errorMessage, data: record });
            }
        }
        return NextResponse.json({ results }, { status: 201 });
    } catch (error) {
        console.error("Error creating attendance records:", error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        // Get user scope for RLS
        const userScope = await getUserScope();
        if (!userScope) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const attendanceId = searchParams.get("id");

        if (!attendanceId) {
            return NextResponse.json(
                { error: "Attendance ID is required" },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { status, notes } = body;

        if (!status || !['present', 'absent', 'excused'].includes(status)) {
            return NextResponse.json(
                { error: "Valid status (present, absent, excused) is required" },
                { status: 400 }
            );
        }

        // Check if attendance record exists and user has access
        const existingAttendance = await prisma.attendance.findUnique({
            where: { id: Number(attendanceId) },
            include: {
                member: { select: { regionId: true, universityId: true, smallGroupId: true, alumniGroupId: true } }
            }
        });

        if (!existingAttendance) {
            return NextResponse.json(
                { error: "Attendance record not found" },
                { status: 404 }
            );
        }

        // Apply RLS check for attendance record access
        const memberRLSConditions = getTableRLSConditions(userScope, 'member');
        const hasMemberAccess = Object.keys(memberRLSConditions).every(key => {
            if (memberRLSConditions[key] === null || memberRLSConditions[key] === undefined) return true;
            return existingAttendance.member[key] === memberRLSConditions[key];
        });

        if (!hasMemberAccess) {
            return NextResponse.json({ error: "Access denied to attendance record" }, { status: 403 });
        }

        const updatedAttendance = await prisma.attendance.update({
            where: { id: Number(attendanceId) },
            data: {
                status: status,
                notes: notes || null,
            },
            include: {
                member: { select: { id: true, firstname: true, secondname: true } },
                permanentministryevent: { select: { id: true, name: true } },
                trainings: { select: { id: true, name: true } }
            }
        });

        return NextResponse.json(updatedAttendance, { status: 200 });
    } catch (error) {
        console.error("Error updating attendance record:", error);
        return NextResponse.json({ error: 'Failed to update attendance record' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        // Get user scope for RLS
        const userScope = await getUserScope();
        if (!userScope) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const attendanceId = searchParams.get("id");

        if (!attendanceId) {
            return NextResponse.json(
                { error: "Attendance ID is required" },
                { status: 400 }
            );
        }

        // Check if attendance record exists and user has access
        const existingAttendance = await prisma.attendance.findUnique({
            where: { id: Number(attendanceId) },
            include: {
                member: { select: { regionId: true, universityId: true, smallGroupId: true, alumniGroupId: true } }
            }
        });

        if (!existingAttendance) {
            return NextResponse.json(
                { error: "Attendance record not found" },
                { status: 404 }
            );
        }

        // Apply RLS check for attendance record access
        const memberRLSConditions = getTableRLSConditions(userScope, 'member');
        const hasMemberAccess = Object.keys(memberRLSConditions).every(key => {
            if (memberRLSConditions[key] === null || memberRLSConditions[key] === undefined) return true;
            return existingAttendance.member[key] === memberRLSConditions[key];
        });

        if (!hasMemberAccess) {
            return NextResponse.json({ error: "Access denied to attendance record" }, { status: 403 });
        }

        await prisma.attendance.delete({
            where: { id: Number(attendanceId) }
        });

        return NextResponse.json(
            { message: "Attendance record deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error deleting attendance record:", error);
        return NextResponse.json({ error: 'Failed to delete attendance record' }, { status: 500 });
    }
}

/**
 * Get date range from predefined range identifier
 */
function getDateRangeFromPredefined(rangeId: string): { dateFrom: string | null; dateTo: string | null } {
    const now = new Date();
    // Get today's date in YYYY-MM-DD format to match database dates
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    switch (rangeId) {
        case 'today':
            return {
                dateFrom: todayStr,
                dateTo: todayStr
            };
        case 'yesterday':
            const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            return {
                dateFrom: yesterdayStr,
                dateTo: yesterdayStr
            };
        case 'last7days':
            const last7Days = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
            return {
                dateFrom: last7Days.toISOString().split('T')[0],
                dateTo: todayStr
            };
        case 'last14days':
            const last14Days = new Date(today.getTime() - 13 * 24 * 60 * 60 * 1000);
            return {
                dateFrom: last14Days.toISOString().split('T')[0],
                dateTo: todayStr
            };
        case 'last30days':
            const last30Days = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000);
            return {
                dateFrom: last30Days.toISOString().split('T')[0],
                dateTo: todayStr
            };
        case 'thisweek':
            return {
                dateFrom: getWeekStart(today).toISOString().split('T')[0],
                dateTo: getWeekEnd(today).toISOString().split('T')[0]
            };
        case 'lastweek':
            const lastWeekStart = getWeekStart(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000));
            const lastWeekEnd = getWeekEnd(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000));
            return {
                dateFrom: lastWeekStart.toISOString().split('T')[0],
                dateTo: lastWeekEnd.toISOString().split('T')[0]
            };
        case 'thismonth':
            return {
                dateFrom: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0],
                dateTo: new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]
            };
        case 'lastmonth':
            return {
                dateFrom: new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0],
                dateTo: new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0]
            };
        case 'last3months':
            return {
                dateFrom: new Date(today.getFullYear(), today.getMonth() - 3, 1).toISOString().split('T')[0],
                dateTo: today.toISOString().split('T')[0]
            };
        case 'last6months':
            return {
                dateFrom: new Date(today.getFullYear(), today.getMonth() - 6, 1).toISOString().split('T')[0],
                dateTo: today.toISOString().split('T')[0]
            };
        case 'thisyear':
            return {
                dateFrom: new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0],
                dateTo: new Date(today.getFullYear(), 11, 31).toISOString().split('T')[0]
            };
        default:
            return { dateFrom: null, dateTo: null };
    }
}

/**
 * Get the start of the week (Monday) for a given date
 */
function getWeekStart(date: Date): Date {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(date.setDate(diff));
}

/**
 * Get the end of the week (Sunday) for a given date
 */
function getWeekEnd(date: Date): Date {
    const weekStart = getWeekStart(new Date(date));
    return new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
}