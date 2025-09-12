import { z } from "zod";

export const createDesignationSchema = z.object({
    name: z.string().min(1, "Designation name is required").max(255, "Designation name cannot exceed 255 characters"),
    description: z.string().optional(),
    isActive: z.boolean().default(true),
    targetAmount: z.union([
        z.string().transform((val) => {
            if (!val || val === "" || val === null) return null;
            const num = Number(val);
            return isNaN(num) ? null : num;
        }),
        z.number().positive(),
        z.null(),
    ]).optional(),
    regionId: z.union([
        z.string().transform((val) => {
            if (!val || val === "" || val === null) return null;
            const num = Number(val);
            return isNaN(num) ? null : num;
        }),
        z.number().int().positive(),
        z.null(),
    ]).optional(),
    universityId: z.union([
        z.string().transform((val) => {
            if (!val || val === "" || val === null) return null;
            const num = Number(val);
            return isNaN(num) ? null : num;
        }),
        z.number().int().positive(),
        z.null(),
    ]).optional(),
    smallGroupId: z.union([
        z.string().transform((val) => {
            if (!val || val === "" || val === null) return null;
            const num = Number(val);
            return isNaN(num) ? null : num;
        }),
        z.number().int().positive(),
        z.null(),
    ]).optional(),
}); 