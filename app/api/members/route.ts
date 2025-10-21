import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { createMemberSchema } from "../validation/member";
import { getUserScope, generateRLSConditions } from "@/lib/rls";
// import { auth } from "@/lib/auth";



export async function POST(request: NextRequest) {
    try {
        // Get user scope for RLS
        const userScope = await getUserScope();
        if (!userScope) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

        // Apply RLS validation to ensure user can only create members in their scope
        const rlsConditions = generateRLSConditions(userScope);
        
        // Check if the member's assigned scope IDs match user's scope
        if (data.regionId && rlsConditions.regionId && data.regionId !== rlsConditions.regionId) {
            return NextResponse.json(
                { error: "You can only create members in your assigned region" },
                { status: 403 }
            );
        }
        
        if (data.universityId && rlsConditions.universityId && data.universityId !== rlsConditions.universityId) {
            return NextResponse.json(
                { error: "You can only create members in your assigned university" },
                { status: 403 }
            );
        }
        
        if (data.smallGroupId && rlsConditions.smallGroupId && data.smallGroupId !== rlsConditions.smallGroupId) {
            return NextResponse.json(
                { error: "You can only create members in your assigned small group" },
                { status: 403 }
            );
        }
        
        if (data.alumniGroupId && rlsConditions.alumniGroupId && data.alumniGroupId !== rlsConditions.alumniGroupId) {
            return NextResponse.json(
                { error: "You can only create members in your assigned alumni group" },
                { status: 403 }
            );
        }

        // Helper function to handle empty strings and null values
        const handleEmptyValue = (value: unknown) => {
            if (value === "" || value === null || value === undefined) {
                return null;
            }
            return value;
        };

        // Helper function to handle numeric values
        const handleNumericValue = (value: unknown) => {
            if (value === "" || value === null || value === undefined) {
                return null;
            }
            return Number(value);
        };

        // Helper function to handle date values
        const handleDateValue = (value: unknown) => {
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
                placeOfBirthProvince: handleEmptyValue(data.placeOfBirthProvince),
                placeOfBirthDistrict: handleEmptyValue(data.placeOfBirthDistrict),
                placeOfBirthSector: handleEmptyValue(data.placeOfBirthSector),
                placeOfBirthCell: handleEmptyValue(data.placeOfBirthCell),
                placeOfBirthVillage: handleEmptyValue(data.placeOfBirthVillage),
                localChurch: handleEmptyValue(data.localChurch),
                email: handleEmptyValue(data.email),
                phone: handleEmptyValue(data.phone),
                type: data.type.toLowerCase(),
                status: data.status ? (data.status.toLowerCase()) : "active",
                regionId: handleNumericValue(data.regionId),
                universityId: handleNumericValue(data.universityId),
                smallGroupId: handleNumericValue(data.smallGroupId),
                alumniGroupId: handleNumericValue(data.alumniGroupId),
                graduationDate: handleDateValue(data.graduationDate),
                faculty: handleEmptyValue(data.faculty),
                professionalism: handleEmptyValue(data.professionalism),
                maritalStatus: handleEmptyValue(data.maritalStatus),
                updatedAt: new Date(),
            } as 'student' | 'alumni',
        });

        return NextResponse.json(newMember, { status: 201 });
    } catch (error: unknown) {
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
        // Get user scope for RLS
        const userScope = await getUserScope();
        if (!userScope) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

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

            // Apply RLS check for single member
            const rlsConditions = generateRLSConditions(userScope);
            if (rlsConditions.regionId && member.regionId !== rlsConditions.regionId) {
                return NextResponse.json({ error: "Access denied" }, { status: 403 });
            }
            if (rlsConditions.universityId && member.universityId !== rlsConditions.universityId) {
                return NextResponse.json({ error: "Access denied" }, { status: 403 });
            }
            if (rlsConditions.smallGroupId && member.smallGroupId !== rlsConditions.smallGroupId) {
                return NextResponse.json({ error: "Access denied" }, { status: 403 });
            }
            if (rlsConditions.alumniGroupId && member.alumniGroupId !== rlsConditions.alumniGroupId) {
                return NextResponse.json({ error: "Access denied" }, { status: 403 });
            }

            return NextResponse.json(member, { status: 200 });
        }

        // Build the filter object with RLS conditions
        const rlsConditions = generateRLSConditions(userScope);
        const where: Record<string, unknown> = { ...rlsConditions };

        // Apply explicit filters if they exist (but they must be within user's scope)
        if (smallGroupId && smallGroupId !== "") {
            const requestedSmallGroupId = Number(smallGroupId);
            if (rlsConditions.smallGroupId && requestedSmallGroupId !== rlsConditions.smallGroupId) {
                return NextResponse.json({ error: "Access denied to requested small group" }, { status: 403 });
            }
            where.smallGroupId = requestedSmallGroupId;
        } else if (alumniGroupId && alumniGroupId !== "") {
            const requestedAlumniGroupId = Number(alumniGroupId);
            if (rlsConditions.alumniGroupId && requestedAlumniGroupId !== rlsConditions.alumniGroupId) {
                return NextResponse.json({ error: "Access denied to requested alumni group" }, { status: 403 });
            }
            where.alumniGroupId = requestedAlumniGroupId;
        } else if (universityId && universityId !== "") {
            const requestedUniversityId = Number(universityId);
            if (rlsConditions.universityId && requestedUniversityId !== rlsConditions.universityId) {
                return NextResponse.json({ error: "Access denied to requested university" }, { status: 403 });
            }
            where.universityId = requestedUniversityId;
        } else if (regionId && regionId !== "") {
            const requestedRegionId = Number(regionId);
            if (rlsConditions.regionId && requestedRegionId !== rlsConditions.regionId) {
                return NextResponse.json({ error: "Access denied to requested region" }, { status: 403 });
            }
            where.regionId = requestedRegionId;
        }

        // Fetch members based on the constructed 'where' clause with RLS
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
        // Get user scope for RLS
        const userScope = await getUserScope();
        if (!userScope) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

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

        // Apply RLS check - ensure user can only update members in their scope
        const rlsConditions = generateRLSConditions(userScope);
        if (rlsConditions.regionId && existingMember.regionId !== rlsConditions.regionId) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }
        if (rlsConditions.universityId && existingMember.universityId !== rlsConditions.universityId) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }
        if (rlsConditions.smallGroupId && existingMember.smallGroupId !== rlsConditions.smallGroupId) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }
        if (rlsConditions.alumniGroupId && existingMember.alumniGroupId !== rlsConditions.alumniGroupId) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        // Validate that the updated data doesn't move the member outside user's scope
        if (data.regionId && rlsConditions.regionId && data.regionId !== rlsConditions.regionId) {
            return NextResponse.json(
                { error: "You can only assign members to your assigned region" },
                { status: 403 }
            );
        }
        
        if (data.universityId && rlsConditions.universityId && data.universityId !== rlsConditions.universityId) {
            return NextResponse.json(
                { error: "You can only assign members to your assigned university" },
                { status: 403 }
            );
        }
        
        if (data.smallGroupId && rlsConditions.smallGroupId && data.smallGroupId !== rlsConditions.smallGroupId) {
            return NextResponse.json(
                { error: "You can only assign members to your assigned small group" },
                { status: 403 }
            );
        }
        
        if (data.alumniGroupId && rlsConditions.alumniGroupId && data.alumniGroupId !== rlsConditions.alumniGroupId) {
            return NextResponse.json(
                { error: "You can only assign members to your assigned alumni group" },
                { status: 403 }
            );
        }

        // Helper function to handle empty strings and null values
        const handleEmptyValue = (value: unknown) => {
            if (value === "" || value === null || value === undefined) {
                return null;
            }
            return value;
        };

        // Helper function to handle numeric values
        const handleNumericValue = (value: unknown) => {
            if (value === "" || value === null || value === undefined) {
                return null;
            }
            return Number(value);
        };

        // Helper function to handle date values
        const handleDateValue = (value: unknown) => {
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
                placeOfBirthProvince: handleEmptyValue(data.placeOfBirthProvince),
                placeOfBirthDistrict: handleEmptyValue(data.placeOfBirthDistrict),
                placeOfBirthSector: handleEmptyValue(data.placeOfBirthSector),
                placeOfBirthCell: handleEmptyValue(data.placeOfBirthCell),
                placeOfBirthVillage: handleEmptyValue(data.placeOfBirthVillage),
                localChurch: handleEmptyValue(data.localChurch),
                email: handleEmptyValue(data.email),
                phone: handleEmptyValue(data.phone),
                type: data.type.toLowerCase(),
                status: data.status ? (data.status.toLowerCase()) : "active",
                regionId: handleNumericValue(data.regionId),
                universityId: handleNumericValue(data.universityId),
                smallGroupId: handleNumericValue(data.smallGroupId),
                alumniGroupId: handleNumericValue(data.alumniGroupId),
                graduationDate: handleDateValue(data.graduationDate),
                faculty: handleEmptyValue(data.faculty),
                professionalism: handleEmptyValue(data.professionalism),
                maritalStatus: handleEmptyValue(data.maritalStatus),
                updatedAt: new Date(),
            } as 'student' | 'alumni',
            include: {
                region: true,
                university: true,
                smallgroup: true,
                alumnismallgroup: true,
            }
        });

        return NextResponse.json(updatedMember, { status: 200 });
    } catch (error: unknown) {
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
        // Get user scope for RLS
        const userScope = await getUserScope();
        if (!userScope) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

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

        // Apply RLS check - ensure user can only delete members in their scope
        const rlsConditions = generateRLSConditions(userScope);
        if (rlsConditions.regionId && existingMember.regionId !== rlsConditions.regionId) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }
        if (rlsConditions.universityId && existingMember.universityId !== rlsConditions.universityId) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }
        if (rlsConditions.smallGroupId && existingMember.smallGroupId !== rlsConditions.smallGroupId) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }
        if (rlsConditions.alumniGroupId && existingMember.alumniGroupId !== rlsConditions.alumniGroupId) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        // Delete the member
        await prisma.member.delete({
            where: { id: Number(id) }
        });

        return NextResponse.json(
            { message: "Member deleted successfully" },
            { status: 200 }
        );
    } catch (error: unknown) {
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
        console.error("Error fetching universities:", error);
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
        console.error("Error fetching regions:", error);
        return NextResponse.json({ error: 'Failed to fetch regions' }, { status: 500 });
    }
}