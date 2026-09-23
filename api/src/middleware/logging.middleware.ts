import { randomUUID } from "node:crypto";
import type { ErrorRequestHandler } from "express";
import pinoHttp from "pino-http";
import { logger } from "../loggers/logger.ts";

export const requestLogger = pinoHttp({
    logger,
    genReqId: (request) =>
        request.headers["x-request-id"]?.toString() ?? randomUUID(),
    customProps: (request) => ({
        userAgent: request.headers["user-agent"],
        method: request.method,
        url: request.url
    }),
});

export const errorLogger: ErrorRequestHandler = (error, request, response, _next) => {
    const applicationError = error as Error & { statusCode?: number };
    const statusCode = applicationError.statusCode ?? 500;

    request.log.error(
        {
            err: applicationError,
            statusCode,
        },
        "request failed",
    );

    response.status(statusCode).json({
        error: statusCode === 500 ? "Internal server error" : applicationError.message,
        requestId: request.id,
    });
};
