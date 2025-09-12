import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const regionId = searchParams.get("regionId");

        // If specific regionId is provided, return that region
        if (regionId) {
            const region = await prisma.region.findUnique({
                where: { id: Number(regionId) },
                select: { id: true, name: true }
            });
            if (!region) {
                return NextResponse.json({ error: "Region not found" }, { status: 404 });
            }
            return NextResponse.json(region, { status: 200 });
        }

        // Return all regions
        const regions = await prisma.region.findMany({
            select: { id: true, name: true }
        });
        return NextResponse.json(regions, { status: 200 });
    } catch (error) {
        console.error("Error fetching regions:", error);
        return NextResponse.json({ error: 'Failed to fetch regions' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name } = body;

        if (!name || name.trim() === '') {
            return NextResponse.json(
                { error: "Region name is required" },
                { status: 400 }
            );
        }

        // Check if region with same name already exists
        const existingRegion = await prisma.region.findFirst({
            where: { name: name.trim() }
        });

        if (existingRegion) {
            return NextResponse.json(
                { error: "Region with this name already exists" },
                { status: 409 }
            );
        }

        const region = await prisma.region.create({
            data: {
                name: name.trim()
            },
            select: { id: true, name: true }
        });

        return NextResponse.json(region, { status: 201 });
    } catch (error) {
        console.error("Error creating region:", error);
        return NextResponse.json({ error: 'Failed to create region' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const regionId = searchParams.get("id");

        if (!regionId) {
            return NextResponse.json(
                { error: "Region ID is required" },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { name } = body;

        if (!name || name.trim() === '') {
            return NextResponse.json(
                { error: "Region name is required" },
                { status: 400 }
            );
        }

        // Check if region exists
        const existingRegion = await prisma.region.findUnique({
            where: { id: Number(regionId) }
        });

        if (!existingRegion) {
            return NextResponse.json(
                { error: "Region not found" },
                { status: 404 }
            );
        }

        // Check if another region with same name already exists
        const duplicateRegion = await prisma.region.findFirst({
            where: { 
                name: name.trim(),
                id: { not: Number(regionId) }
            }
        });

        if (duplicateRegion) {
            return NextResponse.json(
                { error: "Region with this name already exists" },
                { status: 409 }
            );
        }

        const updatedRegion = await prisma.region.update({
            where: { id: Number(regionId) },
            data: {
                name: name.trim()
            },
            select: { id: true, name: true }
        });

        return NextResponse.json(updatedRegion, { status: 200 });
    } catch (error) {
        console.error("Error updating region:", error);
        return NextResponse.json({ error: 'Failed to update region' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const regionId = searchParams.get("id");

        if (!regionId) {
            return NextResponse.json(
                { error: "Region ID is required" },
                { status: 400 }
            );
        }

        // Check if region exists
        const existingRegion = await prisma.region.findUnique({
            where: { id: Number(regionId) }
        });

        if (!existingRegion) {
            return NextResponse.json(
                { error: "Region not found" },
                { status: 404 }
            );
        }

        // Check if region is being used by universities
        const universitiesCount = await prisma.university.count({
            where: { regionId: Number(regionId) }
        });

        if (universitiesCount > 0) {
            return NextResponse.json(
                { error: "Cannot delete region. It is being used by universities." },
                { status: 409 }
            );
        }

        await prisma.region.delete({
            where: { id: Number(regionId) }
        });

        return NextResponse.json(
            { message: "Region deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error deleting region:", error);
        return NextResponse.json({ error: 'Failed to delete region' }, { status: 500 });
    }
} 