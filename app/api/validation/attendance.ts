import { z } from "zod";

export const createAttendanceSchema = z.object({
  memberId: z.number().int().positive("Member is required"),
  permanentEventId: z.number().int().positive().optional(),
  trainingId: z.number().int().positive().optional(),
  status: z.enum(["present", "absent", "excused"]),
  notes: z.string().max(1000).optional(),
}); 