import { Router, IRouter, Response, NextFunction } from "express";
import { z } from "zod";
import {
  listCouriersService,
  getCourierProfileService,
  createCourierProfileService,
  updateCourierAvailabilityService,
} from "./couriers.service";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validate } from "../../middlewares/validate";
import { sendSuccess, sendCreated } from "../../utils/response";
import { AuthenticatedRequest } from "../../types";

const router: IRouter = Router();

const createCourierSchema = z.object({
  vehicleType: z.string().optional(),
});

const updateCourierSchema = z.object({
  isAvailable: z.boolean().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

/**
 * @route  GET /couriers
 * @desc   List all couriers
 * @access ADMIN
 */
router.get(
  "/",
  authenticate,
  authorize("ADMIN"),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const available =
        req.query["available"] === "true"
          ? true
          : req.query["available"] === "false"
          ? false
          : undefined;
      const { couriers, meta } = await listCouriersService(
        req.query["page"],
        req.query["limit"],
        available
      );
      sendSuccess(res, couriers, "Couriers retrieved", 200, meta);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @route  GET /couriers/me
 * @desc   Get own courier profile
 * @access COURIER
 */
router.get(
  "/me",
  authenticate,
  authorize("COURIER"),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const courier = await getCourierProfileService(req.user!.sub);
      sendSuccess(res, courier);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @route  POST /couriers/profile
 * @desc   Create courier profile for a COURIER user
 * @access COURIER
 */
router.post(
  "/profile",
  authenticate,
  authorize("COURIER"),
  validate(createCourierSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const courier = await createCourierProfileService(req.user!.sub, req.body);
      sendCreated(res, courier, "Courier profile created");
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @route  PATCH /couriers/:userId/availability
 * @desc   Update courier availability and location
 * @access COURIER (own) | ADMIN
 */
router.patch(
  "/:userId/availability",
  authenticate,
  authorize("COURIER", "ADMIN"),
  validate(updateCourierSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = String(req.params["userId"]);
      const courier = await updateCourierAvailabilityService(
        userId,
        req.user!.sub,
        req.user!.role,
        req.body
      );
      sendSuccess(res, courier, "Courier availability updated");
    } catch (err) {
      next(err);
    }
  }
);

export default router;
