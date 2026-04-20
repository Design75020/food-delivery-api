import { Role } from "@prisma/client";
import { Request } from "express";

// ─────────────────────────────────────────────
// JWT Payload
// ─────────────────────────────────────────────

export interface JwtPayload {
  sub: string;   // userId
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

// ─────────────────────────────────────────────
// Authenticated Request
// ─────────────────────────────────────────────

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

// ─────────────────────────────────────────────
// API Response wrapper
// ─────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─────────────────────────────────────────────
// Pagination query params
// ─────────────────────────────────────────────

export interface PaginationQuery {
  page?: number;
  limit?: number;
}
