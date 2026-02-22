import { z } from "zod";

export const createMediaSchema = z.object({
  body: z.object({
    device_id: z.string().min(1, "device_id is required"),
    media_type: z.enum(["video", "image", "audio"]).optional(),
    file_url: z.string().url("Must be a valid URL").optional(),
    description: z.string().optional(),
  }),
});

export const mediaIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID must be a number"),
  }),
});
