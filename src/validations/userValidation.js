import { z } from "zod";

export const createUserSchema = z.object({
  body: z
    .object({
      name: z.string().min(1, "Name is required").optional(),
      username: z.string().min(1, "Username is required").optional(),
      email: z.string().email("Invalid email format"),
      phone: z.string().optional(),
      role: z.enum(["user", "admin", "driver"]).optional(),
      password: z.string().min(6, "Password must be at least 6 characters"),
      confirmedPassword: z.string().optional(),
      confirmPassword: z.string().optional(),
    })
    .refine((data) => data.name || data.username, {
      message: "name (or username) is required",
      path: ["name"], // Attach error to the name field
    })
    .refine(
      (data) => {
        const confirm =
          data.confirmedPassword ?? data.confirmPassword ?? data.password;
        return data.password === confirm;
      },
      {
        message: "Passwords do not match",
        path: ["confirmPassword"],
      },
    ),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(1, "Password is required"),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    phone: z.string().optional(),
  }),
});

export const updateUserByAdminSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID must be a number"),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    phone: z.string().optional(),
    role: z.enum(["user", "admin", "driver"]).optional(),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z
      .string()
      .min(6, "New password must be at least 6 characters"),
  }),
});

export const userIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID must be a number"),
  }),
});
