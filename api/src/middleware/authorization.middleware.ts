import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/loggers/logger.ts';
import { checkPermission } from "../config/permissions.ts";

const log = logger.child({
    component: "authentication.middleware"
});

const authorizationMiddleware = (req: Request, res: Response, next: NextFunction, actions: string) => {
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
    if (!checkPermission(role, actions)) {
        log.warn({
            message: `User with role ${role} does not have permission to perform action ${actions}`,
            requestId: req.id,
            method: req.method,
            url: req.url
        });
        return res.status(403).json({ message: `User with role ${role} does not have permission to perform action ${actions}` });
    }
    next();
}