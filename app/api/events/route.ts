import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserScope, getTableRLSConditions } from "@/lib/rls";
import { EventPayload } from "@/types/api";

// Prisma where clause type for events
interface EventWhereClause {
  id?: number;
  regionId?: number;
  universityId?: number;
  smallGroupId?: number;
  alumniGroupId?: number;
  type?: string;
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
        
        // Get user scope for RLS
        const userScope = await getUserScope();
        if (!userScope) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        
        let where: EventWhereClause = {};
        
        // If ID is provided, return specific event
        if (id) {
            const event = await prisma.permanentministryevent.findUnique({
                where: { id: Number(id) },
                include: { 
                    region: { select: { id: true, name: true } },
                    university: { select: { id: true, name: true } },
                    smallgroup: { select: { id: true, name: true } },
                    alumnismallgroup: { select: { id: true, name: true } }
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

            // Transform the data to match the frontend interface (camelCase)
            const transformedEvent = {
                ...event,
                smallGroup: event.smallgroup,
                alumniGroup: event.alumnismallgroup
            };

            return NextResponse.json([transformedEvent], { status: 200 });
        }
        
        // Apply RLS conditions first
        const initialRlsConditions = getTableRLSConditions(userScope, 'permanentministryevent');
        where = { ...where, ...initialRlsConditions };
        
        // Apply explicit filters if provided (these override RLS for super admin)
        if (userScope.scope === 'superadmin') {
            if (regionId && regionId !== "") {
                where.regionId = Number(regionId);
            }
            if (universityId && universityId !== "") {
                where.universityId = Number(universityId);
            }
            if (smallGroupId && smallGroupId !== "") {
                where.smallGroupId = Number(smallGroupId);
            }
            if (alumniGroupId && alumniGroupId !== "") {
                where.alumniGroupId = Number(alumniGroupId);
            }
        }
        if (type) {
            where.type = type;
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

        const events = await prisma.permanentministryevent.findMany({
            where: {
                ...where,
                ...universityMinistryFilter,
                isActive: true  // Only return active events for the filter dropdown
            },
            include: { 
                region: { select: { id: true, name: true } },
                university: { select: { id: true, name: true } },
                smallgroup: { select: { id: true, name: true } },
                alumnismallgroup: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        
        // Apply RLS conditions for non-superadmin users
        const postQueryRlsConditions = getTableRLSConditions(userScope, 'permanentministryevent');
        const filteredEvents = events.filter(event => {
            return Object.keys(postQueryRlsConditions).every(key => {
                if (postQueryRlsConditions[key] === null || postQueryRlsConditions[key] === undefined) return true;
                return event[key] === postQueryRlsConditions[key];
            });
        });
        
        // Transform the data to match the frontend interface (camelCase)
        const transformedEvents = filteredEvents.map(event => ({
            ...event,
            smallGroup: event.smallgroup,
            alumniGroup: event.alumnismallgroup
        }));
        
        return NextResponse.json(transformedEvents, { status: 200 });
    } catch (error) {
        console.error("Error fetching events:", error);
        return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
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

        // If university is provided, verify it exists and belongs to the region
        if (finalUniversityId) {
            const university = await prisma.university.findUnique({
                where: { id: Number(finalUniversityId) }
            });

            if (!university) {
                return NextResponse.json(
                    { error: "University not found" },
                    { status: 404 }
                );
            }

            if (university.regionId !== Number(finalRegionId)) {
                return NextResponse.json(
                    { error: "University does not belong to the selected region" },
                    { status: 400 }
                );
            }
        }

        // If small group is provided, verify it exists and belongs to the university/region
        if (finalSmallGroupId) {
            const smallGroup = await prisma.smallgroup.findUnique({
                where: { id: Number(finalSmallGroupId) }
            });

            if (!smallGroup) {
                return NextResponse.json(
                    { error: "Small group not found" },
                    { status: 404 }
                );
            }

            if (smallGroup.regionId !== Number(finalRegionId)) {
                return NextResponse.json(
                    { error: "Small group does not belong to the selected region" },
                    { status: 400 }
                );
            }

            if (finalUniversityId && smallGroup.universityId !== Number(finalUniversityId)) {
                return NextResponse.json(
                    { error: "Small group does not belong to the selected university" },
                    { status: 400 }
                );
            }
        }

        // If alumni group is provided, verify it exists and belongs to the region
        if (finalAlumniGroupId) {
            const alumniGroup = await prisma.alumnismallgroup.findUnique({
                where: { id: Number(finalAlumniGroupId) }
            });

            if (!alumniGroup) {
                return NextResponse.json(
                    { error: "Alumni group not found" },
                    { status: 404 }
                );
            }

            if (alumniGroup.regionId !== Number(finalRegionId)) {
                return NextResponse.json(
                    { error: "Alumni group does not belong to the selected region" },
                    { status: 400 }
                );
            }
        }

        const newEvent = await prisma.permanentministryevent.create({
            data: {
                name: name.trim(),
                type: type.trim(),
                regionId: Number(finalRegionId),
                universityId: finalUniversityId ? Number(finalUniversityId) : null,
                smallGroupId: finalSmallGroupId ? Number(finalSmallGroupId) : null,
                alumniGroupId: finalAlumniGroupId ? Number(finalAlumniGroupId) : null,
                isActive: isActive ?? true,
                updatedAt: new Date()
            },
            include: {
                region: { select: { id: true, name: true } },
                university: { select: { id: true, name: true } },
                smallgroup: { select: { id: true, name: true } },
                alumnismallgroup: { select: { id: true, name: true } }
            }
        });

        // Transform the data to match the frontend interface (camelCase)
        const transformedEvent = {
            ...newEvent,
            smallGroup: newEvent.smallgroup,
            alumniGroup: newEvent.alumnismallgroup
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

        if (!regionId) {
            return NextResponse.json(
                { error: "Region ID is required" },
                { status: 400 }
            );
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

        // Set final values for scope fields
        let finalRegionId = regionId;
        let finalUniversityId = _universityId;
        let finalSmallGroupId = _smallGroupId;
        let finalAlumniGroupId = _alumniGroupId;

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

        // If university is provided, verify it exists and belongs to the region
        if (finalUniversityId) {
            const university = await prisma.university.findUnique({
                where: { id: Number(finalUniversityId) }
            });

            if (!university) {
                return NextResponse.json(
                    { error: "University not found" },
                    { status: 404 }
                );
            }

            if (university.regionId !== Number(finalRegionId)) {
                return NextResponse.json(
                    { error: "University does not belong to the selected region" },
                    { status: 400 }
                );
            }
        }

        // If small group is provided, verify it exists and belongs to the university/region
        if (finalSmallGroupId) {
            const smallGroup = await prisma.smallgroup.findUnique({
                where: { id: Number(finalSmallGroupId) }
            });

            if (!smallGroup) {
                return NextResponse.json(
                    { error: "Small group not found" },
                    { status: 404 }
                );
            }

            if (smallGroup.regionId !== Number(finalRegionId)) {
                return NextResponse.json(
                    { error: "Small group does not belong to the selected region" },
                    { status: 400 }
                );
            }

            if (finalUniversityId && smallGroup.universityId !== Number(finalUniversityId)) {
                return NextResponse.json(
                    { error: "Small group does not belong to the selected university" },
                    { status: 400 }
                );
            }
        }

        // If alumni group is provided, verify it exists and belongs to the region
        if (finalAlumniGroupId) {
            const alumniGroup = await prisma.alumnismallgroup.findUnique({
                where: { id: Number(finalAlumniGroupId) }
            });

            if (!alumniGroup) {
                return NextResponse.json(
                    { error: "Alumni group not found" },
                    { status: 404 }
                );
            }

            if (alumniGroup.regionId !== Number(finalRegionId)) {
                return NextResponse.json(
                    { error: "Alumni group does not belong to the selected region" },
                    { status: 400 }
                );
            }
        }

        // Check if status is changing from active to inactive
        const statusChanged = existingEvent.isActive !== (isActive ?? true);
        
        const updatedEvent = await prisma.permanentministryevent.update({
            where: { id: Number(eventId) },
            data: {
                name: name.trim(),
                type: type.trim(),
                regionId: Number(finalRegionId),
                universityId: finalUniversityId ? Number(finalUniversityId) : null,
                smallGroupId: finalSmallGroupId ? Number(finalSmallGroupId) : null,
                alumniGroupId: finalAlumniGroupId ? Number(finalAlumniGroupId) : null,
                isActive: isActive ?? true,
                // Update timestamp when status changes or any field changes
                updatedAt: new Date()
            },
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
            alumniGroup: updatedEvent.alumnismallgroup
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