import { type Request, type Response } from "express";
import { AuthService } from "../services/auth.service.ts"
import { registerSchema } from "../schemas";
import { logger, logError, logZodError, slowLog, logInfo } from "../lib/loggers/logger";
import { ControllerErrorHelper } from "../lib/controller.helper";
import { performance } from "node:perf_hooks";
import { ValidationError } from "../lib/errors/errors";

const log = logger.child({
    component: "auth_controller"
});

export class AuthController{
    constructor(
        private readonly authService = new AuthService()
    ) {}

    sign_up = async(
        req: Request,
        res: Response
    ): Promise<Response> => {
        const start = performance.now();

        try{
            const parse = registerSchema.safeParse(req.body);
            if(!parse.success){
                logZodError(log, parse.error, "sign_up", req, res);
                return ControllerErrorHelper.handle(parse.error, req, res, log, {
                    body: req.body,
                    method: req.method,
                    path: req.originalUrl,
                });
            }

            const data = await this.authService.sign_up(parse.data);
            data.url = req.originalUrl;
            data.time_taken_ms = performance.now() - start;
            if(data.time_taken_ms > 1000){
                slowLog(log, data, "sign_up", req, res);
            }
            else{
                logInfo(log, data, "sign_up", req);
            }
            return res.status(201).json(data);
        }catch (err){  
            logError(log, err, "sign_up", req);
            return ControllerErrorHelper.handle(err, req, res, log, {
                body: req.body,
                method: req.method,
                path: req.originalUrl,
            })
        }
    }

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
            return res.status(200).json(data);
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
            if(!req.body.user_id || !req.body.refresh_token){
                logError(log, new ValidationError("user_id and refresh token are required"), "sign_out", req);
                return ControllerErrorHelper.handle(new ValidationError("user_id and refresh token are required"), req, res, log, {
                    body: req.body,
                    method: req.method,
                    path: req.originalUrl,
                });
            }
            const {user_id, refresh_token} = req.body;

            const data = await this.authService.sign_out(user_id, refresh_token);
            data.url = req.originalUrl;
            data.time_taken_ms = performance.now() - start;
            if(data.time_taken_ms > 1000){
                slowLog(log, data, "sign_out", req, res);
            }
            else{
                logInfo(log, data, "sign_out", req);
            }
            return res.status(200).json(data);
        }catch (err){
            logError(log, err, "sign_out", req);
            return ControllerErrorHelper.handle(err, req, res, log, {
                body: req.body,
                method: req.method,
                path: req.originalUrl,
            });
        }
    };

    sign_in_with_refresh_token = async(
        req: Request,
        res: Response
    ): Promise<Response> => {
        const start = performance.now();

        try{
            if(!req.params.refresh_token){
                logError(log, new ValidationError("refresh token is required"), "sign_in_with_refresh_token", req);
                return ControllerErrorHelper.handle(new ValidationError("refresh token is required"), req, res, log, {
                    body: req.body,
                    method: req.method,
                    path: req.originalUrl,
                });
            }
            const refresh_token = req.params.refresh_token;

            const data = await this.authService.sign_in_with_refresh_token(refresh_token as string);
            data.url = req.originalUrl;
            data.time_taken_ms = performance.now() - start;
            if(data.time_taken_ms > 1000){
                slowLog(log, data, "sign_in_with_refresh_token", req, res);
            }
            else{
                logInfo(log, data, "sign_in_with_refresh_token", req);
            }
            return res.status(200).json(data);
        }catch (err){
            logError(log, err, "sign_in_with_refresh_token", req);
            return ControllerErrorHelper.handle(err, req, res, log, {
                body: req.body,
                method: req.method,
                path: req.originalUrl,
            });
        }
    }

}