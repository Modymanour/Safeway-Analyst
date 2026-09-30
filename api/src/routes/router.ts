import { Router } from 'express';
import { UserVisitController } from '../controllers/uservisit.controller';
import { DashboardController } from '../controllers/dashboard.controller';

export const router = Router();

const userVisitController = new UserVisitController();
const dashboardController = new DashboardController();


/* ========================================================================== */
/* User Visit                                                                 */
/* ========================================================================== */
router.post("/api/user-visit", userVisitController.create);

router.get("/api/user-visit/search", userVisitController.search);

router.get("/api/user-visit/get", userVisitController.getAll);

/* ========================================================================== */
/* Dashboard                                                                  */
/* ========================================================================== */

router.get("/api/dashboard/get-current-year-data", dashboardController.getCurrentYearData);

router.get("/api/dashboard/get-current-month-data", dashboardController.getCurrentMonthData);

router.get("/api/dashboard/get-custom-month-data", dashboardController.getCustomMonthData);

router.get("/api/dashboard/get-custom-month-range-data", dashboardController.getCustomMonthRangeData);

router.get("/api/dashboard/get-specific-months-data", dashboardController.getSpecificMonthsData);

router.get("/api/dashboard/search-users", dashboardController.searchUsers);

router.get("/api/dashboard/get-all-users", dashboardController.getUsers);