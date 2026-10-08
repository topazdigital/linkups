import { Router, type IRouter } from "express";
import healthRouter from "./health";
import publicRouter from "./public";
import adminAuthRouter from "../middleware/admin-auth";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(publicRouter);
router.use(adminAuthRouter);
router.use(adminRouter);

export default router;
