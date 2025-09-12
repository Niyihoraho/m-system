import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        const regionId = searchParams.get("regionId");
        const universityId = searchParams.get("universityId");
        const smallGroupId = searchParams.get("smallGroupId");
        const alumniGroupId = searchParams.get("alumniGroupId");
        const type = searchParams.get("type");
        
        let where: any = {};
        
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

            // Transform the data to match the frontend interface (camelCase)
            const transformedEvent = {
                ...event,
                smallGroup: event.smallgroup,
                alumniGroup: event.alumnismallgroup
            };

            return NextResponse.json([transformedEvent], { status: 200 });
        }
        
        // Apply explicit filters if provided
        if (regionId) {
            where.regionId = Number(regionId);
        }
        if (universityId) {
            where.universityId = Number(universityId);
        }
        if (smallGroupId) {
            where.smallGroupId = Number(smallGroupId);
        }
        if (alumniGroupId) {
            where.alumniGroupId = Number(alumniGroupId);
        }
        if (type) {
            where.type = type;
        }
        
        const events = await prisma.permanentministryevent.findMany({
            where,
            include: { 
                region: { select: { id: true, name: true } },
                university: { select: { id: true, name: true } },
                smallgroup: { select: { id: true, name: true } },
                alumnismallgroup: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        
        // Transform the data to match the frontend interface (camelCase)
        const transformedEvents = events.map(event => ({
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
        const body = await request.json();
        const { name, type, regionId, universityId, smallGroupId, alumniGroupId, isActive } = body;

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

        if (!regionId) {
            return NextResponse.json(
                { error: "Region ID is required" },
                { status: 400 }
            );
        }

        // Verify region exists
        const region = await prisma.region.findUnique({
            where: { id: Number(regionId) }
        });

        if (!region) {
            return NextResponse.json(
                { error: "Region not found" },
                { status: 404 }
            );
        }

        // If university is provided, verify it exists and belongs to the region
        if (universityId) {
            const university = await prisma.university.findUnique({
                where: { id: Number(universityId) }
            });

            if (!university) {
                return NextResponse.json(
                    { error: "University not found" },
                    { status: 404 }
                );
            }

            if (university.regionId !== Number(regionId)) {
                return NextResponse.json(
                    { error: "University does not belong to the selected region" },
                    { status: 400 }
                );
            }
        }

        // If small group is provided, verify it exists and belongs to the university/region
        if (smallGroupId) {
            const smallGroup = await prisma.smallgroup.findUnique({
                where: { id: Number(smallGroupId) }
            });

            if (!smallGroup) {
                return NextResponse.json(
                    { error: "Small group not found" },
                    { status: 404 }
                );
            }

            if (smallGroup.regionId !== Number(regionId)) {
                return NextResponse.json(
                    { error: "Small group does not belong to the selected region" },
                    { status: 400 }
                );
            }

            if (universityId && smallGroup.universityId !== Number(universityId)) {
                return NextResponse.json(
                    { error: "Small group does not belong to the selected university" },
                    { status: 400 }
                );
            }
        }

        // If alumni group is provided, verify it exists and belongs to the region
        if (alumniGroupId) {
            const alumniGroup = await prisma.alumnismallgroup.findUnique({
                where: { id: Number(alumniGroupId) }
            });

            if (!alumniGroup) {
                return NextResponse.json(
                    { error: "Alumni group not found" },
                    { status: 404 }
                );
            }

            if (alumniGroup.regionId !== Number(regionId)) {
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
                regionId: Number(regionId),
                universityId: universityId ? Number(universityId) : null,
                smallGroupId: smallGroupId ? Number(smallGroupId) : null,
                alumniGroupId: alumniGroupId ? Number(alumniGroupId) : null,
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

        const body = await request.json();
        const { name, type, regionId, universityId, smallGroupId, alumniGroupId, isActive } = body;

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

        // Verify region exists
        const region = await prisma.region.findUnique({
            where: { id: Number(regionId) }
        });

        if (!region) {
            return NextResponse.json(
                { error: "Region not found" },
                { status: 404 }
            );
        }

        // If university is provided, verify it exists and belongs to the region
        if (universityId) {
            const university = await prisma.university.findUnique({
                where: { id: Number(universityId) }
            });

            if (!university) {
                return NextResponse.json(
                    { error: "University not found" },
                    { status: 404 }
                );
            }

            if (university.regionId !== Number(regionId)) {
                return NextResponse.json(
                    { error: "University does not belong to the selected region" },
                    { status: 400 }
                );
            }
        }

        // If small group is provided, verify it exists and belongs to the university/region
        if (smallGroupId) {
            const smallGroup = await prisma.smallgroup.findUnique({
                where: { id: Number(smallGroupId) }
            });

            if (!smallGroup) {
                return NextResponse.json(
                    { error: "Small group not found" },
                    { status: 404 }
                );
            }

            if (smallGroup.regionId !== Number(regionId)) {
                return NextResponse.json(
                    { error: "Small group does not belong to the selected region" },
                    { status: 400 }
                );
            }

            if (universityId && smallGroup.universityId !== Number(universityId)) {
                return NextResponse.json(
                    { error: "Small group does not belong to the selected university" },
                    { status: 400 }
                );
            }
        }

        // If alumni group is provided, verify it exists and belongs to the region
        if (alumniGroupId) {
            const alumniGroup = await prisma.alumnismallgroup.findUnique({
                where: { id: Number(alumniGroupId) }
            });

            if (!alumniGroup) {
                return NextResponse.json(
                    { error: "Alumni group not found" },
                    { status: 404 }
                );
            }

            if (alumniGroup.regionId !== Number(regionId)) {
                return NextResponse.json(
                    { error: "Alumni group does not belong to the selected region" },
                    { status: 400 }
                );
            }
        }

        const updatedEvent = await prisma.permanentministryevent.update({
            where: { id: Number(eventId) },
            data: {
                name: name.trim(),
                type: type.trim(),
                regionId: Number(regionId),
                universityId: universityId ? Number(universityId) : null,
                smallGroupId: smallGroupId ? Number(smallGroupId) : null,
                alumniGroupId: alumniGroupId ? Number(alumniGroupId) : null,
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