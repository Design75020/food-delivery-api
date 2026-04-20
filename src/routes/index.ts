import { Router, IRouter } from "express";
import authRoutes from "../modules/auth/auth.routes";
import restaurantRoutes from "../modules/restaurants/restaurants.routes";
import orderRoutes from "../modules/orders/orders.routes";
import courierRoutes from "../modules/couriers/couriers.routes";

const router: IRouter = Router();

router.use("/auth", authRoutes);
router.use("/restaurants", restaurantRoutes);
router.use("/orders", orderRoutes);
router.use("/couriers", courierRoutes);

export default router;
