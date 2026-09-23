import os from "node:os";
import { pino } from "pino"
import { env } from "../config/env.ts";

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