import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const regionId = searchParams.get("regionId");
        const alumniGroupId = searchParams.get("alumniGroupId");
        
        // If specific alumniGroupId is provided, return that alumni small group
        if (alumniGroupId) {
            const alumniSmallGroup = await prisma.alumnismallgroup.findUnique({
                where: { id: Number(alumniGroupId) },
                include: { 
                    region: { select: { id: true, name: true } }
                }
            });
            if (!alumniSmallGroup) {
                return NextResponse.json({ error: "Alumni small group not found" }, { status: 404 });
            }
            return NextResponse.json(alumniSmallGroup, { status: 200 });
        }
        
        let where: any = {};
        
        // Apply explicit region filter if provided
        if (regionId) {
            where.regionId = Number(regionId);
        }
        
        const alumniSmallGroups = await prisma.alumnismallgroup.findMany({
            where,
            include: { 
                region: { select: { id: true, name: true } }
            }
        });
        return NextResponse.json(alumniSmallGroups, { status: 200 });
    } catch (error) {
        console.error("Error fetching alumni small groups:", error);
        return NextResponse.json({ error: 'Failed to fetch alumni small groups' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, regionId } = body;

        if (!name || name.trim() === '') {
            return NextResponse.json(
                { error: "Alumni small group name is required" },
                { status: 400 }
            );
        }

        if (!regionId) {
            return NextResponse.json(
                { error: "Region ID is required" },
                { status: 400 }
            );
        }

        // Check if alumni small group with same name already exists in the region
        const existingAlumniSmallGroup = await prisma.alumnismallgroup.findFirst({
            where: { 
                name: name.trim(),
                regionId: Number(regionId)
            }
        });

        if (existingAlumniSmallGroup) {
            return NextResponse.json(
                { error: "Alumni small group with this name already exists in the selected region" },
                { status: 409 }
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

        const alumniSmallGroup = await prisma.alumnismallgroup.create({
            data: {
                name: name.trim(),
                regionId: Number(regionId)
            },
            include: {
                region: { select: { id: true, name: true } }
            }
        });

        return NextResponse.json(alumniSmallGroup, { status: 201 });
    } catch (error) {
        console.error("Error creating alumni small group:", error);
        return NextResponse.json({ error: 'Failed to create alumni small group' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const alumniGroupId = searchParams.get("id");

        if (!alumniGroupId) {
            return NextResponse.json(
                { error: "Alumni small group ID is required" },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { name, regionId } = body;

        if (!name || name.trim() === '') {
            return NextResponse.json(
                { error: "Alumni small group name is required" },
                { status: 400 }
            );
        }

        if (!regionId) {
            return NextResponse.json(
                { error: "Region ID is required" },
                { status: 400 }
            );
        }

        // Check if alumni small group exists
        const existingAlumniSmallGroup = await prisma.alumnismallgroup.findUnique({
            where: { id: Number(alumniGroupId) }
        });

        if (!existingAlumniSmallGroup) {
            return NextResponse.json(
                { error: "Alumni small group not found" },
                { status: 404 }
            );
        }

        // Check if another alumni small group with same name already exists in the region
        const duplicateAlumniSmallGroup = await prisma.alumnismallgroup.findFirst({
            where: { 
                name: name.trim(),
                regionId: Number(regionId),
                id: { not: Number(alumniGroupId) }
            }
        });

        if (duplicateAlumniSmallGroup) {
            return NextResponse.json(
                { error: "Alumni small group with this name already exists in the selected region" },
                { status: 409 }
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

        const updatedAlumniSmallGroup = await prisma.alumnismallgroup.update({
            where: { id: Number(alumniGroupId) },
            data: {
                name: name.trim(),
                regionId: Number(regionId)
            },
            include: {
                region: { select: { id: true, name: true } }
            }
        });

        return NextResponse.json(updatedAlumniSmallGroup, { status: 200 });
    } catch (error) {
        console.error("Error updating alumni small group:", error);
        return NextResponse.json({ error: 'Failed to update alumni small group' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const alumniGroupId = searchParams.get("id");

        if (!alumniGroupId) {
            return NextResponse.json(
                { error: "Alumni small group ID is required" },
                { status: 400 }
            );
        }

        // Check if alumni small group exists
        const existingAlumniSmallGroup = await prisma.alumnismallgroup.findUnique({
            where: { id: Number(alumniGroupId) }
        });

        if (!existingAlumniSmallGroup) {
            return NextResponse.json(
                { error: "Alumni small group not found" },
                { status: 404 }
            );
        }

        // Check if alumni small group is being used by members
        const membersCount = await prisma.member.count({
            where: { alumniGroupId: Number(alumniGroupId) }
        });

        if (membersCount > 0) {
            return NextResponse.json(
                { error: "Cannot delete alumni small group. It is being used by members." },
                { status: 409 }
            );
        }

        await prisma.alumnismallgroup.delete({
            where: { id: Number(alumniGroupId) }
        });

        return NextResponse.json(
            { message: "Alumni small group deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error deleting alumni small group:", error);
        return NextResponse.json({ error: 'Failed to delete alumni small group' }, { status: 500 });
    }
} 