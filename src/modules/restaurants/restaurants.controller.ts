import { Request, Response, NextFunction } from "express";
import {
  listRestaurantsService,
  getRestaurantByIdService,
  createRestaurantService,
  updateRestaurantService,
  createMenuItemService,
  updateMenuItemService,
  deleteMenuItemService,
} from "./restaurants.service";
import { sendSuccess, sendCreated } from "../../utils/response";
import { AuthenticatedRequest } from "../../types";

export async function listRestaurants(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { restaurants, meta } = await listRestaurantsService(req.query as never);
    sendSuccess(res, restaurants, "Restaurants retrieved", 200, meta);
  } catch (err) {
    next(err);
  }
}

export async function getRestaurantById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = String(req.params["id"]);
    const restaurant = await getRestaurantByIdService(id);
    sendSuccess(res, restaurant);
  } catch (err) {
    next(err);
  }
}

export async function createRestaurant(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const restaurant = await createRestaurantService(req.user!.sub, req.body);
    sendCreated(res, restaurant, "Restaurant created");
  } catch (err) {
    next(err);
  }
}

export async function updateRestaurant(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = String(req.params["id"]);
    const restaurant = await updateRestaurantService(
      id,
      req.user!.sub,
      req.user!.role,
      req.body
    );
    sendSuccess(res, restaurant, "Restaurant updated");
  } catch (err) {
    next(err);
  }
}

export async function createMenuItem(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const restaurantId = String(req.params["restaurantId"]);
    const item = await createMenuItemService(
      restaurantId,
      req.user!.sub,
      req.user!.role,
      req.body
    );
    sendCreated(res, item, "Menu item created");
  } catch (err) {
    next(err);
  }
}

export async function updateMenuItem(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const itemId = String(req.params["itemId"]);
    const item = await updateMenuItemService(
      itemId,
      req.user!.sub,
      req.user!.role,
      req.body
    );
    sendSuccess(res, item, "Menu item updated");
  } catch (err) {
    next(err);
  }
}

export async function deleteMenuItem(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const itemId = String(req.params["itemId"]);
    await deleteMenuItemService(
      itemId,
      req.user!.sub,
      req.user!.role
    );
    sendSuccess(res, null, "Menu item deleted");
  } catch (err) {
    next(err);
  }
}
