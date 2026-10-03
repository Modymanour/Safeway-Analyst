import { env } from "../config/env";
import jwt from "jsonwebtoken";

export interface Payload {
    sub: string, // user id
    username: string,
    email: string,
    tokenType: 'access' | 'refresh',
    role: string
    iat?: number,
    iss: string,
}

const createToken = (payload: Payload, secret: string, expiresIn: jwt.SignOptions['expiresIn']) => {
    return jwt.sign(payload, secret, { expiresIn });
}

export const generateAccessToken = (payload: Payload) => {
    return createToken(payload, env.JWT_SECRET, '15m');
}

export const generateRefreshToken = (payload: Payload) => {
    return createToken(payload, env.JWT_REFRESH_SECRET, '7d');
}