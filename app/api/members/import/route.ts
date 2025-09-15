import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createMemberSchema } from "../../validation/member";

interface ImportResult {
  success: number;
  errors: Array<{ row: number; error: string; data?: any }>;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { members } = body; // Expecting array of member objects
        
        if (!Array.isArray(members)) {
            return NextResponse.json(
                { error: "Expected array of members" },
                { status: 400 }
            );
        }

        const results: ImportResult = {
            success: 0,
            errors: []
        };

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
            const num = Number(value);
            return isNaN(num) ? null : num;
        };

        // Helper function to handle date values
        const handleDateValue = (value: any) => {
            if (value === "" || value === null || value === undefined) {
                return null;
            }
            const date = new Date(value);
            return isNaN(date.getTime()) ? null : date;
        };

        // Process each member
        for (let i = 0; i < members.length; i++) {
            const memberData = members[i];
            const rowNumber = i + 1;
            
            try {
                // Validate the member data
                const validation = createMemberSchema.safeParse(memberData);
                
                if (!validation.success) {
                    results.errors.push({
                        row: rowNumber,
                        error: `Validation failed: ${validation.error.issues.map(issue => issue.message).join(', ')}`,
                        data: memberData
                    });
                    continue;
                }

                const data = validation.data;

                // Create the member
                const memberDataToCreate: any = {
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
                    type: data.type.toLowerCase() as any,
                    status: data.status ? (data.status.toLowerCase() as any) : "active",
                    graduationDate: handleDateValue(data.graduationDate),
                    faculty: handleEmptyValue(data.faculty),
                    professionalism: handleEmptyValue(data.professionalism),
                    maritalStatus: handleEmptyValue(data.maritalStatus),
                    updatedAt: new Date(),
                };

                // Only add foreign key fields if they have values
                const regionId = handleNumericValue(data.regionId);
                const universityId = handleNumericValue(data.universityId);
                const smallGroupId = handleNumericValue(data.smallGroupId);
                const alumniGroupId = handleNumericValue(data.alumniGroupId);

                if (regionId !== null) memberDataToCreate.regionId = regionId;
                if (universityId !== null) memberDataToCreate.universityId = universityId;
                if (smallGroupId !== null) memberDataToCreate.smallGroupId = smallGroupId;
                if (alumniGroupId !== null) memberDataToCreate.alumniGroupId = alumniGroupId;

                const newMember = await prisma.member.create({
                    data: memberDataToCreate,
                });

                results.success++;
            } catch (error: any) {
                console.error(`Error creating member at row ${rowNumber}:`, error);
                
                let errorMessage = "Unknown error";
                
                // Handle specific Prisma errors
                if (typeof error === 'object' && error !== null && 'code' in error) {
                    if (error.code === 'P2002') {
                        errorMessage = "Email already exists";
                    } else if (error.code === 'P2003') {
                        errorMessage = "Foreign key constraint failed (invalid region, university, small group, or alumni group)";
                    } else if (error.code === 'P2025') {
                        errorMessage = "Record not found";
                    } else {
                        errorMessage = error.message || "Database error";
                    }
                } else if (error instanceof Error) {
                    errorMessage = error.message;
                }

                results.errors.push({
                    row: rowNumber,
                    error: errorMessage,
                    data: memberData
                });
            }
        }

        return NextResponse.json(results, { status: 200 });
    } catch (error: any) {
        console.error("Error in bulk import:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
} 