import { z } from "zod";

export const createUserRoleSchema = z.object({
  userId: z.string().min(1),
  scope: z.enum(["superadmin","national","region","university","smallgroup","alumnismallgroup"]),
  regionId: z.number().int().positive().nullable().optional(),
  universityId: z.number().int().positive().nullable().optional(),
  smallGroupId: z.number().int().positive().nullable().optional(),
  alumniGroupId: z.number().int().positive().nullable().optional(),
}).superRefine((data, ctx) => {
  if (data.scope === "region" && !data.regionId) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["regionId"], message: "Region is required" });
  if (data.scope === "university" && !data.universityId) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["universityId"], message: "University is required" });
  if (data.scope === "smallgroup" && !data.smallGroupId) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["smallGroupId"], message: "Small group is required" });
  if (data.scope === "alumnismallgroup" && !data.alumniGroupId) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["alumniGroupId"], message: "Alumni small group is required" });
});

export type CreateUserRoleInput = z.infer<typeof createUserRoleSchema>;