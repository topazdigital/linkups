import { Router, type IRouter } from "express";
import healthRouter from "./health";
import publicRouter from "./public";
import eventsRouter from "./events";
import publicContentRouter from "./public-content";
import newsletterRouter from "./newsletter";
import authRouter from "./auth";
import accountRouter from "./account";
import adminAuthRouter from "../middleware/admin-auth";
import adminRouter from "./admin";
import adminManagementRouter from "./admin-management";

const router: IRouter = Router();

router.use(healthRouter);
router.use(publicRouter);
router.use(eventsRouter);
router.use(publicContentRouter);
router.use(newsletterRouter);
router.use(authRouter);
router.use(accountRouter);
router.use(adminAuthRouter);
router.use(adminRouter);
router.use(adminManagementRouter);

export default router;
