import { z } from "zod";
import { OrderStatus } from "@prisma/client";

export const createOrderSchema = z.object({
  restaurantId: z.string().uuid("Invalid restaurant ID"),
  deliveryAddress: z.string().min(5, "Delivery address is required"),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        menuItemId: z.string().uuid("Invalid menu item ID"),
        quantity: z.number().int().positive("Quantity must be positive"),
        notes: z.string().optional(),
      })
    )
    .min(1, "Order must have at least one item"),
});

// ─────────────────────────────────────────────
// Status transition rules per role
// ─────────────────────────────────────────────

export const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.APPROVED],
  [OrderStatus.APPROVED]: [OrderStatus.PREPARING],
  [OrderStatus.PREPARING]: [OrderStatus.READY],
  [OrderStatus.READY]: [OrderStatus.DELIVERING],
  [OrderStatus.DELIVERING]: [OrderStatus.DONE],
  [OrderStatus.DONE]: [],
};

// Which roles can trigger which transitions
export const ROLE_ALLOWED_TRANSITIONS: Record<string, OrderStatus[]> = {
  ADMIN: [
    OrderStatus.APPROVED,
    OrderStatus.PREPARING,
    OrderStatus.READY,
    OrderStatus.DELIVERING,
    OrderStatus.DONE,
  ],
  RESTAURANT: [OrderStatus.APPROVED, OrderStatus.PREPARING, OrderStatus.READY],
  COURIER: [OrderStatus.DELIVERING, OrderStatus.DONE],
  CLIENT: [], // Clients cannot change status
};

export const updateStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  note: z.string().optional(),
  courierId: z.string().uuid().optional(),
});

export const orderQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.nativeEnum(OrderStatus).optional(),
  restaurantId: z.string().uuid().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type OrderQueryInput = z.infer<typeof orderQuerySchema>;
