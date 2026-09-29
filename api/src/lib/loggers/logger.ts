import os from "node:os";
import { Logger, pino } from "pino"
import { env } from "../../config/env.ts";
import { Http_Response } from "../responses.ts";
import { Request, Response } from "express";

export const logger = pino({
    level: env.PINO_LOG_LEVEL || 'info',
    redact: {
        paths: [
            "req.headers.authorization",
            "password",
            "token",
            "accessToken",
            "refreshToken",
            "connectionString",
        ],
        censor: "[REDACTED]",
    },
    formatters: {
        level: (label) => {
            return {level: label.toUpperCase()}
        },
    },
    base:{
        service: "safeway-api",
        environment: env.NODE_ENV,
        pid: process.pid,
        hostname: os.hostname(),
    },
    timestamp: () => `,"time":"${new Date(Date.now()).toISOString()}"`
});

export const logZodError = (log: Logger, parse: any, action: string, req:Request, res: Response) => {
    log.error({
        msg: "Error",
        status: "Zod error",
        action: action,
        error: parse.error,
        path: req.originalUrl,
        body: req.body
    })
}

export const slowLog = (log: Logger, data: Http_Response<any>, action: string, req: Request, res: Response) => {
    log.warn({ 
        ms: Math.round(data.time_taken_ms ?? 0),
        msg:'Slow query',
        status: "Successful",
        action: action,
        data: data,
        path: req.originalUrl,
        body: req.body
    })
}

export const logError = (log: Logger,err: any, action: string, req: Request) => {
    log.error({
        msg: "Error",
        status: "Error",
        action: action,
        error: err,
        path: req.originalUrl,
        body: req.body
    })
}

export const logInfo = (log: Logger, data: Http_Response<any>, action: string, req:Request) => {
    log.info({ 
        ms: Math.round(data.time_taken_ms ?? 0),
        msg: "Successful",
        status: "Successful",
        action: "create_user_visit",
        data: data,
        path: req.originalUrl,
        body: req.body
    })
}