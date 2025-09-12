import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { createMemberSchema } from "../validation/member";



export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = createMemberSchema.safeParse(body);
        
        if (!validation.success) {
            return NextResponse.json(
                { error: "Validation failed", details: validation.error.issues },
                { status: 400 }
            );
        }

        const data = validation.data;

        // Helper function to handle empty strings and null values
        const handleEmptyValue = (value: any) => {
            if (value === "" || value === null || value === undefined) {
                return null;
            }
            return value;
        };

        // Helper function to handle numeric values
        const handleNumericValue = (value: any) => {
            if (value === "" || value === null || value === undefined) {
                return null;
            }
            return Number(value);
        };

        // Helper function to handle date values
        const handleDateValue = (value: any) => {
            if (value === "" || value === null || value === undefined) {
                return null;
            }
            return new Date(value);
        };

        const newMember = await prisma.member.create({
            data: {
                firstname: handleEmptyValue(data.firstname),
                secondname: handleEmptyValue(data.secondname),
                gender: handleEmptyValue(data.gender?.toLowerCase()),
                birthdate: handleDateValue(data.birthdate),
                placeOfBirthDistrict: handleEmptyValue(data.placeOfBirthDistrict),
                placeOfBirthSector: handleEmptyValue(data.placeOfBirthSector),
                placeOfBirthCell: handleEmptyValue(data.placeOfBirthCell),
                placeOfBirthVillage: handleEmptyValue(data.placeOfBirthVillage),
                localChurch: handleEmptyValue(data.localChurch),
                email: handleEmptyValue(data.email),
                phone: handleEmptyValue(data.phone),
                type: data.type.toLowerCase() as any,
                status: data.status ? (data.status.toLowerCase() as any) : "active",
                regionId: handleNumericValue(data.regionId),
                universityId: handleNumericValue(data.universityId),
                smallGroupId: handleNumericValue(data.smallGroupId),
                alumniGroupId: handleNumericValue(data.alumniGroupId),
                graduationDate: handleDateValue(data.graduationDate),
                faculty: handleEmptyValue(data.faculty),
                professionalism: handleEmptyValue(data.professionalism),
                maritalStatus: handleEmptyValue(data.maritalStatus),
                updatedAt: new Date(),
            },
        });

        return NextResponse.json(newMember, { status: 201 });
    } catch (error: any) {
        console.error("Error creating member:", error);
        
        // Handle specific Prisma errors
        if (typeof error === 'object' && error !== null && 'code' in error) {
            if (error.code === 'P2002') {
                return NextResponse.json(
                    { error: "Email already exists" },
                    { status: 409 }
                );
            }
            if (error.code === 'P2003') {
                return NextResponse.json(
                    { error: "Foreign key constraint failed" },
                    { status: 400 }
                );
            }
        }

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        const smallGroupId = searchParams.get("smallGroupId");
        const alumniGroupId = searchParams.get("alumniGroupId");
        const universityId = searchParams.get("universityId");
        const regionId = searchParams.get("regionId");

        // If ID is provided, return specific member
        if (id) {
            const member = await prisma.member.findUnique({
                where: { id: Number(id) },
                include: {
                    region: true,
                    university: true,
                    smallgroup: true,
                    alumnismallgroup: true,
                }
            });
            if (!member) {
                return NextResponse.json({ error: "Member not found" }, { status: 404 });
            }
            return NextResponse.json(member, { status: 200 });
        }

        // Build the filter object
        let where: any = {};

        // Apply explicit filters if they exist
        if (smallGroupId) {
            where.smallGroupId = Number(smallGroupId);
        } else if (alumniGroupId) {
            where.alumniGroupId = Number(alumniGroupId);
        } else if (universityId) {
            where.universityId = Number(universityId);
        } else if (regionId) {
            where.regionId = Number(regionId);
        }

        // Fetch members based on the constructed 'where' clause
        const members = await prisma.member.findMany({
            where,
            include: {
                region: true,
                university: true,
                smallgroup: true,
                alumnismallgroup: true,
            }
        });

        return NextResponse.json({ members }, { status: 200 });
    } catch (error) {
        console.error("Error fetching members:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "Member ID is required" },
                { status: 400 }
            );
        }

        const body = await request.json();
        const validation = createMemberSchema.safeParse(body);
        
        if (!validation.success) {
            return NextResponse.json(
                { error: "Validation failed", details: validation.error.issues },
                { status: 400 }
            );
        }

        const data = validation.data;

        // Check if member exists
        const existingMember = await prisma.member.findUnique({
            where: { id: Number(id) }
        });

        if (!existingMember) {
            return NextResponse.json(
                { error: "Member not found" },
                { status: 404 }
            );
        }

        // Helper function to handle empty strings and null values
        const handleEmptyValue = (value: any) => {
            if (value === "" || value === null || value === undefined) {
                return null;
            }
            return value;
        };

        // Helper function to handle numeric values
        const handleNumericValue = (value: any) => {
            if (value === "" || value === null || value === undefined) {
                return null;
            }
            return Number(value);
        };

        // Helper function to handle date values
        const handleDateValue = (value: any) => {
            if (value === "" || value === null || value === undefined) {
                return null;
            }
            return new Date(value);
        };

        // Update the member
        const updatedMember = await prisma.member.update({
            where: { id: Number(id) },
            data: {
                firstname: handleEmptyValue(data.firstname),
                secondname: handleEmptyValue(data.secondname),
                gender: handleEmptyValue(data.gender?.toLowerCase()),
                birthdate: handleDateValue(data.birthdate),
                placeOfBirthDistrict: handleEmptyValue(data.placeOfBirthDistrict),
                placeOfBirthSector: handleEmptyValue(data.placeOfBirthSector),
                placeOfBirthCell: handleEmptyValue(data.placeOfBirthCell),
                placeOfBirthVillage: handleEmptyValue(data.placeOfBirthVillage),
                localChurch: handleEmptyValue(data.localChurch),
                email: handleEmptyValue(data.email),
                phone: handleEmptyValue(data.phone),
                type: data.type.toLowerCase() as any,
                status: data.status ? (data.status.toLowerCase() as any) : "active",
                regionId: handleNumericValue(data.regionId),
                universityId: handleNumericValue(data.universityId),
                smallGroupId: handleNumericValue(data.smallGroupId),
                alumniGroupId: handleNumericValue(data.alumniGroupId),
                graduationDate: handleDateValue(data.graduationDate),
                faculty: handleEmptyValue(data.faculty),
                professionalism: handleEmptyValue(data.professionalism),
                maritalStatus: handleEmptyValue(data.maritalStatus),
                updatedAt: new Date(),
            },
            include: {
                region: true,
                university: true,
                smallgroup: true,
                alumnismallgroup: true,
            }
        });

        return NextResponse.json(updatedMember, { status: 200 });
    } catch (error: any) {
        console.error("Error updating member:", error);
        
        // Handle specific Prisma errors
        if (typeof error === 'object' && error !== null && 'code' in error) {
            if (error.code === 'P2025') {
                return NextResponse.json(
                    { error: "Member not found" },
                    { status: 404 }
                );
            }
            if (error.code === 'P2002') {
                return NextResponse.json(
                    { error: "Email already exists" },
                    { status: 409 }
                );
            }
            if (error.code === 'P2003') {
                return NextResponse.json(
                    { error: "Foreign key constraint failed" },
                    { status: 400 }
                );
            }
        }

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "Member ID is required" },
                { status: 400 }
            );
        }

        // Check if member exists
        const existingMember = await prisma.member.findUnique({
            where: { id: Number(id) }
        });

        if (!existingMember) {
            return NextResponse.json(
                { error: "Member not found" },
                { status: 404 }
            );
        }

        // Delete the member
        await prisma.member.delete({
            where: { id: Number(id) }
        });

        return NextResponse.json(
            { message: "Member deleted successfully" },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Error deleting member:", error);
        
        // Handle specific Prisma errors
        if (typeof error === 'object' && error !== null && 'code' in error) {
            if (error.code === 'P2025') {
                return NextResponse.json(
                    { error: "Member not found" },
                    { status: 404 }
                );
            }
        }

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// New endpoint: GET /api/members/universities
export async function GET_UNIVERSITIES(request: NextRequest) {
    try {
        const universities = await prisma.university.findMany({
            select: { id: true, name: true }
        });
        return NextResponse.json(universities, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch universities' }, { status: 500 });
    }
}

// New endpoint: GET /api/members/regions
export async function GET_REGIONS(request: NextRequest) {
    try {
        const regions = await prisma.region.findMany({
            select: { id: true, name: true }
        });
        return NextResponse.json(regions, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch regions' }, { status: 500 });
    }
}