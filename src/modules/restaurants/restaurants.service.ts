import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { NotFound, Forbidden, Conflict } from "../../utils/AppError";
import { parsePagination } from "../../utils/pagination";
import { buildPaginationMeta } from "../../utils/response";
import {
  CreateRestaurantInput,
  UpdateRestaurantInput,
  CreateMenuItemInput,
  UpdateMenuItemInput,
  RestaurantQueryInput,
} from "./restaurants.schema";

// ─────────────────────────────────────────────
// Restaurant CRUD
// ─────────────────────────────────────────────

export async function listRestaurantsService(query: RestaurantQueryInput) {
  const { skip, take, page, limit } = parsePagination(query.page, query.limit);

  const where: Prisma.RestaurantWhereInput = {};

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { description: { contains: query.search, mode: "insensitive" } },
    ];
  }

  if (query.isOpen !== undefined) {
    where.isOpen = query.isOpen === "true";
  }

  const [restaurants, total] = await Promise.all([
    prisma.restaurant.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        address: true,
        phone: true,
        imageUrl: true,
        isOpen: true,
        createdAt: true,
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { menuItems: true, orders: true } },
      },
    }),
    prisma.restaurant.count({ where }),
  ]);

  return { restaurants, meta: buildPaginationMeta(total, page, limit) };
}

export async function getRestaurantByIdService(id: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      menuItems: {
        where: { isAvailable: true },
        orderBy: { category: "asc" },
      },
    },
  });

  if (!restaurant) {
    throw NotFound("Restaurant not found");
  }

  return restaurant;
}

export async function createRestaurantService(
  ownerId: string,
  input: CreateRestaurantInput
) {
  const existing = await prisma.restaurant.findUnique({ where: { ownerId } });
  if (existing) {
    throw Conflict("You already own a restaurant");
  }

  return prisma.restaurant.create({
    data: { ...input, ownerId },
    include: { owner: { select: { id: true, name: true } } },
  });
}

export async function updateRestaurantService(
  restaurantId: string,
  requesterId: string,
  requesterRole: string,
  input: UpdateRestaurantInput
) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
  });

  if (!restaurant) throw NotFound("Restaurant not found");

  if (requesterRole !== "ADMIN" && restaurant.ownerId !== requesterId) {
    throw Forbidden("You do not own this restaurant");
  }

  return prisma.restaurant.update({
    where: { id: restaurantId },
    data: input,
  });
}

// ─────────────────────────────────────────────
// Menu Items
// ─────────────────────────────────────────────

export async function createMenuItemService(
  restaurantId: string,
  requesterId: string,
  requesterRole: string,
  input: CreateMenuItemInput
) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
  });

  if (!restaurant) throw NotFound("Restaurant not found");

  if (requesterRole !== "ADMIN" && restaurant.ownerId !== requesterId) {
    throw Forbidden("You do not own this restaurant");
  }

  return prisma.menuItem.create({
    data: { ...input, restaurantId, price: input.price },
  });
}

export async function updateMenuItemService(
  menuItemId: string,
  requesterId: string,
  requesterRole: string,
  input: UpdateMenuItemInput
) {
  const item = await prisma.menuItem.findUnique({
    where: { id: menuItemId },
    include: { restaurant: true },
  });

  if (!item) throw NotFound("Menu item not found");

  if (requesterRole !== "ADMIN" && item.restaurant.ownerId !== requesterId) {
    throw Forbidden("You do not own this restaurant");
  }

  return prisma.menuItem.update({
    where: { id: menuItemId },
    data: input,
  });
}

export async function deleteMenuItemService(
  menuItemId: string,
  requesterId: string,
  requesterRole: string
) {
  const item = await prisma.menuItem.findUnique({
    where: { id: menuItemId },
    include: { restaurant: true },
  });

  if (!item) throw NotFound("Menu item not found");

  if (requesterRole !== "ADMIN" && item.restaurant.ownerId !== requesterId) {
    throw Forbidden("You do not own this restaurant");
  }

  await prisma.menuItem.delete({ where: { id: menuItemId } });
}
