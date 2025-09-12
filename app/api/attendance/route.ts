import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const where: any = {};
        
        // Event and status filters
        if (searchParams.has("eventId")) {
            where.permanentEventId = Number(searchParams.get("eventId"));
        }
        if (searchParams.has("status")) {
            where.status = searchParams.get("status");
        }
        
        // Date filters
        if (searchParams.has("dateFrom") || searchParams.has("dateTo")) {
            where.recordedAt = {};
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
        
        // Member organizational filters
        const hasExplicitFilters = searchParams.has("regionId") || searchParams.has("universityId") || 
            searchParams.has("smallGroupId") || searchParams.has("alumniGroupId");
        
        if (hasExplicitFilters) {
            where.member = {};
            
            if (searchParams.has("regionId")) {
                where.member.regionId = Number(searchParams.get("regionId"));
            }
            if (searchParams.has("universityId")) {
                where.member.universityId = Number(searchParams.get("universityId"));
            }
            if (searchParams.has("smallGroupId")) {
                where.member.smallGroupId = Number(searchParams.get("smallGroupId"));
            }
            if (searchParams.has("alumniGroupId")) {
                where.member.alumniGroupId = Number(searchParams.get("alumniGroupId"));
            }
        }
        
        const attendance = await prisma.attendance.findMany({
            where,
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
                },
                permanentministryevent: { select: { id: true, name: true } },
                trainings: { select: { id: true, name: true } }
            },
            orderBy: { recordedAt: 'desc' }
        });
        return NextResponse.json(attendance, { status: 200 });
    } catch (error) {
        console.error("Error fetching attendance records:", error);
        return NextResponse.json({ error: 'Failed to fetch attendance records' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
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
                // Check if member exists
                const member = await prisma.member.findUnique({
                    where: { id: Number(memberId) }
                });

                if (!member) {
                    results.push({ error: "Member not found", data: record });
                    continue;
                }

                // Check if event exists (if provided)
                if (permanentEventId) {
                    const event = await prisma.permanentministryevent.findUnique({
                        where: { id: Number(permanentEventId) }
                    });

                    if (!event) {
                        results.push({ error: "Event not found", data: record });
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

                const attendanceData: any = {
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
            } catch (error: any) {
                let errorMessage = "Could not create attendance record.";
                if (error.code === 'P2002') {
                    const target = (error.meta?.target as string[]) || [];
                    if (target.includes('permanentEventId')) {
                         errorMessage = "Attendance already recorded for this member and event.";
                    } else if (target.includes('trainingId')) {
                         errorMessage = "Attendance already recorded for this member and training.";
                    } else {
                         errorMessage = "This attendance record already exists.";
                    }
                } else if (error.code === 'P2003') {
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

        // Check if attendance record exists
        const existingAttendance = await prisma.attendance.findUnique({
            where: { id: Number(attendanceId) }
        });

        if (!existingAttendance) {
            return NextResponse.json(
                { error: "Attendance record not found" },
                { status: 404 }
            );
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
        const { searchParams } = new URL(request.url);
        const attendanceId = searchParams.get("id");

        if (!attendanceId) {
            return NextResponse.json(
                { error: "Attendance ID is required" },
                { status: 400 }
            );
        }

        // Check if attendance record exists
        const existingAttendance = await prisma.attendance.findUnique({
            where: { id: Number(attendanceId) }
        });

        if (!existingAttendance) {
            return NextResponse.json(
                { error: "Attendance record not found" },
                { status: 404 }
            );
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