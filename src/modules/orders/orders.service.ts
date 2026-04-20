import { OrderStatus, Role, Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { NotFound, Forbidden, BadRequest } from "../../utils/AppError";
import { parsePagination } from "../../utils/pagination";
import { buildPaginationMeta } from "../../utils/response";
import {
  CreateOrderInput,
  UpdateStatusInput,
  OrderQueryInput,
  STATUS_TRANSITIONS,
  ROLE_ALLOWED_TRANSITIONS,
} from "./orders.schema";

// ─────────────────────────────────────────────
// Create Order
// ─────────────────────────────────────────────

export async function createOrderService(
  clientId: string,
  input: CreateOrderInput
) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: input.restaurantId },
  });

  if (!restaurant) throw NotFound("Restaurant not found");
  if (!restaurant.isOpen) throw BadRequest("Restaurant is currently closed");

  const menuItemIds = input.items.map((i) => i.menuItemId);
  const menuItems = await prisma.menuItem.findMany({
    where: {
      id: { in: menuItemIds },
      restaurantId: input.restaurantId,
      isAvailable: true,
    },
  });

  if (menuItems.length !== menuItemIds.length) {
    throw BadRequest(
      "One or more menu items are invalid, unavailable, or do not belong to this restaurant"
    );
  }

  const priceMap = new Map(menuItems.map((m) => [m.id, m.price]));

  let totalAmount = 0;
  const orderItemsData = input.items.map((item) => {
    const unitPrice = Number(priceMap.get(item.menuItemId));
    const totalPrice = unitPrice * item.quantity;
    totalAmount += totalPrice;
    return {
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      unitPrice,
      totalPrice,
      notes: item.notes,
    };
  });

  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        clientId,
        restaurantId: input.restaurantId,
        deliveryAddress: input.deliveryAddress,
        notes: input.notes,
        totalAmount,
        status: OrderStatus.PENDING,
        items: { create: orderItemsData },
      },
      include: {
        items: { include: { menuItem: { select: { name: true } } } },
        restaurant: { select: { id: true, name: true } },
        client: { select: { id: true, name: true, email: true } },
      },
    });

    await tx.orderStatusLog.create({
      data: {
        orderId: newOrder.id,
        fromStatus: null,
        toStatus: OrderStatus.PENDING,
        changedBy: clientId,
        note: "Order created",
      },
    });

    return newOrder;
  });

  return order;
}

// ─────────────────────────────────────────────
// List Orders (role-filtered)
// ─────────────────────────────────────────────

export async function listOrdersService(
  requesterId: string,
  requesterRole: Role,
  query: OrderQueryInput
) {
  const { skip, take, page, limit } = parsePagination(query.page, query.limit);

  const where: Prisma.OrderWhereInput = {};

  if (requesterRole === Role.CLIENT) {
    where.clientId = requesterId;
  } else if (requesterRole === Role.RESTAURANT) {
    const restaurant = await prisma.restaurant.findUnique({
      where: { ownerId: requesterId },
      select: { id: true },
    });
    if (restaurant) where.restaurantId = restaurant.id;
    else return { orders: [], meta: buildPaginationMeta(0, page, limit) };
  } else if (requesterRole === Role.COURIER) {
    const courier = await prisma.courier.findUnique({
      where: { userId: requesterId },
      select: { id: true },
    });
    if (courier) where.courierId = courier.id;
    else return { orders: [], meta: buildPaginationMeta(0, page, limit) };
  }

  if (query.status) where.status = query.status;
  if (query.restaurantId && requesterRole === Role.ADMIN) {
    where.restaurantId = query.restaurantId;
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, name: true, email: true } },
        restaurant: { select: { id: true, name: true } },
        courier: {
          include: { user: { select: { id: true, name: true } } },
        },
        items: {
          include: { menuItem: { select: { id: true, name: true, price: true } } },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return { orders, meta: buildPaginationMeta(total, page, limit) };
}

// ─────────────────────────────────────────────
// Get Order by ID
// ─────────────────────────────────────────────

export async function getOrderByIdService(
  orderId: string,
  requesterId: string,
  requesterRole: Role
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      client: { select: { id: true, name: true, email: true } },
      restaurant: { select: { id: true, name: true, address: true } },
      courier: {
        include: { user: { select: { id: true, name: true } } },
      },
      items: {
        include: { menuItem: { select: { id: true, name: true, price: true } } },
      },
      statusLogs: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!order) throw NotFound("Order not found");

  if (requesterRole === Role.CLIENT && order.clientId !== requesterId) {
    throw Forbidden("You do not have access to this order");
  }

  if (requesterRole === Role.RESTAURANT) {
    const restaurant = await prisma.restaurant.findUnique({
      where: { ownerId: requesterId },
    });
    if (!restaurant || order.restaurantId !== restaurant.id) {
      throw Forbidden("You do not have access to this order");
    }
  }

  return order;
}

// ─────────────────────────────────────────────
// Update Order Status
// ─────────────────────────────────────────────

export async function updateOrderStatusService(
  orderId: string,
  requesterId: string,
  requesterRole: Role,
  input: UpdateStatusInput
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { restaurant: true },
  });

  if (!order) throw NotFound("Order not found");

  const allowedNext = STATUS_TRANSITIONS[order.status];
  if (!allowedNext.includes(input.status)) {
    throw BadRequest(
      `Invalid status transition: ${order.status} → ${input.status}. Allowed: ${allowedNext.join(", ") || "none"}`
    );
  }

  const roleAllowed = ROLE_ALLOWED_TRANSITIONS[requesterRole] ?? [];
  if (!roleAllowed.includes(input.status)) {
    throw Forbidden(
      `Role ${requesterRole} cannot set status to ${input.status}`
    );
  }

  if (requesterRole === Role.RESTAURANT) {
    if (order.restaurant.ownerId !== requesterId) {
      throw Forbidden("You do not own this restaurant");
    }
  }

  if (requesterRole === Role.COURIER) {
    const courier = await prisma.courier.findUnique({
      where: { userId: requesterId },
    });
    if (!courier || order.courierId !== courier.id) {
      throw Forbidden("This order is not assigned to you");
    }
  }

  const updateData: Prisma.OrderUpdateInput = {
    status: input.status,
  };

  if (input.status === OrderStatus.DELIVERING && input.courierId) {
    const courier = await prisma.courier.findUnique({
      where: { id: input.courierId },
    });
    if (!courier) throw NotFound("Courier not found");
    updateData.courier = { connect: { id: input.courierId } };
  }

  const updatedOrder = await prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        client: { select: { id: true, name: true } },
        restaurant: { select: { id: true, name: true } },
        courier: { include: { user: { select: { name: true } } } },
        items: { include: { menuItem: { select: { name: true } } } },
        statusLogs: { orderBy: { createdAt: "asc" } },
      },
    });

    await tx.orderStatusLog.create({
      data: {
        orderId,
        fromStatus: order.status,
        toStatus: input.status,
        changedBy: requesterId,
        note: input.note,
      },
    });

    return updated;
  });

  return updatedOrder;
}
