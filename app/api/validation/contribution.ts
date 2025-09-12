import { z } from "zod";

export const createContributionSchema = z.object({
    contributorId: z.number().int().positive("Contributor ID is required"),
    amount: z.number().positive("Amount must be positive"),
    method: z.enum(["mobile_money", "bank_transfer", "card", "worldremit"], {
        errorMap: () => ({ message: "Invalid payment method" })
    }),
    designationId: z.union([
        z.string().transform((val) => {
            if (!val || val === "" || val === null) return null;
            const num = Number(val);
            return isNaN(num) ? null : num;
        }),
        z.number().int().positive(),
        z.null(),
    ]).optional(),
    status: z.enum(["pending", "completed", "failed", "refunded", "processing", "cancelled"]).default("pending"),
    transactionId: z.string().optional(),
    paymentTransactionId: z.union([
        z.string().transform((val) => {
            if (!val || val === "" || val === null) return null;
            const num = Number(val);
            return isNaN(num) ? null : num;
        }),
        z.number().int().positive(),
        z.null(),
    ]).optional(),
    memberId: z.union([
        z.string().transform((val) => {
            if (!val || val === "" || val === null) return null;
            const num = Number(val);
            return isNaN(num) ? null : num;
        }),
        z.number().int().positive(),
        z.null(),
    ]).optional(),
});
