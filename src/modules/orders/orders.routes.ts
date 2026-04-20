import { Router, IRouter } from "express";
import {
  createOrder,
  listOrders,
  getOrderById,
  updateOrderStatus,
} from "./orders.controller";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validate } from "../../middlewares/validate";
import {
  createOrderSchema,
  updateStatusSchema,
  orderQuerySchema,
} from "./orders.schema";

const router: IRouter = Router();

// All order routes require authentication
router.use(authenticate);

/**
 * @route  POST /orders
 * @desc   Place a new order
 * @access CLIENT
 */
router.post(
  "/",
  authorize("CLIENT"),
  validate(createOrderSchema),
  createOrder
);

/**
 * @route  GET /orders
 * @desc   List orders (filtered by role)
 * @access ALL authenticated roles
 */
router.get(
  "/",
  authorize("ADMIN", "RESTAURANT", "CLIENT", "COURIER"),
  validate(orderQuerySchema, "query"),
  listOrders
);

/**
 * @route  GET /orders/:id
 * @desc   Get a single order with full details
 * @access ALL authenticated roles (with access control)
 */
router.get(
  "/:id",
  authorize("ADMIN", "RESTAURANT", "CLIENT", "COURIER"),
  getOrderById
);

/**
 * @route  PATCH /orders/:id/status
 * @desc   Update order status (workflow enforced)
 * @access ADMIN | RESTAURANT | COURIER
 */
router.patch(
  "/:id/status",
  authorize("ADMIN", "RESTAURANT", "COURIER"),
  validate(updateStatusSchema),
  updateOrderStatus
);

export default router;
