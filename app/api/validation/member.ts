import { z } from "zod";

export const createMemberSchema = z.object({
    firstname: z.string().min(1, "First Name is required").max(255, "First Name cannot exceed 255 characters"),
    secondname: z.string().min(1, "Second Name is required").max(255, "Second Name cannot exceed 255 characters"),
    gender: z.enum(["male", "female", "Male", "Female"]).optional().or(z.literal("")).or(z.null()),
    birthdate: z.string().optional().or(z.literal("")).or(z.null()).transform((val) => {
        if (!val || val === "" || val === null) return null;
        const date = new Date(val);
        return isNaN(date.getTime()) ? null : date;
    }),
    placeOfBirthProvince: z.string().max(255).optional().or(z.literal("")).or(z.null()),
    placeOfBirthDistrict: z.string().max(255).optional().or(z.literal("")).or(z.null()),
    placeOfBirthSector: z.string().max(255).optional().or(z.literal("")).or(z.null()),
    placeOfBirthCell: z.string().max(255).optional().or(z.literal("")).or(z.null()),
    placeOfBirthVillage: z.string().max(255).optional().or(z.literal("")).or(z.null()),
    localChurch: z.string().max(255).optional().or(z.literal("")).or(z.null()),
    email: z.string().email("Invalid Email").max(255).optional().or(z.literal("")).or(z.null()),
    phone: z.string().max(20, "Phone cannot exceed 20 characters").optional().or(z.literal("")).or(z.null()),
    type: z.enum(["student", "graduate", "staff", "volunteer", "alumni", "Student", "Graduate", "Staff", "Volunteer", "Alumni"]),
    status: z.enum(["active", "pre_graduate", "graduate", "alumni", "inactive", "Active", "Pre_graduate", "Graduate", "Alumni", "Inactive"]).optional().default("active"),
    regionId: z.union([
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
    universityId: z.union([
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
    graduationDate: z.string().optional().or(z.literal("")).or(z.null()).transform((val) => {
        if (!val || val === "" || val === null) return null;
        const date = new Date(val);
        return isNaN(date.getTime()) ? null : date;
    }),
    faculty: z.string().max(255).optional().or(z.literal("")).or(z.null()),
    professionalism: z.string().max(255).optional().or(z.literal("")).or(z.null()),
    maritalStatus: z.string().max(255).optional().or(z.literal("")).or(z.null()),
});