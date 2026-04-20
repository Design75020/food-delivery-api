import { Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import {
  createOrderService,
  listOrdersService,
  getOrderByIdService,
  updateOrderStatusService,
} from "./orders.service";
import { sendSuccess, sendCreated } from "../../utils/response";
import { AuthenticatedRequest } from "../../types";

export async function createOrder(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const order = await createOrderService(req.user!.sub, req.body);
    sendCreated(res, order, "Order placed successfully");
  } catch (err) {
    next(err);
  }
}

export async function listOrders(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { orders, meta } = await listOrdersService(
      req.user!.sub,
      req.user!.role as Role,
      req.query as never
    );
    sendSuccess(res, orders, "Orders retrieved", 200, meta);
  } catch (err) {
    next(err);
  }
}

export async function getOrderById(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = String(req.params["id"]);
    const order = await getOrderByIdService(
      id,
      req.user!.sub,
      req.user!.role as Role
    );
    sendSuccess(res, order);
  } catch (err) {
    next(err);
  }
}

export async function updateOrderStatus(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = String(req.params["id"]);
    const order = await updateOrderStatusService(
      id,
      req.user!.sub,
      req.user!.role as Role,
      req.body
    );
    sendSuccess(res, order, "Order status updated");
  } catch (err) {
    next(err);
  }
}
