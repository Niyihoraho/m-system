import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { userRoleSchema } from "../validation/user";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = userRoleSchema.safeParse(body);
        
        if (!validation.success) {
            return NextResponse.json(
                { error: "Validation failed", details: validation.error.issues },
                { status: 400 }
            );
        }

        const data = validation.data;

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id: data.userId }
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Check if role already exists for this user and scope
        const existingRole = await prisma.userrole.findFirst({
            where: {
                userId: data.userId,
                scope: data.scope,
                regionId: data.regionId,
                universityId: data.universityId,
                smallGroupId: data.smallGroupId,
                alumniGroupId: data.alumniGroupId,
            }
        });

        if (existingRole) {
            return NextResponse.json(
                { error: "User already has this role for this scope" },
                { status: 400 }
            );
        }

        // Create new user role
        const newRole = await prisma.userrole.create({
            data: {
                userId: data.userId,
                regionId: data.regionId,
                universityId: data.universityId,
                smallGroupId: data.smallGroupId,
                alumniGroupId: data.alumniGroupId,
                scope: data.scope as any,
                assignedAt: new Date(),
            },
            include: {
                region: true,
                university: true,
                smallgroup: true,
                alumnismallgroup: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        email: true,
                    }
                }
            }
        });

        return NextResponse.json(newRole, { status: 201 });
    } catch (error: any) {
        console.error("Error creating user role:", error);
        return NextResponse.json(
            { error: "Failed to create user role", details: error.message },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");
        const roleId = searchParams.get("roleId");

        if (roleId) {
            // Get specific role
            const role = await prisma.userrole.findUnique({
                where: { id: Number(roleId) },
                include: {
                    region: true,
                    university: true,
                    smallgroup: true,
                    alumnismallgroup: true,
                    user: {
                        select: {
                            id: true,
                            name: true,
                            username: true,
                            email: true,
                        }
                    }
                }
            });

            if (!role) {
                return NextResponse.json({ error: "Role not found" }, { status: 404 });
            }

            return NextResponse.json(role, { status: 200 });
        }

        if (userId) {
            // Get all roles for a specific user
            const roles = await prisma.userrole.findMany({
                where: { userId },
                include: {
                    region: true,
                    university: true,
                    smallgroup: true,
                    alumnismallgroup: true,
                }
            });

            return NextResponse.json({ roles }, { status: 200 });
        }

        // Get all roles
        const roles = await prisma.userrole.findMany({
            include: {
                region: true,
                university: true,
                smallgroup: true,
                alumnismallgroup: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        email: true,
                    }
                }
            },
            orderBy: { assignedAt: 'desc' }
        });

        return NextResponse.json({ roles }, { status: 200 });
    } catch (error: any) {
        console.error("Error fetching user roles:", error);
        return NextResponse.json(
            { error: "Failed to fetch user roles", details: error.message },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, ...updateData } = body;

        if (!id) {
            return NextResponse.json(
                { error: "Role ID is required" },
                { status: 400 }
            );
        }

        // Check if role exists
        const existingRole = await prisma.userrole.findUnique({
            where: { id: Number(id) }
        });

        if (!existingRole) {
            return NextResponse.json(
                { error: "Role not found" },
                { status: 404 }
            );
        }

        // Update role
        const updatedRole = await prisma.userrole.update({
            where: { id: Number(id) },
            data: {
                ...updateData,
                scope: updateData.scope as any,
            },
            include: {
                region: true,
                university: true,
                smallgroup: true,
                alumnismallgroup: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        email: true,
                    }
                }
            }
        });

        return NextResponse.json(updatedRole, { status: 200 });
    } catch (error: any) {
        console.error("Error updating user role:", error);
        return NextResponse.json(
            { error: "Failed to update user role", details: error.message },
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
                { error: "Role ID is required" },
                { status: 400 }
            );
        }

        // Check if role exists
        const existingRole = await prisma.userrole.findUnique({
            where: { id: Number(id) }
        });

        if (!existingRole) {
            return NextResponse.json(
                { error: "Role not found" },
                { status: 404 }
            );
        }

        // Delete role
        await prisma.userrole.delete({
            where: { id: Number(id) }
        });

        return NextResponse.json(
            { message: "Role deleted successfully" },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Error deleting user role:", error);
        return NextResponse.json(
            { error: "Failed to delete user role", details: error.message },
            { status: 500 }
        );
    }
}


