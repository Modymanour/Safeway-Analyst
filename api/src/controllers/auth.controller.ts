import { type Request, type Response } from "express";
import { AuthService } from "../services/auth.service.ts"
import {
    registerSchema,
    verificationTokenRequestSchema,
    verificationTokenConfirmSchema,
    passwordTokenRequestSchema,
    passwordTokenConfirmSchema,
} from "../schemas";
import { logger, logError, logZodError, slowLog, logInfo } from "../lib/loggers/logger";
import { ControllerErrorHelper } from "../lib/controller.helper";
import { performance } from "node:perf_hooks";
import { ValidationError } from "../lib/errors/errors";
import { UUID } from "node:crypto";

const log = logger.child({
    component: "auth_controller"
});

export class AuthController{
    constructor(
        private readonly authService = new AuthService()
    ) {}
    create_admin = async(
        req: Request,
        res: Response
    ): Promise<Response> => {
        const start = performance.now();

        try{
            const parse = registerSchema.safeParse(req.body);
            if(!parse.success){
                logZodError(log, parse.error, "create_admin", req, res);
                return ControllerErrorHelper.handle(parse.error, req, res, log, {
                    body: req.body,
                    method: req.method,
                    path: req.originalUrl,
                });
            }

            const data = await this.authService.create_dashboard_user(parse.data, "admin");
            data.url = req.originalUrl;
            data.time_taken_ms = performance.now() - start;
            if(data.time_taken_ms > 1000){
                slowLog(log, data, "create_admin", req, res);
            }
            else{
                logInfo(log, data, "create_admin", req);
            }
            return res.status(data.status_code ?? 201).json(data);
        }catch (err){
            logError(log, err, "create_admin", req);
            return ControllerErrorHelper.handle(err, req, res, log, {
                body: req.body,
                method: req.method,
                path: req.originalUrl,
            })
        }
    }

    create_user = async(
        req: Request,
        res: Response
    ): Promise<Response> => {
        const start = performance.now();
        try {
            const parse = registerSchema.safeParse(req.body);
            if (!parse.success) {
                logZodError(log, parse.error, "create_user", req, res);
                return ControllerErrorHelper.handle(parse.error, req, res, log, {
                    body: req.body, method: req.method, path: req.originalUrl,
                });
            }
            const data = await this.authService.create_dashboard_user(parse.data, "user");
            data.url = req.originalUrl;
            data.time_taken_ms = performance.now() - start;
            logInfo(log, data, "create_user", req);
            return res.status(data.status_code ?? 201).json(data);
        } catch (err) {
            logError(log, err, "create_user", req);
            return ControllerErrorHelper.handle(err, req, res, log, {
                body: req.body, method: req.method, path: req.originalUrl,
            });
        }
    };

    sign_in = async(
        req: Request,
        res: Response
    ): Promise<Response> => {
        const start = performance.now();

        try{
            if(!req.body.email || !req.body.password){
                logError(log, new ValidationError("Email and password are required"), "sign_in", req);
                return ControllerErrorHelper.handle(new ValidationError("Email and password are required"), req, res, log, {
                    body: req.body,
                    method: req.method,
                    path: req.originalUrl,
                });
            }
            const { email, password } = req.body;
            const data = await this.authService.sign_in(email, password);
            data.url = req.originalUrl;
            data.time_taken_ms = performance.now() - start;
            if(data.time_taken_ms > 1000){
                slowLog(log, data, "sign_in", req, res);
            }
            else{
                logInfo(log, data, "sign_in", req);
            }
            return res.status(data.status_code ?? 200).json(data);
        } catch (err){
            logError(log, err, "sign_in", req);
            return ControllerErrorHelper.handle(err, req, res, log, {
                body: req.body,
                method: req.method,
                path: req.originalUrl,
            });
        }
    }

    sign_out = async(
        req: Request,
        res: Response
    ): Promise<Response> => {
        const start = performance.now();
        try{
            if(!req.body.refresh_token){
                logError(log, new ValidationError("refresh token is required"), "sign_out", req);
                return ControllerErrorHelper.handle(new ValidationError("refresh token is required"), req, res, log, {
                    body: req.body,
                    method: req.method,
                    path: req.originalUrl,
                });
            }
            const refresh_token = req.body;

            const data = await this.authService.sign_out(refresh_token);
            data.url = req.originalUrl;
            data.time_taken_ms = performance.now() - start;
            if(data.time_taken_ms > 1000){
                slowLog(log, data, "sign_out", req, res);
            }
            else{
                logInfo(log, data, "sign_out", req);
            }
            return res.status(data.status_code ?? 200).json(data);
        }catch (err){
            logError(log, err, "sign_out", req);
            return ControllerErrorHelper.handle(err, req, res, log, {
                body: req.body,
                method: req.method,
                path: req.originalUrl,
            });
        }
    };

    change_role = async(
        req: Request,
        res: Response
    ): Promise<Response> => {
        const start = performance.now();

        try{
            if(!req.query.user_id || !req.query.role){
                logError(log, new ValidationError("user_id and role are required"), "change_role", req);
                return ControllerErrorHelper.handle(new ValidationError("user_id and role are required"), req, res, log, {
                    body: req.body,
                    method: req.method,
                    path: req.originalUrl,
                });
            }

            const { user_id, role } = req.query;

            const normalizedRole = role === "user" || role === "admin" ? role : undefined;
            if (!normalizedRole) {
                logError(log, new ValidationError("role must be either 'user' or 'admin'"), "change_role", req);
                return ControllerErrorHelper.handle(new ValidationError("role must be either 'user' or 'admin'"), req, res, log, {
                    body: req.body,
                    method: req.method,
                    path: req.originalUrl,
                });
            }

            const data = await this.authService.change_role(user_id as UUID, normalizedRole);
            data.url = req.originalUrl;
            data.time_taken_ms = performance.now() - start;
            if(data.time_taken_ms > 1000){
                slowLog(log, data, "change_role", req, res);
            }
            else{
                logInfo(log, data, "change_role", req);
            }
            return res.status(data.status_code ?? 200).json(data);

        }catch (err){
            logError(log, err, "change_role", req);
            return ControllerErrorHelper.handle(err, req, res, log, {
                body: req.body,
                method: req.method,
                path: req.originalUrl,
            });
        }
    }

    sign_in_with_refresh_token = async(
        req: Request,
        res: Response
    ): Promise<Response> => {
        const start = performance.now();

        try{
            if(!req.body.refresh_token){
                logError(log, new ValidationError("refresh token is required"), "sign_in_with_refresh_token", req);
                return ControllerErrorHelper.handle(new ValidationError("refresh token is required"), req, res, log, {
                    body: req.body,
                    method: req.method,
                    path: req.originalUrl,
                });
            }
            const refresh_token = req.body.refresh_token;

            const data = await this.authService.sign_in_with_refresh_token(refresh_token as string);
            data.url = req.originalUrl;
            data.time_taken_ms = performance.now() - start;
            if(data.time_taken_ms > 1000){
                slowLog(log, data, "sign_in_with_refresh_token", req, res);
            }
            else{
                logInfo(log, data, "sign_in_with_refresh_token", req);
            }
            return res.status(data.status_code ?? 200).json(data);
        }catch (err){
            logError(log, err, "sign_in_with_refresh_token", req);
            return ControllerErrorHelper.handle(err, req, res, log, {
                body: req.body,
                method: req.method,
                path: req.originalUrl,
            });
        }
    }

    create_verification_token = async(
        req: Request, 
        res: Response
    ): Promise<Response> => {
        const start = performance.now();
        try {
            const parse = verificationTokenRequestSchema.safeParse(req.body);
            if (!parse.success) {
                logZodError(log, parse.error, "create_verification_token", req, res);
                return ControllerErrorHelper.handle(parse.error, req, res, log, {
                    body: req.body, method: req.method, path: req.originalUrl,
                });
            }

            const data = await this.authService.create_verification_token(parse.data.email);
            data.url = req.originalUrl;
            data.time_taken_ms = performance.now() - start;
            logInfo(log, data, "create_verification_token", req);
            return res.status(data.status_code ?? 200).json(data);
        } catch (err) {
            logError(log, err, "create_verification_token", req);
            return ControllerErrorHelper.handle(err, req, res, log, {
                body: req.body, method: req.method, path: req.originalUrl,
            });
        }
    };

    confirm_verification_token = async(
        req: Request,
         res: Response
    ): Promise<Response> => {
        const start = performance.now();
        try {
            const parse = verificationTokenConfirmSchema.safeParse(req.body);
            if (!parse.success) {
                logZodError(log, parse.error, "confirm_verification_token", req, res);
                return ControllerErrorHelper.handle(parse.error, req, res, log, {
                    body: req.body, method: req.method, path: req.originalUrl,
                });
            }

            const data = await this.authService.confirm_verification_token(parse.data.email, parse.data.otp);
            data.url = req.originalUrl;
            data.time_taken_ms = performance.now() - start;
            logInfo(log, data, "confirm_verification_token", req);
            return res.status(data.status_code ?? 200).json(data);
        } catch (err) {
            logError(log, err, "confirm_verification_token", req);
            return ControllerErrorHelper.handle(err, req, res, log, {
                body: req.body, method: req.method, path: req.originalUrl,
            });
        }
    };

    create_password_token = async(
        req: Request,
        res: Response
    ): Promise<Response> => {
        const start = performance.now();
        try {
            const parse = passwordTokenRequestSchema.safeParse(req.body);
            if (!parse.success) {
                logZodError(log, parse.error, "create_password_token", req, res);
                return ControllerErrorHelper.handle(parse.error, req, res, log, {
                    body: req.body, method: req.method, path: req.originalUrl,
                });
            }

            const data = await this.authService.create_password_token(parse.data.email);
            data.url = req.originalUrl;
            data.time_taken_ms = performance.now() - start;
            logInfo(log, data, "create_password_token", req);
            return res.status(data.status_code ?? 200).json(data);
        } catch (err) {
            logError(log, err, "create_password_token", req);
            return ControllerErrorHelper.handle(err, req, res, log, {
                body: req.body, method: req.method, path: req.originalUrl,
            });
        }
    };

    confirm_password_token = async(
        req: Request,
        res: Response
    ): Promise<Response> => {
        const start = performance.now();
        try {
            const parse = passwordTokenConfirmSchema.safeParse(req.body);
            if (!parse.success) {
                logZodError(log, parse.error, "confirm_password_token", req, res);
                return ControllerErrorHelper.handle(parse.error, req, res, log, {
                    body: req.body, method: req.method, path: req.originalUrl,
                });
            }

            const data = await this.authService.confirm_password_token(
                parse.data.email,
                parse.data.otp,
                parse.data.new_password
            );
            data.url = req.originalUrl;
            data.time_taken_ms = performance.now() - start;
            logInfo(log, data, "confirm_password_token", req);
            return res.status(data.status_code ?? 200).json(data);
        } catch (err) {
            logError(log, err, "confirm_password_token", req);
            return ControllerErrorHelper.handle(err, req, res, log, {
                body: req.body, method: req.method, path: req.originalUrl,
            });
        }
    };

}