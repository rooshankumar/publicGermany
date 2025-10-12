import { z } from 'zod';

/**
 * Validation schemas for forms with security best practices
 * - Trim whitespace
 * - Enforce length limits
 * - Validate email format
 * - Prevent XSS with proper sanitization
 */

export const contactFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Name cannot be empty" })
    .max(100, { message: "Name must be less than 100 characters" })
    .regex(/^[a-zA-Z\s'-]+$/, { message: "Name can only contain letters, spaces, hyphens, and apostrophes" }),
  
  email: z
    .string()
    .trim()
    .email({ message: "Invalid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  
  inquiry_type: z
    .string()
    .min(1, { message: "Please select an inquiry type" }),
  
  message: z
    .string()
    .trim()
    .min(10, { message: "Message must be at least 10 characters" })
    .max(2000, { message: "Message must be less than 2000 characters" }),
});

export const profileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(1, { message: "Full name is required" })
    .max(100, { message: "Name must be less than 100 characters" }),
  
  date_of_birth: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const date = new Date(val);
      const age = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      return age >= 16 && age <= 100;
    }, { message: "Age must be between 16 and 100" }),
  
  bachelor_cgpa_percentage: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0 && num <= 100;
    }, { message: "CGPA/Percentage must be between 0 and 100" }),
});

export const reviewSchema = z.object({
  rating: z
    .number()
    .min(1, { message: "Rating must be at least 1" })
    .max(5, { message: "Rating cannot exceed 5" }),
  
  review_text: z
    .string()
    .trim()
    .min(10, { message: "Review must be at least 10 characters" })
    .max(1000, { message: "Review must be less than 1000 characters" }),
  
  service_type: z
    .string()
    .optional(),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type ReviewFormData = z.infer<typeof reviewSchema>;
