import { Router } from 'express';
import { UserVisitController } from '../controllers/uservisit.controller';

export const router = Router();

const userVisitController = new UserVisitController();


/* ========================================================================== */
/* User Visit                                                                 */
/* ========================================================================== */
router.post("/api/user-visit", userVisitController.create);

router.get("/api/user-visit/search", userVisitController.search);

router.get("/api/user-visit/get")