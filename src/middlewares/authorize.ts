import { Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { Forbidden } from "../utils/AppError";
import { AuthenticatedRequest } from "../types";

export function authorize(...roles: Role[]) {
  return (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      return next(Forbidden("Authentication required"));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        Forbidden(
          `Access denied. Required roles: ${roles.join(", ")}. Your role: ${req.user.role}`
        )
      );
    }

    next();
  };
}
