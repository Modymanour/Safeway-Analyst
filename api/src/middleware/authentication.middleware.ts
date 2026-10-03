import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/loggers/logger.ts';
import { Payload } from '../lib/auth.helper.ts';

const log = logger.child({
    component: "authentication.middleware"
});

type AuthenticatedRequest = Request & { id?: string; user?: Payload };

export const authenticationMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authRequest = req as AuthenticatedRequest;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        log.warn({
            message: 'No token provided',
            requestId: authRequest.id,
            method: req.method,
            url: req.url
        });
        return res.status(401).json({ message: 'No token provided' });
    }

    let decoded: Payload;
    try {
        decoded = jwt.verify(token, env.JWT_SECRET) as Payload;
    } catch {
        return res.status(401).json({ message: 'Invalid or expired access token' });
    }

    if (!decoded || decoded.tokenType !== 'access') {
        log.warn({
            message: 'Invalid token',
            requestId: authRequest.id,
            method: req.method,
            url: req.url
        });
        return res.status(401).json({ message: 'Invalid access token' });
    }

    authRequest.user = decoded;

    next();
}