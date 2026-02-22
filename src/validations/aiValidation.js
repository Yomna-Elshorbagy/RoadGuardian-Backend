import { z } from "zod";

export const createPredictionSchema = z.object({
  body: z.object({
    media_id: z.number().int().positive(),
    related_accident_id: z.number().int().positive().optional(),
    model_name: z.string().min(1, "model_name is required"),
    model_version: z.string().optional(),
    prediction_type: z.string().min(1, "prediction_type is required"),
    confidence: z.number().min(0).max(1).optional(),
    result_json: z.any(),
  }),
});

export const predictRiskSchema = z.object({
  body: z.object({
    device_id: z.string().min(1, "device_id is required"),
    media_id: z.number().int().positive().optional(),
  }),
});

export const predictionIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID must be a number"),
  }),
});
