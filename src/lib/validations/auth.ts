import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z
  .object({
    full_name: z.string().min(2, "Full name is required"),
    email: z.string().email("Enter a valid university email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    role: z.enum(["teacher", "student"]),
    phone: z.string().optional(),
    roll_number: z.string().optional(),
    program_id: z.string().optional(),
    batch_year: z.number().optional(),
    department_id: z.string().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((d) => d.role !== "student" || (d.roll_number && d.roll_number.length >= 3), {
    message: "Roll number is required for students",
    path: ["roll_number"],
  })
  .refine((d) => d.role !== "student" || d.program_id, {
    message: "Select your program",
    path: ["program_id"],
  })
  .refine((d) => d.role !== "teacher" || d.department_id, {
    message: "Select your department",
    path: ["department_id"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
