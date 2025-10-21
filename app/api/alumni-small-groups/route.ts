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
        const regionId = searchParams.get("regionId");
        const alumniGroupId = searchParams.get("alumniGroupId");
        
        // If specific alumniGroupId is provided, return that alumni small group
        if (alumniGroupId) {
            const requestedAlumniGroupId = Number(alumniGroupId);
            
            // Apply RLS check for specific alumni group
            if (userScope.scope === 'alumnismallgroup' && userScope.alumniGroupId !== requestedAlumniGroupId) {
                return NextResponse.json({ error: "Access denied" }, { status: 403 });
            }
            
            const alumniSmallGroup = await prisma.alumnismallgroup.findUnique({
                where: { id: requestedAlumniGroupId },
                include: { 
                    region: { select: { id: true, name: true } }
                }
            });
            if (!alumniSmallGroup) {
                return NextResponse.json({ error: "Alumni small group not found" }, { status: 404 });
            }

            // Additional RLS check for region scope
            if (userScope.scope === 'region' && userScope.regionId && alumniSmallGroup.regionId !== userScope.regionId) {
                return NextResponse.json({ error: "Access denied" }, { status: 403 });
            }

            return NextResponse.json(alumniSmallGroup, { status: 200 });
        }
        
        // Apply RLS conditions
        const rlsConditions = getTableRLSConditions(userScope, 'alumnismallgroup');
        const where: Record<string, unknown> = { ...rlsConditions };
        
        // Apply explicit region filter if provided (but it must be within user's scope)
        if (regionId) {
            const requestedRegionId = Number(regionId);
            if (rlsConditions.regionId && requestedRegionId !== rlsConditions.regionId) {
                return NextResponse.json({ error: "Access denied to requested region" }, { status: 403 });
            }
            where.regionId = requestedRegionId;
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
        // Get user scope for RLS
        const userScope = await getUserScope();
        if (!userScope) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

        // Apply RLS checks for creation
        const finalRegionId = Number(regionId);

        // Check if user has permission to create in this region
        if (userScope.scope === 'region' && userScope.regionId !== finalRegionId) {
            return NextResponse.json({ error: "Access denied to create in this region" }, { status: 403 });
        }
        if (userScope.scope === 'alumnismallgroup') {
            return NextResponse.json({ error: "Alumni small group users cannot create new alumni groups" }, { status: 403 });
        }

        // Check if alumni small group with same name already exists in the region
        const existingAlumniSmallGroup = await prisma.alumnismallgroup.findFirst({
            where: { 
                name: name.trim(),
                regionId: finalRegionId
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
            where: { id: finalRegionId }
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
                regionId: finalRegionId
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
        // Get user scope for RLS
        const userScope = await getUserScope();
        if (!userScope) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

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

        // Apply RLS checks for update
        if (userScope.scope === 'alumnismallgroup' && userScope.alumniGroupId !== Number(alumniGroupId)) {
            return NextResponse.json({ error: "Access denied to update this alumni group" }, { status: 403 });
        }
        if (userScope.scope === 'region' && userScope.regionId && existingAlumniSmallGroup.regionId !== userScope.regionId) {
            return NextResponse.json({ error: "Access denied to update alumni groups outside your region" }, { status: 403 });
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
        // Get user scope for RLS
        const userScope = await getUserScope();
        if (!userScope) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

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

        // Apply RLS checks for deletion
        if (userScope.scope === 'alumnismallgroup') {
            return NextResponse.json({ error: "Alumni small group users cannot delete alumni groups" }, { status: 403 });
        }
        if (userScope.scope === 'region' && userScope.regionId && existingAlumniSmallGroup.regionId !== userScope.regionId) {
            return NextResponse.json({ error: "Access denied to delete alumni groups outside your region" }, { status: 403 });
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