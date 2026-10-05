import { Router } from 'express';
import { UserVisitController } from '../controllers/uservisit.controller';
import { DashboardController } from '../controllers/dashboard.controller';
import { AuthController } from '../controllers/auth.controller';
import { authenticationMiddleware } from "../middleware/authentication.middleware";
import { authorizationMiddleware } from "../middleware/authorization.middleware" 

export const router = Router();

const userVisitController = new UserVisitController();
const dashboardController = new DashboardController();
const authController = new AuthController();


/* ========================================================================== */
/* User Visit                                                                 */
/* ========================================================================== */
router.post("/api/user-visit", userVisitController.create);

router.get("/api/user-visit/search", authenticationMiddleware, authorizationMiddleware('read'), userVisitController.search);

router.get("/api/user-visit/get", authenticationMiddleware, authorizationMiddleware('read'), userVisitController.getAll);

/* ========================================================================== */
/* Dashboard                                                                  */
/* ========================================================================== */

router.get("/api/dashboard/get-current-year-data", authenticationMiddleware, authorizationMiddleware('read'), dashboardController.getCurrentYearData);

router.get("/api/dashboard/get-current-month-data", authenticationMiddleware, authorizationMiddleware('read'), dashboardController.getCurrentMonthData);

router.get("/api/dashboard/get-custom-month-data", authenticationMiddleware, authorizationMiddleware('read'), dashboardController.getCustomMonthData);

router.get("/api/dashboard/get-custom-month-range-data", authenticationMiddleware, authorizationMiddleware('read'), dashboardController.getCustomMonthRangeData);

router.get("/api/dashboard/get-specific-months-data", authenticationMiddleware, authorizationMiddleware('read'), dashboardController.getSpecificMonthsData);

router.get("/api/dashboard/delete-user", authenticationMiddleware, authorizationMiddleware("delete_user"), dashboardController.delete);

router.get("/api/dashboard/search-users", authenticationMiddleware, authorizationMiddleware('read'), dashboardController.searchUsers);

router.get("/api/dashboard/get-all-users", authenticationMiddleware, authorizationMiddleware('read'), dashboardController.getUsers);

/* ========================================================================== */
/* Auth                                                                       */
/* ========================================================================== */

router.post("/api/dashboard/create-admin", authenticationMiddleware, authorizationMiddleware("create"), authController.create_admin);

router.post("/api/dashboard/create-user", authenticationMiddleware, authorizationMiddleware("create"), authController.create_user);

router.post("/api/dashboard/sign-in", authController.sign_in);

router.post("/api/dashboard/sign-out", authController.sign_out);

router.put("/api/dashboard/change-role", authenticationMiddleware, authorizationMiddleware("change_permissions"), authController.change_role);

router.post("/api/dashboard/sign-in-with-refresh-token", authController.sign_in_with_refresh_token);

router.post("/api/dashboard/verification-token", authController.create_verification_token);

router.post("/api/dashboard/verification-token/confirm", authController.confirm_verification_token);

router.post("/api/dashboard/password-reset-token", authController.create_password_token);

router.post("/api/dashboard/password-reset-token/confirm", authController.confirm_password_token);