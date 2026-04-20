import { Request, Response, NextFunction } from "express";
import { NotFound } from "../utils/AppError";

export function notFound(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  next(NotFound(`Route ${req.method} ${req.originalUrl} not found`));
}
