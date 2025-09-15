import { z } from "zod";

export const createUserSchema = z.object({
    name: z.string().min(1, "Name is required").max(255, "Name cannot exceed 255 characters"),
    username: z.string().min(3, "Username must be at least 3 characters").max(50, "Username cannot exceed 50 characters"),
    email: z.string().email("Invalid email address").max(255, "Email cannot exceed 255 characters"),
    password: z.string().min(6, "Password must be at least 6 characters").max(100, "Password cannot exceed 100 characters"),
    confirmPassword: z.string().min(6, "Password confirmation is required"),
    contact: z.string().max(20, "Contact cannot exceed 20 characters").optional().or(z.literal("")).or(z.null()),
    status: z.enum(["active", "inactive", "suspended"]).optional().default("active"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

export const updateUserSchema = z.object({
    id: z.string().min(1, "User ID is required"),
    name: z.string().min(1, "Name is required").max(255, "Name cannot exceed 255 characters").optional(),
    username: z.string().min(3, "Username must be at least 3 characters").max(50, "Username cannot exceed 50 characters").optional(),
    email: z.string().email("Invalid email address").max(255, "Email cannot exceed 255 characters").optional(),
    password: z.string().min(6, "Password must be at least 6 characters").max(100, "Password cannot exceed 100 characters").optional(),
    contact: z.string().max(20, "Contact cannot exceed 20 characters").optional().or(z.literal("")).or(z.null()),
    status: z.enum(["active", "inactive", "suspended"]).optional(),
});

export const userRoleSchema = z.object({
    userId: z.string().min(1, "User ID is required"),
    regionId: z.number().int().positive().optional().or(z.null()),
    universityId: z.number().int().positive().optional().or(z.null()),
    smallGroupId: z.number().int().positive().optional().or(z.null()),
    alumniGroupId: z.number().int().positive().optional().or(z.null()),
    scope: z.enum(["superadmin", "national", "region", "university", "smallgroup", "alumnismallgroup"]).default("superadmin"),
});


