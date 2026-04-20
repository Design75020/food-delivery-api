import { Request, Response, NextFunction } from "express";
import { loginService, registerService, getMeService } from "./auth.service";
import { sendSuccess, sendCreated } from "../../utils/response";
import { AuthenticatedRequest } from "../../types";

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await loginService(req.body);
    sendSuccess(res, result, "Login successful");
  } catch (err) {
    next(err);
  }
}

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await registerService(req.body);
    sendCreated(res, result, "Registration successful");
  } catch (err) {
    next(err);
  }
}

export async function getMe(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await getMeService(req.user!.sub);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}
