import { Router, type IRouter } from "express";
import healthRouter from "./health";
import votersRouter from "./voters";
import membersRouter from "./members";
import contentRouter from "./content";

const router: IRouter = Router();

router.use(healthRouter);
router.use(membersRouter);
router.use(contentRouter);
router.use(votersRouter);

export default router;
