import { z } from "zod";

export const createTrainingSchema = z.object({
    name: z.string().min(1, "Training name is required").max(255, "Training name cannot exceed 255 characters"),
    description: z.string().optional(),
    startDateTime: z.string().min(1, "Start date and time is required"),
    endDateTime: z.string().optional(),
    location: z.string().optional(),
    regionId: z.union([
        z.string().transform((val) => {
            if (!val || val === "" || val === null) return null;
            const num = Number(val);
            return isNaN(num) ? null : num;
        }),
        z.number().int().positive(),
    ]).optional(),
    universityId: z.union([
        z.string().transform((val) => {
            if (!val || val === "" || val === null) return null;
            const num = Number(val);
            return isNaN(num) ? null : num;
        }),
        z.number().int().positive(),
    ]).optional(),
    smallGroupId: z.union([
        z.string().transform((val) => {
            if (!val || val === "" || val === null) return null;
            const num = Number(val);
            return isNaN(num) ? null : num;
        }),
        z.number().int().positive(),
    ]).optional(),
    alumniGroupId: z.union([
        z.string().transform((val) => {
            if (!val || val === "" || val === null) return null;
            const num = Number(val);
            return isNaN(num) ? null : num;
        }),
        z.number().int().positive(),
    ]).optional(),
    createdById: z.number().int().positive().default(1), // Default to user ID 1 for now
}); 