import { Router, IRouter } from "express";
import { login, register, getMe } from "./auth.controller";
import { validate } from "../../middlewares/validate";
import { authenticate } from "../../middlewares/authenticate";
import { loginSchema, registerSchema } from "./auth.schema";

const router: IRouter = Router();

/**
 * @route  POST /auth/login
 * @desc   Authenticate user and return JWT
 * @access Public
 */
router.post("/login", validate(loginSchema), login);

/**
 * @route  POST /auth/register
 * @desc   Register a new user
 * @access Public
 */
router.post("/register", validate(registerSchema), register);

/**
 * @route  GET /auth/me
 * @desc   Get current authenticated user profile
 * @access Private
 */
router.get("/me", authenticate, getMe);

export default router;
