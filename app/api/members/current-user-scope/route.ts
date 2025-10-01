import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user's current scope/role
        const userRole = await prisma.userrole.findFirst({
            where: {
                userId: session.user.id
            },
            include: {
                region: true,
                university: true,
                smallgroup: true,
                alumnismallgroup: true
            },
            orderBy: {
                assignedAt: 'desc'
            }
        });

        console.log('User role query result:', {
            userId: session.user.id,
            foundRole: !!userRole,
            roleScope: userRole?.scope,
            roleData: userRole
        });

        if (!userRole) {
            return NextResponse.json({ 
                scope: { 
                    scope: 'superadmin',
                    regionId: null,
                    universityId: null,
                    smallGroupId: null,
                    alumniGroupId: null,
                    region: null,
                    university: null,
                    smallGroup: null,
                    alumniGroup: null
                }
            }, { status: 200 });
        }

        const responseData = {
            scope: {
                scope: userRole.scope,
                regionId: userRole.regionId,
                universityId: userRole.universityId,
                smallGroupId: userRole.smallGroupId,
                alumniGroupId: userRole.alumniGroupId,
                region: userRole.region ? { id: userRole.region.id, name: userRole.region.name } : null,
                university: userRole.university ? { id: userRole.university.id, name: userRole.university.name } : null,
                smallGroup: userRole.smallgroup ? { id: userRole.smallgroup.id, name: userRole.smallgroup.name } : null,
                alumniGroup: userRole.alumnismallgroup ? { id: userRole.alumnismallgroup.id, name: userRole.alumnismallgroup.name } : null
            }
        };
        
        console.log('Returning user scope:', responseData);
        return NextResponse.json(responseData, { status: 200 });

    } catch (error) {
        console.error("Error fetching user scope:", error);
        console.error("Error details:", {
            message: error.message,
            code: error.code,
            stack: error.stack
        });
        return NextResponse.json({ 
            error: 'Failed to fetch user scope',
            details: error.message 
        }, { status: 500 });
    }
}
