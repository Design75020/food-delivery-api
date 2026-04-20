import bcrypt from "bcryptjs";
import { prisma } from "../../config/prisma";
import { signToken } from "../../utils/jwt";
import { Unauthorized, Conflict } from "../../utils/AppError";
import { LoginInput, RegisterInput } from "./auth.schema";

const SALT_ROUNDS = 12;

export async function loginService(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: {
      id: true,
      email: true,
      password: true,
      name: true,
      role: true,
    },
  });

  if (!user) {
    throw Unauthorized("Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.password);
  if (!isPasswordValid) {
    throw Unauthorized("Invalid email or password");
  }

  const token = signToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
}

export async function registerService(input: RegisterInput) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    throw Conflict("Email already registered");
  }

  const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      password: hashedPassword,
      name: input.name,
      role: input.role,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  const token = signToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  return { token, user };
}

export async function getMeService(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      restaurant: {
        select: { id: true, name: true },
      },
      courier: {
        select: { id: true, isAvailable: true, vehicleType: true },
      },
    },
  });

  if (!user) {
    throw Unauthorized("User not found");
  }

  return user;
}
