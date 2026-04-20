import { prisma } from "../../config/prisma";
import { NotFound, Forbidden, Conflict } from "../../utils/AppError";
import { parsePagination } from "../../utils/pagination";
import { buildPaginationMeta } from "../../utils/response";

export async function listCouriersService(
  page: unknown,
  limit: unknown,
  onlyAvailable?: boolean
) {
  const { skip, take, page: p, limit: l } = parsePagination(page, limit);

  const where = onlyAvailable !== undefined ? { isAvailable: onlyAvailable } : {};

  const [couriers, total] = await Promise.all([
    prisma.courier.findMany({
      where,
      skip,
      take,
      include: {
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { orders: true } },
      },
    }),
    prisma.courier.count({ where }),
  ]);

  return { couriers, meta: buildPaginationMeta(total, p, l) };
}

export async function getCourierProfileService(userId: string) {
  const courier = await prisma.courier.findUnique({
    where: { userId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      orders: {
        take: 10,
        orderBy: { createdAt: "desc" },
        select: { id: true, status: true, createdAt: true },
      },
    },
  });

  if (!courier) throw NotFound("Courier profile not found");
  return courier;
}

export async function createCourierProfileService(
  userId: string,
  data: { vehicleType?: string }
) {
  const existing = await prisma.courier.findUnique({ where: { userId } });
  if (existing) throw Conflict("Courier profile already exists");

  return prisma.courier.create({
    data: { userId, vehicleType: data.vehicleType },
    include: { user: { select: { id: true, name: true } } },
  });
}

export async function updateCourierAvailabilityService(
  userId: string,
  requesterId: string,
  requesterRole: string,
  data: { isAvailable?: boolean; latitude?: number; longitude?: number }
) {
  const courier = await prisma.courier.findUnique({ where: { userId } });
  if (!courier) throw NotFound("Courier not found");

  if (requesterRole !== "ADMIN" && courier.userId !== requesterId) {
    throw Forbidden("You cannot update another courier's profile");
  }

  return prisma.courier.update({
    where: { userId },
    data,
    include: { user: { select: { id: true, name: true } } },
  });
}
