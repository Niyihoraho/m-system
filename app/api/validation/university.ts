import { z } from "zod";

export const createUniversitySchema = z.object({
    name: z.string().min(1, "University name is required").max(255, "University name cannot exceed 255 characters"),
    regionId: z.union([
        z.string().transform((val) => {
            if (!val || val === "" || val === null) return null;
            const num = Number(val);
            return isNaN(num) ? null : num;
        }),
        z.number().int().positive(),
    ]).refine((val) => val !== null, { message: "Region is required" }),
}); 