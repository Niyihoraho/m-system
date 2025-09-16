import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user's current scope/role
        const userRole = await prisma.userrole.findFirst({
            where: {
                userId: session.user.id
            },
            include: {
                region: { select: { id: true, name: true } },
                university: { select: { id: true, name: true } },
                smallgroup: { select: { id: true, name: true } },
                alumnismallgroup: { select: { id: true, name: true } }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        if (!userRole) {
            return NextResponse.json({ 
                scope: { 
                    scope: 'superadmin',
                    regionId: null,
                    universityId: null,
                    smallGroupId: null,
                    alumniGroupId: null
                }
            }, { status: 200 });
        }

        return NextResponse.json({
            scope: {
                scope: userRole.scope,
                regionId: userRole.regionId,
                universityId: userRole.universityId,
                smallGroupId: userRole.smallGroupId,
                alumniGroupId: userRole.alumniGroupId,
                region: userRole.region,
                university: userRole.university,
                smallGroup: userRole.smallgroup,
                alumniGroup: userRole.alumnismallgroup
            }
        }, { status: 200 });

    } catch (error) {
        console.error("Error fetching user scope:", error);
        return NextResponse.json({ error: 'Failed to fetch user scope' }, { status: 500 });
    }
}
