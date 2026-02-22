import { z } from "zod";

export const createAlertSchema = z.object({
  body: z.object({
    device_id: z.string().min(1, "device_id is required"),
    alert_type: z.string().min(1, "alert_type is required"),
    severity: z.string().optional(),
    message: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }),
});

export const alertIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID must be a number"),
  }),
});
