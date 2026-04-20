import { z } from "zod";

export const createRestaurantSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  address: z.string().min(5, "Address must be at least 5 characters"),
  phone: z.string().optional(),
  imageUrl: z.string().url("Invalid image URL").optional(),
});

export const updateRestaurantSchema = createRestaurantSchema
  .partial()
  .extend({
    isOpen: z.boolean().optional(),
  });

export const createMenuItemSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.number().positive("Price must be positive"),
  imageUrl: z.string().url().optional(),
  category: z.string().optional(),
  isAvailable: z.boolean().optional().default(true),
});

export const updateMenuItemSchema = createMenuItemSchema.partial();

export const restaurantQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  isOpen: z.enum(["true", "false"]).optional(),
});

export type CreateRestaurantInput = z.infer<typeof createRestaurantSchema>;
export type UpdateRestaurantInput = z.infer<typeof updateRestaurantSchema>;
export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;
export type RestaurantQueryInput = z.infer<typeof restaurantQuerySchema>;
