import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserScope } from "@/lib/rls";
import { z } from "zod";

// Validation schema for updating attendance
const updateAttendanceSchema = z.object({
  status: z.enum(["present", "absent", "excused"]).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userScope = await getUserScope();
        if (!userScope) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const resolvedParams = await params;
        const attendanceId = parseInt(resolvedParams.id);
    if (isNaN(attendanceId)) {
      return NextResponse.json({ error: "Invalid attendance ID" }, { status: 400 });
    }

    // Get attendance record with related data
    const attendanceRecord = await prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: {
        member: {
          select: {
            id: true,
            firstname: true,
            secondname: true,
            email: true,
            phone: true,
            regionId: true,
            universityId: true,
            smallGroupId: true,
            alumniGroupId: true,
          }
        },
        permanentministryevent: {
          select: {
            id: true,
            name: true,
            type: true,
          }
        },
        trainings: {
          select: {
            id: true,
            name: true,
            description: true,
          }
        }
      }
    });

    if (!attendanceRecord) {
      return NextResponse.json({ error: "Attendance record not found" }, { status: 404 });
    }

    // Apply RLS - users can only view attendance records within their scope
    if (userScope.scope !== 'superadmin') {
      const member = attendanceRecord.member;
      if (!member) {
        return NextResponse.json({ error: "Member not found" }, { status: 404 });
      }

      let hasAccess = false;
      if (userScope.smallGroupId && member.smallGroupId === userScope.smallGroupId) {
        hasAccess = true;
      } else if (userScope.universityId && member.universityId === userScope.universityId) {
        hasAccess = true;
      } else if (userScope.regionId && member.regionId === userScope.regionId) {
        hasAccess = true;
      }

      if (!hasAccess) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    return NextResponse.json(attendanceRecord);

  } catch (error) {
    console.error("Error fetching attendance record:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userScope = await getUserScope();
        if (!userScope) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const resolvedParams = await params;
        const attendanceId = parseInt(resolvedParams.id);
    if (isNaN(attendanceId)) {
      return NextResponse.json({ error: "Invalid attendance ID" }, { status: 400 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateAttendanceSchema.parse(body);

    // Get existing attendance record to check access
    const existingRecord = await prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: {
        member: {
          select: {
            regionId: true,
            universityId: true,
            smallGroupId: true,
            alumniGroupId: true,
          }
        }
      }
    });

    if (!existingRecord) {
      return NextResponse.json({ error: "Attendance record not found" }, { status: 404 });
    }

    // Apply RLS - users can only edit attendance records within their scope
    if (userScope.scope !== 'superadmin') {
      const member = existingRecord.member;
      if (!member) {
        return NextResponse.json({ error: "Member not found" }, { status: 404 });
      }

      let hasAccess = false;
      if (userScope.smallGroupId && member.smallGroupId === userScope.smallGroupId) {
        hasAccess = true;
      } else if (userScope.universityId && member.universityId === userScope.universityId) {
        hasAccess = true;
      } else if (userScope.regionId && member.regionId === userScope.regionId) {
        hasAccess = true;
      }

      if (!hasAccess) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    // Update attendance record
    const updatedRecord = await prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        ...validatedData,
      },
      include: {
        member: {
          select: {
            id: true,
            firstname: true,
            secondname: true,
            email: true,
            phone: true,
          }
        },
        permanentministryevent: {
          select: {
            id: true,
            name: true,
            type: true,
          }
        },
        trainings: {
          select: {
            id: true,
            name: true,
            description: true,
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedRecord,
      message: "Attendance record updated successfully"
    });

  } catch (error) {
    console.error("Error updating attendance record:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Validation error", 
        details: error.issues 
      }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userScope = await getUserScope();
        if (!userScope) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const resolvedParams = await params;
        const attendanceId = parseInt(resolvedParams.id);
    if (isNaN(attendanceId)) {
      return NextResponse.json({ error: "Invalid attendance ID" }, { status: 400 });
    }

    // Get existing attendance record to check access
    const existingRecord = await prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: {
        member: {
          select: {
            regionId: true,
            universityId: true,
            smallGroupId: true,
            alumniGroupId: true,
          }
        }
      }
    });

    if (!existingRecord) {
      return NextResponse.json({ error: "Attendance record not found" }, { status: 404 });
    }

    // Apply RLS - users can only delete attendance records within their scope
    if (userScope.scope !== 'superadmin') {
      const member = existingRecord.member;
      if (!member) {
        return NextResponse.json({ error: "Member not found" }, { status: 404 });
      }

      let hasAccess = false;
      if (userScope.smallGroupId && member.smallGroupId === userScope.smallGroupId) {
        hasAccess = true;
      } else if (userScope.universityId && member.universityId === userScope.universityId) {
        hasAccess = true;
      } else if (userScope.regionId && member.regionId === userScope.regionId) {
        hasAccess = true;
      }

      if (!hasAccess) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    // Delete attendance record
    await prisma.attendance.delete({
      where: { id: attendanceId }
    });

    return NextResponse.json({
      success: true,
      message: "Attendance record deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting attendance record:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}