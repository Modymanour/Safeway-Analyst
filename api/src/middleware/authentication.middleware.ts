import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/loggers/logger.ts';
import { Payload } from '../lib/auth.helper.ts';

const log = logger.child({
    component: "authentication.middleware"
});



export const authenticationMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        log.warn({
            message: 'No token provided',
            requestId: req.id,
            method: req.method,
            url: req.url
        });
        return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as Payload | null;

    if(!decoded || decoded.tokenType !== 'access') {
        log.warn({
            message: 'Invalid token',
            requestId: req.id,
            method: req.method,
            url: req.url
        });
        return res.status(403).json({ message: 'Invalid token' });
    }

    req.user = decoded as Payload;

    next();
}