import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../prisma/client";
import { z } from "zod";
import { auth } from "../../../authentication/auth";
import { getUserScopeFilter } from "../../../utils/auth";

// Helper function to check if user has access to an attendance record
async function checkAttendanceAccess(userId: string, attendanceId: number): Promise<{ hasAccess: boolean; attendanceRecord?: any; error?: string }> {
    try {
        const scopeFilter = await getUserScopeFilter(userId);
        
        if (!scopeFilter.hasAccess) {
            return { hasAccess: false, error: "Access denied" };
        }

        // Get the attendance record to check if user has access
        const attendanceRecord = await prisma.attendance.findUnique({
            where: { id: attendanceId },
            include: {
                member: { select: { regionId: true, universityId: true, smallGroupId: true, alumniGroupId: true } }
            }
        });

        if (!attendanceRecord) {
            return { hasAccess: false, error: "Attendance record not found" };
        }

        // Check if user has access to this attendance record
        let hasAccess = false;
        if (['superadmin', 'national'].includes(scopeFilter.scope)) {
            hasAccess = true;
        } else if (scopeFilter.scope === 'region' && scopeFilter.regionId) {
            hasAccess = attendanceRecord.member.regionId === scopeFilter.regionId;
        } else if (scopeFilter.scope === 'university' && scopeFilter.universityId) {
            hasAccess = attendanceRecord.member.universityId === scopeFilter.universityId;
        } else if (scopeFilter.scope === 'smallgroup' && scopeFilter.smallGroupId) {
            hasAccess = attendanceRecord.member.smallGroupId === scopeFilter.smallGroupId;
        } else if (scopeFilter.scope === 'alumnismallgroup' && scopeFilter.alumniGroupId) {
            hasAccess = attendanceRecord.member.alumniGroupId === scopeFilter.alumniGroupId;
        }

        return { hasAccess, attendanceRecord };
    } catch (error) {
        console.error('Error checking attendance access:', error);
        return { hasAccess: false, error: "Access denied" };
    }
}

const updateAttendanceSchema = z.object({
  status: z.enum(["present", "absent", "excused"]),
  notes: z.string().max(1000).optional(),
});

// GET single attendance record
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid attendance ID" }, { status: 400 });
    }

    // Check access permission for this attendance record
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const accessCheck = await checkAttendanceAccess(session.user.id, id);
    if (!accessCheck.hasAccess) {
      return NextResponse.json(
        { error: accessCheck.error || "Access denied to this attendance record" },
        { status: accessCheck.error === "Attendance record not found" ? 404 : 403 }
      );
    }

    // Get the full attendance record with related data
    const attendanceRecord = await prisma.attendance.findUnique({
      where: { id },
      include: {
        member: { 
          select: { 
            id: true, 
            firstname: true, 
            secondname: true,
            regionId: true,
            universityId: true,
            smallGroupId: true,
            alumniGroupId: true
          } 
        },
        permanentministryevent: { select: { id: true, name: true } },
        trainings: { select: { id: true, name: true } }
      }
    });

    return NextResponse.json(attendanceRecord, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch attendance record" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid attendance ID" }, { status: 400 });
    }

    // Check access permission for this attendance record
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const accessCheck = await checkAttendanceAccess(session.user.id, id);
    if (!accessCheck.hasAccess) {
      return NextResponse.json(
        { error: accessCheck.error || "Access denied to this attendance record" },
        { status: accessCheck.error === "Attendance record not found" ? 404 : 403 }
      );
    }

    const body = await request.json();
    const validation = updateAttendanceSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({ 
        error: "Invalid data", 
        details: validation.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const data = validation.data;
    
    const updatedAttendance = await prisma.attendance.update({
      where: { id },
      data: {
        status: data.status,
        notes: data.notes,
      },
      include: {
        member: { select: { id: true, firstname: true, secondname: true } },
        permanentministryevent: { select: { id: true, name: true } },
        trainings: { select: { id: true, name: true } }
      }
    });

    return NextResponse.json(updatedAttendance, { status: 200 });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Attendance record not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update attendance record" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid attendance ID" }, { status: 400 });
    }

    // Check access permission for this attendance record
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const accessCheck = await checkAttendanceAccess(session.user.id, id);
    if (!accessCheck.hasAccess) {
      return NextResponse.json(
        { error: accessCheck.error || "Access denied to this attendance record" },
        { status: accessCheck.error === "Attendance record not found" ? 404 : 403 }
      );
    }

    await prisma.attendance.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Attendance record deleted successfully" }, { status: 200 });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Attendance record not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to delete attendance record" }, { status: 500 });
  }
} 