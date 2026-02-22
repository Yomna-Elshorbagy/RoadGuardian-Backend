import { z } from "zod";

export const getTelemetryQuerySchema = z.object({
  query: z.object({
    device_id: z.string().optional(),
    limit: z.string().regex(/^\d+$/, "Limit must be a number").optional(),
  }),
});

export const createTelemetrySchema = z.object({
  body: z.object({
    device_id: z.string().min(1, "device_id is required"),
    event_time: z.string().min(1, "event_time is required"), // Can add date format validation if needed
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    speed: z.number().optional(),
    accel_x: z.number().optional(),
    accel_y: z.number().optional(),
    accel_z: z.number().optional(),
    gyro_x: z.number().optional(),
    gyro_y: z.number().optional(),
    gyro_z: z.number().optional(),
    engine_temp: z.number().optional(),
    fuel_level: z.number().optional(),
    battery_voltage: z.number().optional(),
    raw_payload_json: z.any().optional(), // Could be object or stringified JSON
  }),
});

export const telemetryIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID must be a number"),
  }),
});
