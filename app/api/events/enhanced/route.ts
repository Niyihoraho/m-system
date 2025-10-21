import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserScope, getTableRLSConditions } from "@/lib/rls";
import { EventPayload } from "@/types/api";

// Enhanced event interface for better attendance integration
interface EnhancedEvent {
  id: number;
  name: string;
  type: string; // 'permanent' or 'training'
  regionId: number | null;
  universityId: number | null;
  smallGroupId: number | null;
  alumniGroupId: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  region?: { id: number; name: string } | null;
  university?: { id: number; name: string } | null;
  smallGroup?: { id: number; name: string } | null;
  alumniGroup?: { id: number; name: string } | null;
  // Attendance statistics
  totalAttendance?: number;
  recentAttendance?: number;
  attendanceRate?: number;
}

// Prisma where clause type for events
interface EventWhereClause {
  id?: number;
  regionId?: number;
  universityId?: number;
  smallGroupId?: number;
  alumniGroupId?: number;
  type?: string;
  isActive?: boolean;
  [key: string]: unknown;
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        const regionId = searchParams.get("regionId");
        const universityId = searchParams.get("universityId");
        const smallGroupId = searchParams.get("smallGroupId");
        const alumniGroupId = searchParams.get("alumniGroupId");
        const type = searchParams.get("type");
        const status = searchParams.get("status"); // 'active', 'inactive', or null for all
        const includeStats = searchParams.get("includeStats") === "true";
        
        // Get user scope for RLS
        const userScope = await getUserScope();
        if (!userScope) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        
        let where: EventWhereClause = {};
        
        // If ID is provided, return specific event with enhanced data
        if (id) {
            const event = await prisma.permanentministryevent.findUnique({
                where: { id: Number(id) },
                include: { 
                    region: { select: { id: true, name: true } },
                    university: { select: { id: true, name: true } },
                    smallgroup: { select: { id: true, name: true } },
                    alumnismallgroup: { select: { id: true, name: true } },
                    attendance: includeStats ? {
                        select: {
                            id: true,
                            status: true,
                            recordedAt: true
                        }
                    } : false
                }
            });

            if (!event) {
                return NextResponse.json({ error: "Event not found" }, { status: 404 });
            }

            // Apply RLS check for specific event
            const rlsConditions = getTableRLSConditions(userScope, 'permanentministryevent');
            const hasAccess = Object.keys(rlsConditions).every(key => {
                if (rlsConditions[key] === null || rlsConditions[key] === undefined) return true;
                return event[key] === rlsConditions[key];
            });

            if (!hasAccess) {
                return NextResponse.json({ error: "Access denied" }, { status: 403 });
            }

            // Transform and enhance the data
            const enhancedEvent: EnhancedEvent = {
                ...event,
                smallGroup: event.smallgroup,
                alumniGroup: event.alumnismallgroup,
                createdAt: event.createdAt.toISOString(),
                updatedAt: event.updatedAt.toISOString()
            };

            // Add attendance statistics if requested
            if (includeStats && event.attendance) {
                const totalAttendance = event.attendance.length;
                const presentCount = event.attendance.filter(a => a.status === 'present').length;
                const recentAttendance = event.attendance.filter(a => {
                    const attendanceDate = new Date(a.recordedAt);
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    return attendanceDate >= thirtyDaysAgo;
                }).length;

                enhancedEvent.totalAttendance = totalAttendance;
                enhancedEvent.recentAttendance = recentAttendance;
                enhancedEvent.attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;
            }

            return NextResponse.json(enhancedEvent, { status: 200 });
        }

        // Apply RLS conditions first
        const initialRlsConditions = getTableRLSConditions(userScope, 'permanentministryevent');
        where = { ...where, ...initialRlsConditions };
        
        // Apply explicit filters if provided (these override RLS for super admin)
        if (userScope.scope === 'superadmin') {
            if (regionId && regionId !== 'all') {
                where.regionId = Number(regionId);
            }
            if (universityId && universityId !== 'all') {
                where.universityId = Number(universityId);
            }
            if (smallGroupId && smallGroupId !== 'all') {
                where.smallGroupId = Number(smallGroupId);
            }
            if (alumniGroupId && alumniGroupId !== 'all') {
                where.alumniGroupId = Number(alumniGroupId);
            }
        }
        
        if (type) {
            where.type = type;
        }
        
        // Filter by status if specified
        if (status && status !== 'all') {
            where.isActive = status === 'active';
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

        // Get both permanent events and training events
        const permanentEvents = await prisma.permanentministryevent.findMany({
            where: {
                ...where,
                ...universityMinistryFilter
            },
            include: { 
                region: { select: { id: true, name: true } },
                university: { select: { id: true, name: true } },
                smallgroup: { select: { id: true, name: true } },
                alumnismallgroup: { select: { id: true, name: true } },
                attendance: includeStats ? {
                    select: {
                        id: true,
                        status: true,
                        recordedAt: true
                    }
                } : false
            },
            orderBy: { createdAt: 'desc' }
        });

        // Get training events with simplified filtering
        let trainingEvents = [];
        try {
            trainingEvents = await prisma.trainings.findMany({
                where: {
                    // Filter for active trainings (those that haven't ended yet or have no end date)
                    OR: [
                        { endDateTime: null },
                        { endDateTime: { gte: new Date() } }
                    ]
                },
                include: { 
                    region: { select: { id: true, name: true } },
                    university: { select: { id: true, name: true } },
                    smallgroup: { select: { id: true, name: true } },
                    alumnismallgroup: { select: { id: true, name: true } },
                    attendance: includeStats ? {
                        select: {
                            id: true,
                            status: true,
                            recordedAt: true
                        }
                    } : false
                },
                orderBy: { startDateTime: 'desc' }
            });
        } catch (error) {
            console.error('Error fetching training events:', error);
            // Continue with empty training events if there's an error
            trainingEvents = [];
        }
        
        // Apply RLS conditions for non-superadmin users
        const rlsConditions = getTableRLSConditions(userScope, 'permanentministryevent');
        const filteredPermanentEvents = permanentEvents.filter(event => {
            return Object.keys(rlsConditions).every(key => {
                if (rlsConditions[key] === null || rlsConditions[key] === undefined) return true;
                return event[key] === rlsConditions[key];
            });
        });

        // Apply RLS for training events
        let filteredTrainingEvents = [];
        try {
            const trainingRlsConditions = getTableRLSConditions(userScope, 'trainings');
            filteredTrainingEvents = trainingEvents.filter(event => {
                return Object.keys(trainingRlsConditions).every(key => {
                    if (trainingRlsConditions[key] === null || trainingRlsConditions[key] === undefined) return true;
                    return event[key] === trainingRlsConditions[key];
                });
            });
        } catch (error) {
            console.error('Error filtering training events:', error);
            filteredTrainingEvents = [];
        }
        
        // Transform and enhance the data for permanent events
        const enhancedPermanentEvents: EnhancedEvent[] = filteredPermanentEvents.map(event => {
            const enhancedEvent: EnhancedEvent = {
                ...event,
                smallGroup: event.smallgroup,
                alumniGroup: event.alumnismallgroup,
                createdAt: event.createdAt.toISOString(),
                updatedAt: event.updatedAt.toISOString(),
                type: 'permanent'
            };

            // Add attendance statistics if requested
            if (includeStats && event.attendance) {
                const totalAttendance = event.attendance.length;
                const presentCount = event.attendance.filter(a => a.status === 'present').length;
                const recentAttendance = event.attendance.filter(a => {
                    const attendanceDate = new Date(a.recordedAt);
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    return attendanceDate >= thirtyDaysAgo;
                }).length;

                enhancedEvent.totalAttendance = totalAttendance;
                enhancedEvent.recentAttendance = recentAttendance;
                enhancedEvent.attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;
            }

            return enhancedEvent;
        });

        // Transform and enhance the data for training events
        const enhancedTrainingEvents: EnhancedEvent[] = filteredTrainingEvents.map(event => {
            // Determine if training is active based on end date
            const isActive = !event.endDateTime || event.endDateTime >= new Date();
            
            const enhancedEvent: EnhancedEvent = {
                id: event.id,
                name: event.name,
                type: 'training',
                regionId: event.regionId,
                universityId: event.universityId,
                smallGroupId: event.smallGroupId,
                alumniGroupId: event.alumniGroupId,
                isActive: isActive,
                createdAt: event.createdAt.toISOString(),
                updatedAt: event.updatedAt.toISOString(),
                region: event.region,
                university: event.university,
                smallGroup: event.smallgroup,
                alumniGroup: event.alumnismallgroup
            };

            // Add attendance statistics if requested
            if (includeStats && event.attendance) {
                const totalAttendance = event.attendance.length;
                const presentCount = event.attendance.filter(a => a.status === 'present').length;
                const recentAttendance = event.attendance.filter(a => {
                    const attendanceDate = new Date(a.recordedAt);
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    return attendanceDate >= thirtyDaysAgo;
                }).length;

                enhancedEvent.totalAttendance = totalAttendance;
                enhancedEvent.recentAttendance = recentAttendance;
                enhancedEvent.attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;
            }

            return enhancedEvent;
        });
        
        // Combine both event types
        const allEvents = [...enhancedPermanentEvents, ...enhancedTrainingEvents];
        
        return NextResponse.json(allEvents, { status: 200 });
    } catch (error) {
        console.error("Error fetching events:", error);
        
        // Fallback: try to return just permanent events if there's an error
        try {
            const fallbackEvents = await prisma.permanentministryevent.findMany({
                where: {
                    isActive: true
                },
                include: { 
                    region: { select: { id: true, name: true } },
                    university: { select: { id: true, name: true } },
                    smallgroup: { select: { id: true, name: true } },
                    alumnismallgroup: { select: { id: true, name: true } }
                },
                orderBy: { createdAt: 'desc' },
                take: 50 // Limit to prevent large responses
            });
            
            const fallbackEnhancedEvents: EnhancedEvent[] = fallbackEvents.map(event => ({
                ...event,
                smallGroup: event.smallgroup,
                alumniGroup: event.alumnismallgroup,
                createdAt: event.createdAt.toISOString(),
                updatedAt: event.updatedAt.toISOString(),
                type: 'permanent'
            }));
            
            return NextResponse.json(fallbackEnhancedEvents, { status: 200 });
        } catch (fallbackError) {
            console.error("Fallback also failed:", fallbackError);
            return NextResponse.json({ error: 'Failed to fetch events', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
        }
    }
}

export async function POST(request: NextRequest) {
    try {
        const body: EventPayload = await request.json();
        console.log('Event creation request body:', body);
        const { name, type, regionId, universityId: _universityId, smallGroupId: _smallGroupId, alumniGroupId: _alumniGroupId, isActive } = body;

        if (!name || name.trim() === '') {
            return NextResponse.json(
                { error: "Event name is required" },
                { status: 400 }
            );
        }

        if (!type || type.trim() === '') {
            return NextResponse.json(
                { error: "Event type is required" },
                { status: 400 }
            );
        }

        // Validate event type enum
        const validTypes = ['bible_study', 'discipleship', 'evangelism', 'cell_meeting', 'alumni_meeting', 'other'];
        if (!validTypes.includes(type)) {
            return NextResponse.json(
                { error: `Invalid event type. Must be one of: ${validTypes.join(', ')}` },
                { status: 400 }
            );
        }

        // Get user scope for RLS and auto-filling scope fields
        const userScope = await getUserScope();
        console.log('User scope:', userScope);
        if (!userScope) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Auto-fill scope fields based on user scope if not provided
        let finalRegionId = regionId;
        let finalUniversityId = _universityId;
        let finalSmallGroupId = _smallGroupId;
        let finalAlumniGroupId = _alumniGroupId;

        // For non-superadmin users, use their scope IDs if fields are not provided
        if (userScope.scope !== 'superadmin') {
            if (!finalRegionId && userScope.regionId) {
                finalRegionId = userScope.regionId;
            }
            if (!finalUniversityId && userScope.universityId) {
                finalUniversityId = userScope.universityId;
            }
            if (!finalSmallGroupId && userScope.smallGroupId) {
                finalSmallGroupId = userScope.smallGroupId;
            }
            if (!finalAlumniGroupId && userScope.alumniGroupId) {
                finalAlumniGroupId = userScope.alumniGroupId;
            }
        }
        
        console.log('Final scope values:', {
            finalRegionId,
            finalUniversityId,
            finalSmallGroupId,
            finalAlumniGroupId
        });

        if (!finalRegionId) {
            return NextResponse.json(
                { error: "Region ID is required" },
                { status: 400 }
            );
        }

        // Verify region exists
        const region = await prisma.region.findUnique({
            where: { id: Number(finalRegionId) }
        });

        if (!region) {
            return NextResponse.json(
                { error: "Region not found" },
                { status: 404 }
            );
        }

        // Verify university exists if provided
        if (finalUniversityId) {
            const university = await prisma.university.findUnique({
                where: { id: finalUniversityId }
            });

            if (!university) {
                return NextResponse.json(
                    { error: "University not found" },
                    { status: 404 }
                );
            }
        }

        // Verify small group exists if provided
        if (finalSmallGroupId) {
            const smallGroup = await prisma.smallgroup.findUnique({
                where: { id: finalSmallGroupId }
            });

            if (!smallGroup) {
                return NextResponse.json(
                    { error: "Small group not found" },
                    { status: 404 }
                );
            }
        }

        // Verify alumni group exists if provided
        if (finalAlumniGroupId) {
            const alumniGroup = await prisma.alumnismallgroup.findUnique({
                where: { id: finalAlumniGroupId }
            });

            if (!alumniGroup) {
                return NextResponse.json(
                    { error: "Alumni group not found" },
                    { status: 404 }
                );
            }
        }

        // Create the event
        const event = await prisma.permanentministryevent.create({
            data: {
                name: name.trim(),
                type: type as any,
                regionId: finalRegionId,
                universityId: finalUniversityId,
                smallGroupId: finalSmallGroupId,
                alumniGroupId: finalAlumniGroupId,
                isActive: isActive !== undefined ? isActive : true,
                updatedAt: new Date()
            },
            include: {
                region: { select: { id: true, name: true } },
                university: { select: { id: true, name: true } },
                smallgroup: { select: { id: true, name: true } },
                alumnismallgroup: { select: { id: true, name: true } }
            }
        });

        // Transform the response to match frontend interface
        const transformedEvent = {
            ...event,
            smallGroup: event.smallgroup,
            alumniGroup: event.alumnismallgroup,
            createdAt: event.createdAt.toISOString(),
            updatedAt: event.updatedAt.toISOString()
        };

        return NextResponse.json(transformedEvent, { status: 201 });
    } catch (error) {
        console.error("Error creating event:", error);
        return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get("id");

        if (!eventId) {
            return NextResponse.json(
                { error: "Event ID is required" },
                { status: 400 }
            );
        }

        const body: EventPayload = await request.json();
        const { name, type, regionId, universityId: _universityId, smallGroupId: _smallGroupId, alumniGroupId: _alumniGroupId, isActive } = body;

        // For partial updates (like status toggle), we don't require all fields
        const isPartialUpdate = Object.keys(body).length === 1 && 'isActive' in body;

        if (!isPartialUpdate) {
            if (!name || name.trim() === '') {
                return NextResponse.json(
                    { error: "Event name is required" },
                    { status: 400 }
                );
            }

            if (!type || type.trim() === '') {
                return NextResponse.json(
                    { error: "Event type is required" },
                    { status: 400 }
                );
            }

            // Validate event type enum
            const validTypes = ['bible_study', 'discipleship', 'evangelism', 'cell_meeting', 'alumni_meeting', 'other'];
            if (!validTypes.includes(type)) {
                return NextResponse.json(
                    { error: `Invalid event type. Must be one of: ${validTypes.join(', ')}` },
                    { status: 400 }
                );
            }
        }

        // Get user scope for RLS
        const userScope = await getUserScope();
        if (!userScope) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if event exists
        const existingEvent = await prisma.permanentministryevent.findUnique({
            where: { id: Number(eventId) }
        });

        if (!existingEvent) {
            return NextResponse.json(
                { error: "Event not found" },
                { status: 404 }
            );
        }

        // Apply RLS check for update
        const rlsConditions = getTableRLSConditions(userScope, 'permanentministryevent');
        const hasAccess = Object.keys(rlsConditions).every(key => {
            if (rlsConditions[key] === null || rlsConditions[key] === undefined) return true;
            return existingEvent[key] === rlsConditions[key];
        });

        if (!hasAccess) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        // Check if status is changing from active to inactive
        const statusChanged = existingEvent.isActive !== (isActive ?? true);

        // For partial updates, use existing event data
        let finalRegionId = regionId || existingEvent.regionId;
        let finalUniversityId = _universityId || existingEvent.universityId;
        let finalSmallGroupId = _smallGroupId || existingEvent.smallGroupId;
        let finalAlumniGroupId = _alumniGroupId || existingEvent.alumniGroupId;

        // For non-superadmin users, use their scope IDs if fields are not provided
        if (userScope.scope !== 'superadmin') {
            if (!finalRegionId && userScope.regionId) {
                finalRegionId = userScope.regionId;
            }
            if (!finalUniversityId && userScope.universityId) {
                finalUniversityId = userScope.universityId;
            }
            if (!finalSmallGroupId && userScope.smallGroupId) {
                finalSmallGroupId = userScope.smallGroupId;
            }
            if (!finalAlumniGroupId && userScope.alumniGroupId) {
                finalAlumniGroupId = userScope.alumniGroupId;
            }
        }

        // Only validate region for full updates
        if (!isPartialUpdate && !finalRegionId) {
            return NextResponse.json(
                { error: "Region ID is required" },
                { status: 400 }
            );
        }

        // Verify region exists
        const region = await prisma.region.findUnique({
            where: { id: Number(finalRegionId) }
        });

        if (!region) {
            return NextResponse.json(
                { error: "Region not found" },
                { status: 404 }
            );
        }

        // Verify region exists (only for full updates or if region is being changed)
        if (!isPartialUpdate || (regionId && regionId !== existingEvent.regionId)) {
            const region = await prisma.region.findUnique({
                where: { id: Number(finalRegionId) }
            });

            if (!region) {
                return NextResponse.json(
                    { error: "Region not found" },
                    { status: 404 }
                );
            }
        }

        // Verify university exists if provided and being changed
        if (finalUniversityId && (!isPartialUpdate || (_universityId && _universityId !== existingEvent.universityId))) {
            const university = await prisma.university.findUnique({
                where: { id: finalUniversityId }
            });

            if (!university) {
                return NextResponse.json(
                    { error: "University not found" },
                    { status: 404 }
                );
            }
        }

        // Verify small group exists if provided and being changed
        if (finalSmallGroupId && (!isPartialUpdate || (_smallGroupId && _smallGroupId !== existingEvent.smallGroupId))) {
            const smallGroup = await prisma.smallgroup.findUnique({
                where: { id: finalSmallGroupId }
            });

            if (!smallGroup) {
                return NextResponse.json(
                    { error: "Small group not found" },
                    { status: 404 }
                );
            }
        }

        // Verify alumni group exists if provided and being changed
        if (finalAlumniGroupId && (!isPartialUpdate || (_alumniGroupId && _alumniGroupId !== existingEvent.alumniGroupId))) {
            const alumniGroup = await prisma.alumnismallgroup.findUnique({
                where: { id: finalAlumniGroupId }
            });

            if (!alumniGroup) {
                return NextResponse.json(
                    { error: "Alumni group not found" },
                    { status: 404 }
                );
            }
        }

        // Prepare update data - only include fields that are being updated
        const updateData: any = {
            updatedAt: new Date()
        };

        if (!isPartialUpdate) {
            updateData.name = name.trim();
            updateData.type = type.trim();
            updateData.regionId = Number(finalRegionId);
            updateData.universityId = finalUniversityId ? Number(finalUniversityId) : null;
            updateData.smallGroupId = finalSmallGroupId ? Number(finalSmallGroupId) : null;
            updateData.alumniGroupId = finalAlumniGroupId ? Number(finalAlumniGroupId) : null;
        }

        // Always update isActive if provided
        if (isActive !== undefined) {
            updateData.isActive = isActive;
        }

        const updatedEvent = await prisma.permanentministryevent.update({
            where: { id: Number(eventId) },
            data: updateData,
            include: {
                region: { select: { id: true, name: true } },
                university: { select: { id: true, name: true } },
                smallgroup: { select: { id: true, name: true } },
                alumnismallgroup: { select: { id: true, name: true } }
            }
        });

        // Transform the data to match the frontend interface (camelCase)
        const transformedEvent = {
            ...updatedEvent,
            smallGroup: updatedEvent.smallgroup,
            alumniGroup: updatedEvent.alumnismallgroup,
            createdAt: updatedEvent.createdAt.toISOString(),
            updatedAt: updatedEvent.updatedAt.toISOString()
        };

        return NextResponse.json(transformedEvent, { status: 200 });
    } catch (error) {
        console.error("Error updating event:", error);
        return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get("id");

        if (!eventId) {
            return NextResponse.json(
                { error: "Event ID is required" },
                { status: 400 }
            );
        }

        // Get user scope for RLS
        const userScope = await getUserScope();
        if (!userScope) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if event exists
        const existingEvent = await prisma.permanentministryevent.findUnique({
            where: { id: Number(eventId) }
        });

        if (!existingEvent) {
            return NextResponse.json(
                { error: "Event not found" },
                { status: 404 }
            );
        }

        // Apply RLS check for delete
        const rlsConditions = getTableRLSConditions(userScope, 'permanentministryevent');
        const hasAccess = Object.keys(rlsConditions).every(key => {
            if (rlsConditions[key] === null || rlsConditions[key] === undefined) return true;
            return existingEvent[key] === rlsConditions[key];
        });

        if (!hasAccess) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        await prisma.permanentministryevent.delete({
            where: { id: Number(eventId) }
        });

        return NextResponse.json(
            { message: "Event deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error deleting event:", error);
        return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
    }
}
