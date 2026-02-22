import { z } from "zod";

export const createReviewSchema = z.object({
  body: z.object({
    user_id: z.number().int().positive().optional(),
    name: z.string().min(1, "Name is required"),
    role: z.string().min(1, "Role is required"),
    rating: z.number().min(0).max(5),
    comment: z.string().optional(),
  }),
});

export const reviewIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID must be a number"),
  }),
});
