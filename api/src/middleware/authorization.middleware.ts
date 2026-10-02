import { NextFunction, Request, RequestHandler, Response } from 'express';
import { logger } from '../lib/loggers/logger.ts';
import { checkPermission } from "../config/permissions.ts";

const log = logger.child({
    component: "authorization.middleware"
});

export const authorizationMiddleware = (action: string): RequestHandler => (req: Request, res: Response, next: NextFunction) => {
    const role = req.user?.role;

    if (!role) {
        log.warn({
            message: 'No role found in user object',
            requestId: req.id,
            method: req.method,
            url: req.url
        });
        return res.status(403).json({ message: 'No role found in user object' });
    }
    if (!checkPermission(role, action)) {
        log.warn({
            message: `User with role ${role} does not have permission to perform action ${action}`,
            requestId: req.id,
            method: req.method,
            url: req.url
        });
        return res.status(403).json({ message: `User with role ${role} does not have permission to perform action ${action}` });
    }
    next();
};