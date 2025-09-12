import { z } from "zod";

export const createPermanentMinistryEventSchema = z.object({
    name: z.string().min(1, "Event name is required").max(255, "Event name cannot exceed 255 characters"),
    type: z.enum(["bible_study", "discipleship", "evangelism", "cell_meeting", "alumni_meeting", "other"]),
    regionId: z.union([
        z.string().transform((val) => {
            if (!val || val === "" || val === null) return null;
            const num = Number(val);
            return isNaN(num) ? null : num;
        }),
        z.number().int().positive(),
        z.null()
    ]).optional(),
    universityId: z.union([
        z.string().transform((val) => {
            if (!val || val === "" || val === null) return null;
            const num = Number(val);
            return isNaN(num) ? null : num;
        }),
        z.number().int().positive(),
        z.null()
    ]).optional(),
    smallGroupId: z.union([
        z.string().transform((val) => {
            if (!val || val === "" || val === null) return null;
            const num = Number(val);
            return isNaN(num) ? null : num;
        }),
        z.number().int().positive(),
        z.null()
    ]).optional(),
    alumniGroupId: z.union([
        z.string().transform((val) => {
            if (!val || val === "" || val === null) return null;
            const num = Number(val);
            return isNaN(num) ? null : num;
        }),
        z.number().int().positive(),
        z.null()
    ]).optional(),
    isActive: z.boolean().default(true),
}); 