import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { createNotificationSchema, updateNotificationSchema } from "../validation/notification";
import { getUserScope, getTableRLSConditions } from "@/lib/rls";

export async function GET(request: NextRequest) {
    try {
        // Get user scope for RLS
        const userScope = await getUserScope();
        if (!userScope) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const status = searchParams.get("status");
        const eventType = searchParams.get("eventType");
        const unreadOnly = searchParams.get("unreadOnly") === "true";

        // Build where clause
        const where: any = {};

        // Apply RLS - users can only see their own notifications
        if (userScope.scope !== 'superadmin') {
            where.userId = userScope.userId;
        } else {
            // Super admin can see all notifications, but can filter by userId
            const userId = searchParams.get("userId");
            if (userId) {
                where.userId = userId;
            }
        }

        // Status filter
        if (status && status !== "all") {
            where.status = status;
        }

        // Event type filter
        if (eventType && eventType !== "all") {
            where.eventType = eventType;
        }

        // Unread only filter
        if (unreadOnly) {
            where.readAt = null;
        }

        // Get notifications with pagination
        const [notifications, total] = await Promise.all([
            prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            username: true
                        }
                    }
                }
            }),
            prisma.notification.count({ where })
        ]);

        return NextResponse.json({
            notifications,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        }, { status: 200 });

    } catch (error) {
        console.error("Error fetching notifications:", error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
        const validation = createNotificationSchema.safeParse(body);
        
        if (!validation.success) {
            return NextResponse.json(
                { error: "Validation failed", details: validation.error.issues },
                { status: 400 }
            );
        }

        const data = validation.data;

        // Check if user exists and has access
        const targetUser = await prisma.user.findUnique({
            where: { id: data.userId }
        });

        if (!targetUser) {
            return NextResponse.json(
                { error: "Target user not found" },
                { status: 404 }
            );
        }

        // Apply RLS - users can only create notifications for themselves or their subordinates
        if (userScope.scope !== 'superadmin' && data.userId !== userScope.userId) {
            // Check if the target user is within the current user's scope
            const targetUserRoles = await prisma.userrole.findMany({
                where: { userId: data.userId }
            });

            const hasAccess = targetUserRoles.some(role => {
                // Check if target user is within current user's scope
                if (userScope.scope === 'region' && userScope.regionId) {
                    return role.regionId === userScope.regionId;
                }
                if (userScope.scope === 'university' && userScope.universityId) {
                    return role.universityId === userScope.universityId;
                }
                if (userScope.scope === 'smallgroup' && userScope.smallGroupId) {
                    return role.smallGroupId === userScope.smallGroupId;
                }
                return false;
            });

            if (!hasAccess) {
                return NextResponse.json(
                    { error: "You can only create notifications for users in your scope" },
                    { status: 403 }
                );
            }
        }

        // Create notification
        const notification = await prisma.notification.create({
            data: {
                userId: data.userId,
                type: data.type,
                subject: data.subject,
                message: data.message,
                eventType: data.eventType,
                eventId: data.eventId,
                metadata: data.metadata,
                status: 'pending',
                sentAt: null
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        username: true
                    }
                }
            }
        });

        return NextResponse.json(notification, { status: 201 });

    } catch (error) {
        console.error("Error creating notification:", error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
