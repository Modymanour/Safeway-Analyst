import type { Response, Request } from "express";
import { Logger } from "pino";


export class ControllerErrorHelper {
    static handle(
        err: unknown,
        req: Request,
        res: Response,
        log: Logger,
        state?: Record<string, unknown>
    ): Response {
        const error = err instanceof Error ? err : new Error(String(err));

        log.error({
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack,
            },
            state,
        });

        if (error.name === "NotFoundError") {
            return res.status(404).json({ error: "Not Found error", msg: error.message });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({ error: "Validation error", msg: error.message });
        }

        if (error.name === "UnauhtorizedError") {
            return res.status(403).json({ error: "Unauthorized error", msg: error.message });
        }

        if (error.name === "ForbiddenError") {
            return res.status(401).json({ error: "Forbidden error", msg: error.message });
        }

        if (error.name === "ZodError") {
            return res.status(400).json({ error: "Schema error", msg: error.message });
        }

        if (typeof (error as { issues?: unknown }).issues !== "undefined") {
            return res.status(400).json({
                error: "Invalid request payload",
                issues: (error as { issues?: unknown }).issues,
            });
        }

        return res.status(500).json({
            error: "Internal server error",
            msg: error.message
        });
    }
}

export const handleError = ControllerErrorHelper.handle; 
