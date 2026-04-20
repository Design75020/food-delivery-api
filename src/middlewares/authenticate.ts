import { Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { Unauthorized } from "../utils/AppError";
import { AuthenticatedRequest } from "../types";

export function authenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(Unauthorized("Missing or invalid Authorization header"));
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch {
    next(Unauthorized("Invalid or expired token"));
  }
}
