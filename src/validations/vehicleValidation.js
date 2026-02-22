import { z } from "zod";

export const createVehicleSchema = z.object({
  body: z.object({
    owner_user_id: z.number().int().positive().optional(),
    plate_number: z.string().min(1, "plate_number is required"),
    vin: z.string().optional(),
    brand: z.string().optional(),
    model: z.string().optional(),
    year: z
      .number()
      .int()
      .min(1886)
      .max(new Date().getFullYear() + 1)
      .optional(),
    status: z.string().optional(),
  }),
});

export const vehicleIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID must be a number"),
  }),
});
