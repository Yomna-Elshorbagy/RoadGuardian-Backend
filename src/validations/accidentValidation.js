import { z } from "zod";

export const createAccidentSchema = z.object({
  body: z.object({
    vehicle_id: z.number().int().positive().optional(),
    device_id: z.string().min(1, "device_id is required"),
    location_lat: z.number().optional(),
    location_lng: z.number().optional(),
    severity: z.string().optional(),
    description: z.string().optional(),
  }),
});

export const accidentIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID must be a number"),
  }),
});
