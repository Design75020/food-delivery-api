import { Router, IRouter } from "express";
import {
  listRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "./restaurants.controller";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validate } from "../../middlewares/validate";
import {
  createRestaurantSchema,
  updateRestaurantSchema,
  createMenuItemSchema,
  updateMenuItemSchema,
  restaurantQuerySchema,
} from "./restaurants.schema";

const router: IRouter = Router();

// ─── Public routes ───────────────────────────

/**
 * @route  GET /restaurants
 * @desc   List all restaurants (with optional filters and pagination)
 * @access Public
 */
router.get("/", validate(restaurantQuerySchema, "query"), listRestaurants);

/**
 * @route  GET /restaurants/:id
 * @desc   Get a single restaurant with its menu
 * @access Public
 */
router.get("/:id", getRestaurantById);

// ─── Protected routes ─────────────────────────

/**
 * @route  POST /restaurants
 * @desc   Create a restaurant (one per RESTAURANT user)
 * @access RESTAURANT
 */
router.post(
  "/",
  authenticate,
  authorize("RESTAURANT"),
  validate(createRestaurantSchema),
  createRestaurant
);

/**
 * @route  PATCH /restaurants/:id
 * @desc   Update restaurant details
 * @access RESTAURANT (owner) | ADMIN
 */
router.patch(
  "/:id",
  authenticate,
  authorize("RESTAURANT", "ADMIN"),
  validate(updateRestaurantSchema),
  updateRestaurant
);

// ─── Menu Items ───────────────────────────────

/**
 * @route  POST /restaurants/:restaurantId/menu
 * @desc   Add a menu item
 * @access RESTAURANT (owner) | ADMIN
 */
router.post(
  "/:restaurantId/menu",
  authenticate,
  authorize("RESTAURANT", "ADMIN"),
  validate(createMenuItemSchema),
  createMenuItem
);

/**
 * @route  PATCH /restaurants/:restaurantId/menu/:itemId
 * @desc   Update a menu item
 * @access RESTAURANT (owner) | ADMIN
 */
router.patch(
  "/:restaurantId/menu/:itemId",
  authenticate,
  authorize("RESTAURANT", "ADMIN"),
  validate(updateMenuItemSchema),
  updateMenuItem
);

/**
 * @route  DELETE /restaurants/:restaurantId/menu/:itemId
 * @desc   Delete a menu item
 * @access RESTAURANT (owner) | ADMIN
 */
router.delete(
  "/:restaurantId/menu/:itemId",
  authenticate,
  authorize("RESTAURANT", "ADMIN"),
  deleteMenuItem
);

export default router;
