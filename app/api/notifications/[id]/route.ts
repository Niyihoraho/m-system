import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { updateNotificationSchema } from "../../validation/notification";
import { getUserScope } from "@/lib/rls";
import { NotificationService } from "@/lib/notification-service";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Get user scope for RLS
        const userScope = await getUserScope();
        if (!userScope) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const notificationId = parseInt(params.id);
        if (isNaN(notificationId)) {
            return NextResponse.json({ error: "Invalid notification ID" }, { status: 400 });
        }

        // Build where clause with RLS
        const where: any = { id: notificationId };
        if (userScope.scope !== 'superadmin') {
            where.userId = userScope.userId;
        }

        const notification = await prisma.notification.findFirst({
            where,
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

        if (!notification) {
            return NextResponse.json({ error: "Notification not found" }, { status: 404 });
        }

        return NextResponse.json(notification, { status: 200 });

    } catch (error) {
        console.error("Error fetching notification:", error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Get user scope for RLS
        const userScope = await getUserScope();
        if (!userScope) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const notificationId = parseInt(params.id);
        if (isNaN(notificationId)) {
            return NextResponse.json({ error: "Invalid notification ID" }, { status: 400 });
        }

        const body = await request.json();
        const validation = updateNotificationSchema.safeParse(body);
        
        if (!validation.success) {
            return NextResponse.json(
                { error: "Validation failed", details: validation.error.issues },
                { status: 400 }
            );
        }

        const data = validation.data;

        // Build where clause with RLS
        const where: any = { id: notificationId };
        if (userScope.scope !== 'superadmin') {
            where.userId = userScope.userId;
        }

        // Check if notification exists and user has access
        const existingNotification = await prisma.notification.findFirst({
            where
        });

        if (!existingNotification) {
            return NextResponse.json({ error: "Notification not found" }, { status: 404 });
        }

        // Update notification
        const updatedNotification = await prisma.notification.update({
            where: { id: notificationId },
            data: {
                ...(data.status && { status: data.status }),
                ...(data.readAt !== undefined && { readAt: data.readAt }),
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

        // If notification is being marked as read and user is a small group leader, send university notification
        if (data.readAt && userScope.scope === 'smallgroup' && existingNotification.eventType === 'attendance_miss') {
            try {
                await NotificationService.sendUniversityNotificationOnMarkRead(notificationId, userScope.userId);
            } catch (notificationError) {
                console.error('Error sending university notification:', notificationError);
                // Don't fail the request if university notification fails
            }
        }

        return NextResponse.json(updatedNotification, { status: 200 });

    } catch (error) {
        console.error("Error updating notification:", error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Get user scope for RLS
        const userScope = await getUserScope();
        if (!userScope) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const notificationId = parseInt(params.id);
        if (isNaN(notificationId)) {
            return NextResponse.json({ error: "Invalid notification ID" }, { status: 400 });
        }

        // Build where clause with RLS
        const where: any = { id: notificationId };
        if (userScope.scope !== 'superadmin') {
            where.userId = userScope.userId;
        }

        // Check if notification exists and user has access
        const existingNotification = await prisma.notification.findFirst({
            where
        });

        if (!existingNotification) {
            return NextResponse.json({ error: "Notification not found" }, { status: 404 });
        }

        // Delete notification
        await prisma.notification.delete({
            where: { id: notificationId }
        });

        return NextResponse.json({ message: "Notification deleted successfully" }, { status: 200 });

    } catch (error) {
        console.error("Error deleting notification:", error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
