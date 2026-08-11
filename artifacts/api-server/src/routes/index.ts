import { Router, type IRouter } from "express";
import healthRouter from "./health";
import geographyRouter from "./geography";
import screeningRouter from "./screening";
import votersRouter from "./voters";
import membersRouter from "./members";
import duesRouter from "./dues";
import meetingsRouter from "./meetings";
import contentRouter from "./content";
import storageRouter from "./storage";
import trainingsRouter from "./trainings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(geographyRouter);
router.use(screeningRouter);
router.use(votersRouter);
router.use(membersRouter);
router.use(duesRouter);
router.use(meetingsRouter);
router.use(contentRouter);
router.use(trainingsRouter);
router.use(storageRouter);

export default router;
