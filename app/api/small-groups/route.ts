import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const regionId = searchParams.get("regionId");
        const universityId = searchParams.get("universityId");
        const smallGroupId = searchParams.get("smallGroupId");
        
        // If specific smallGroupId is provided, return that small group
        if (smallGroupId) {
            const smallGroup = await prisma.smallgroup.findUnique({
                where: { id: Number(smallGroupId) },
                include: { 
                    region: { select: { id: true, name: true } },
                    university: { select: { id: true, name: true } }
                }
            });
            if (!smallGroup) {
                return NextResponse.json({ error: "Small group not found" }, { status: 404 });
            }
            return NextResponse.json(smallGroup, { status: 200 });
        }
        
        let where: any = {};
        
        // Apply explicit filters if provided
        if (regionId) {
            where.regionId = Number(regionId);
        }
        if (universityId) {
            where.universityId = Number(universityId);
        }
        
        const smallGroups = await prisma.smallgroup.findMany({
            where,
            include: { 
                region: { select: { id: true, name: true } },
                university: { select: { id: true, name: true } }
            }
        });
        return NextResponse.json(smallGroups, { status: 200 });
    } catch (error) {
        console.error("Error fetching small groups:", error);
        return NextResponse.json({ error: 'Failed to fetch small groups' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, universityId, regionId } = body;
        
        if (!name || name.trim() === '') {
            return NextResponse.json(
                { error: "Small group name is required" },
                { status: 400 }
            );
        }

        if (!universityId) {
            return NextResponse.json(
                { error: "University ID is required" },
                { status: 400 }
            );
        }

        if (!regionId) {
            return NextResponse.json(
                { error: "Region ID is required" },
                { status: 400 }
            );
        }

        // Check if small group with same name already exists in the university
        const existingSmallGroup = await prisma.smallgroup.findFirst({
            where: { 
                name: name.trim(),
                universityId: Number(universityId)
            }
        });

        if (existingSmallGroup) {
            return NextResponse.json(
                { error: "Small group with this name already exists in the selected university" },
                { status: 409 }
            );
        }

        // Verify university exists
        const university = await prisma.university.findUnique({
            where: { id: Number(universityId) }
        });

        if (!university) {
            return NextResponse.json(
                { error: "University not found" },
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

        // Verify university belongs to the region
        if (university.regionId !== Number(regionId)) {
            return NextResponse.json(
                { error: "University does not belong to the selected region" },
                { status: 400 }
            );
        }

        const smallGroup = await prisma.smallgroup.create({
            data: {
                name: name.trim(),
                universityId: Number(universityId),
                regionId: Number(regionId)
            },
            include: {
                region: { select: { id: true, name: true } },
                university: { select: { id: true, name: true } }
            }
        });

        return NextResponse.json(smallGroup, { status: 201 });
    } catch (error) {
        console.error("Error creating small group:", error);
        return NextResponse.json({ error: 'Failed to create small group' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const smallGroupId = searchParams.get("id");

        if (!smallGroupId) {
            return NextResponse.json(
                { error: "Small group ID is required" },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { name, universityId, regionId } = body;

        if (!name || name.trim() === '') {
            return NextResponse.json(
                { error: "Small group name is required" },
                { status: 400 }
            );
        }

        if (!universityId) {
            return NextResponse.json(
                { error: "University ID is required" },
                { status: 400 }
            );
        }

        if (!regionId) {
            return NextResponse.json(
                { error: "Region ID is required" },
                { status: 400 }
            );
        }

        // Check if small group exists
        const existingSmallGroup = await prisma.smallgroup.findUnique({
            where: { id: Number(smallGroupId) }
        });

        if (!existingSmallGroup) {
            return NextResponse.json(
                { error: "Small group not found" },
                { status: 404 }
            );
        }

        // Check if another small group with same name already exists in the university
        const duplicateSmallGroup = await prisma.smallgroup.findFirst({
            where: { 
                name: name.trim(),
                universityId: Number(universityId),
                id: { not: Number(smallGroupId) }
            }
        });

        if (duplicateSmallGroup) {
            return NextResponse.json(
                { error: "Small group with this name already exists in the selected university" },
                { status: 409 }
            );
        }

        // Verify university exists
        const university = await prisma.university.findUnique({
            where: { id: Number(universityId) }
        });

        if (!university) {
            return NextResponse.json(
                { error: "University not found" },
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

        // Verify university belongs to the region
        if (university.regionId !== Number(regionId)) {
            return NextResponse.json(
                { error: "University does not belong to the selected region" },
                { status: 400 }
            );
        }

        const updatedSmallGroup = await prisma.smallgroup.update({
            where: { id: Number(smallGroupId) },
            data: {
                name: name.trim(),
                universityId: Number(universityId),
                regionId: Number(regionId)
            },
            include: {
                region: { select: { id: true, name: true } },
                university: { select: { id: true, name: true } }
            }
        });
        
        return NextResponse.json(updatedSmallGroup, { status: 200 });
    } catch (error) {
        console.error("Error updating small group:", error);
        return NextResponse.json({ error: 'Failed to update small group' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const smallGroupId = searchParams.get("id");

        if (!smallGroupId) {
                return NextResponse.json(
                { error: "Small group ID is required" },
                    { status: 400 }
                );
            }

        // Check if small group exists
        const existingSmallGroup = await prisma.smallgroup.findUnique({
            where: { id: Number(smallGroupId) }
        });

        if (!existingSmallGroup) {
            return NextResponse.json(
                { error: "Small group not found" },
                { status: 404 }
            );
        }

        // Check if small group is being used by members
        const membersCount = await prisma.member.count({
            where: { smallGroupId: Number(smallGroupId) }
        });

        if (membersCount > 0) {
            return NextResponse.json(
                { error: "Cannot delete small group. It is being used by members." },
                { status: 409 }
            );
        }

        await prisma.smallgroup.delete({
            where: { id: Number(smallGroupId) }
        });

        return NextResponse.json(
            { message: "Small group deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error deleting small group:", error);
        return NextResponse.json({ error: 'Failed to delete small group' }, { status: 500 });
    }
} 