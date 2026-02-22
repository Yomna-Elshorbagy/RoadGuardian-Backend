import { z } from "zod";

export const createDeviceSchema = z.object({
  body: z.object({
    device_id: z.string().min(1, "device_id is required"),
    type: z.string().optional(),
    vehicle_id: z.number().int().positive().optional(),
    status: z.string().optional(),
  }),
});

export const deviceIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID must be a number"),
  }),
});
