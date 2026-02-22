import { z } from "zod";

export const ackAlertParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID must be a number"),
  }),
});

export const accidentIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID must be a number"),
  }),
});

export const updateAccidentStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID must be a number"),
  }),
  body: z.object({
    status: z.enum(["pending", "reviewed", "resolved", "dismissed"], {
      errorMap: () => ({ message: "Invalid status" }),
    }),
  }),
});
