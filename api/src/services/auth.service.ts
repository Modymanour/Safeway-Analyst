import { pool, Queryable } from "../db/pool.ts";
import { UserRepository, UserRow } from "../repositories/user.repository.ts";
import { RefreshTokenRepository } from "../repositories/refresh_token.repository.ts"
import { PasswordTokenRepository } from "../repositories/password_token.repository.ts"
import { NotFoundError, ValidationError } from '../lib/errors/errors.ts';
import { logger } from "../lib/loggers/logger.ts";
import { PaginatedResult } from "../repositories/types.ts";
import { Http_Response } from "../lib/responses.ts";
import { generateAccessToken, generateRefreshToken, Payload } from "../lib/auth.helper.ts";
import crypto from "crypto";

const log = logger.child({
    component: "AuthService",
});

export interface TokensRow {
    access_token: string | null,
    refresh_token: string | null
}

export type DashboardAccount = Omit<UserRow, "password">;

export class AuthService {
    constructor(
        private readonly userRepo: UserRepository = new UserRepository(),
        private readonly refreshTokenRepo: RefreshTokenRepository = new RefreshTokenRepository(),
        private readonly passwordTokenRepo: PasswordTokenRepository = new PasswordTokenRepository(),
        private readonly db: Queryable = pool,
    ) {}

    async create_dashboard_user(
        input: { username: string; email: string; password: string },
        role: "admin" | "user"
    ): Promise<Http_Response<DashboardAccount | null>> {
        const user_exists = await this.userRepo.getByEmail(this.db, input.email);
        if (user_exists) {
            return {
                status: "Failed", msg: "Email already in use", status_code: 400, data: null,
                request_id: null, url: null, time_taken_ms: null
            };
        }
        if (!this.validate_password(input.password)) {
            return {
                status: "Failed", msg: "Password does not meet requirements", status_code: 400, data: null,
                request_id: null, url: null, time_taken_ms: null
            };
        }

        const user = await this.userRepo.create(this.db, {
            username: input.username,
            email: input.email,
            password: this.hash_password(input.password),
            role
        });
        const { password: _password, ...account } = user;
        return {
            status: "Success", msg: "User created successfully", status_code: 201, data: account,
            request_id: null, url: null, time_taken_ms: null
        };
    }

    async create_admin(
        input: {
            username: string,
            email: string,
            password: string
        }
    ): Promise<Http_Response<TokensRow>>{
        const user_exists = await this.userRepo.getByEmail(this.db, input.email);
        if(user_exists){
            log.warn({
                action: "sign_up",
                msg: "email already in use",
                email: input.email,
            });
            const response: Http_Response<TokensRow> = {
                status: "Failed",
                msg: "Email already in use",
                status_code: 400,
                data: {
                    access_token: null,
                    refresh_token: null
                },
                request_id: null,
                url: null,
                time_taken_ms: null
            };
            return response;
        }

        const password_valid = this.validate_password(input.password);
        if(!password_valid){
            log.warn({
                action: "sign_up",
                msg: "Password does not meet requirements",
                email: input.email,
            });
            const response: Http_Response<TokensRow> = {
                status: "Failed",
                msg: "Password does not meet requirements",
                status_code: 400,
                data: {
                    access_token: null,
                    refresh_token: null
                },
                request_id: null,
                url: null,
                time_taken_ms: null
            };
            return response;
        }

        const hashed_password = this.hash_password(input.password);
        const user = await this.userRepo.create(this.db, {
            username: input.username,
            email: input.email,
            password: hashed_password,
            role: "admin"
        });

        const now = new Date();

        const payload: Payload = {
            sub: user.id.toString(),
            email: user.email,
            username: user.username,
            tokenType: "access",
            role: user.role,
            iat: Math.floor(now.getTime() / 1000),
            iss: "safeway-api"
        };
        const refresh_payload: Payload = {
            ...payload,
            tokenType: "refresh"
        }
        const access_token = generateAccessToken(payload);
        const refresh_token = generateRefreshToken(refresh_payload);

        await this.refreshTokenRepo.create(this.db,{
            user_id: user.id,
            token: refresh_token,
            expires_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        });

        const response: Http_Response<TokensRow> = {
            status: "Success",
            msg: "User created successfully",
            status_code: 201,
            data: {
                access_token,
                refresh_token
            },
            request_id: null,
            url: null,
            time_taken_ms: null
        };
        log.info({
            action: "sign_up",
            msg: "User created successfully",
            user_id: user.id,
            email: user.email,
        });
        return response;
    };
    async sign_up (
        input: {
            username: string,
            email: string,
            password: string
        }
    ): Promise<Http_Response<TokensRow>>{
        const user_exists = await this.userRepo.getByEmail(this.db, input.email);
        if(user_exists){
            log.warn({
                action: "sign_up",
                msg: "email already in use",
                email: input.email,
            });
            const response: Http_Response<TokensRow> = {
                status: "Failed",
                msg: "Email already in use",
                status_code: 400,
                data: {
                    access_token: null,
                    refresh_token: null
                },
                request_id: null,
                url: null,
                time_taken_ms: null
            };
            return response;
        }

        const password_valid = this.validate_password(input.password);
        if(!password_valid){
            log.warn({
                action: "sign_up",
                msg: "Password does not meet requirements",
                email: input.email,
            });
            const response: Http_Response<TokensRow> = {
                status: "Failed",
                msg: "Password does not meet requirements",
                status_code: 400,
                data: {
                    access_token: null,
                    refresh_token: null
                },
                request_id: null,
                url: null,
                time_taken_ms: null
            };
            return response;
        }

        const hashed_password = this.hash_password(input.password);
        const user = await this.userRepo.create(this.db, {
            username: input.username,
            email: input.email,
            password: hashed_password,
            role: "user"
        });

        const now = new Date();

        const payload: Payload = {
            sub: user.id.toString(),
            email: user.email,
            username: user.username,
            tokenType: "access",
            role: user.role,
            iat: Math.floor(now.getTime() / 1000),
            iss: "safeway-api"
        };
        const refresh_payload: Payload = {
            ...payload,
            tokenType: "refresh"
        }
        const access_token = generateAccessToken(payload);
        const refresh_token = generateRefreshToken(refresh_payload);

        await this.refreshTokenRepo.create(this.db,{
            user_id: user.id,
            token: refresh_token,
            expires_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        });

        const response: Http_Response<TokensRow> = {
            status: "Success",
            msg: "User created successfully",
            status_code: 201,
            data: {
                access_token,
                refresh_token
            },
            request_id: null,
            url: null,
            time_taken_ms: null
        };
        log.info({
            action: "sign_up",
            msg: "User created successfully",
            user_id: user.id,
            email: user.email,
        });
        return response;
    };

    async sign_in (
        email: string,
        password: string
    ): Promise<Http_Response<TokensRow>> {
        const user = await this.userRepo.getByEmail(this.db, email);
        if(!user){
            log.warn({
                action: "sign_in",
                msg: "User not found",
                email: email,
            });
            const response: Http_Response<TokensRow> = {
                status: "Failed",
                msg: "User not found",
                status_code: 404,
                data: {
                    access_token: null,
                    refresh_token: null
                },
                request_id: null,
                url: null,
                time_taken_ms: null
            };
            return response;
        }

        const is_valid_password = this.verify_password(user.password, password);
        if(!is_valid_password){
            log.warn({
                action: "sign_in",
                msg: "Invalid password",
                email: email,
            });
            const response: Http_Response<TokensRow> = {
                status: "Failed",
                msg: "Invalid password",
                status_code: 401,
                data: {
                    access_token: null,
                    refresh_token: null
                },
                request_id: null,
                url: null,
                time_taken_ms: null
            };
            return response;
        }

        const now = new Date();

        const payload: Payload = {
            sub: user.id.toString(),
            email: user.email,
            username: user.username,
            tokenType: "access",
            role: user.role,
            iat: Math.floor(now.getTime() / 1000),
            iss: "safeway-api"
        };
        const refresh_payload: Payload = {
            ...payload,
            tokenType: "refresh"
        }
        const access_token = generateAccessToken(payload);
        const refresh_token = generateRefreshToken(refresh_payload);

        const refresh_token_exists = await this.refreshTokenRepo.getByUserId(this.db, user.id);
        if(!refresh_token_exists){
            await this.refreshTokenRepo.create(this.db,{
                user_id: user.id,
                token: refresh_token,
                expires_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
            });
        } else {
            await this.refreshTokenRepo.update(this.db, refresh_token_exists.id, {
                token: refresh_token,
                expires_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
            });
        }

        const response: Http_Response<TokensRow> = {
            status: "Success",
            msg: "User signed in successfully",
            status_code: 200,
            data: {
                access_token,
                refresh_token
            },
            request_id: null,
            url: null,
            time_taken_ms: null
        };
        log.info({
            action: "sign_in",
            msg: "User signed in successfully",
            user_id: user.id,
            email: user.email,
        });
        return response;
    }

    async sign_out (
        user_id: number,
        refresh_token: string
    ): Promise<Http_Response<null>> {
        const refresh_token_exists = await this.refreshTokenRepo.getByToken(this.db, refresh_token);
        if(!refresh_token_exists){
            log.warn({
                action: "sign_out",
                msg: "Refresh token not found",
                user_id: user_id,
            });
            const response: Http_Response<null> = {
                status: "Failed",
                msg: "Refresh token not found",
                status_code: 404,
                data: null,
                request_id: null,
                url: null,
                time_taken_ms: null
            };
            return response;
        }

        await this.refreshTokenRepo.delete(this.db, refresh_token_exists.id);

        const response: Http_Response<null> = {
            status: "Success",
            msg: "User signed out successfully",
            status_code: 200,
            data: null,
            request_id: null,
            url: null,
            time_taken_ms: null
        };
        log.info({
            action: "sign_out",
            msg: "User signed out successfully",
            user_id: user_id,
        });
        return response;
    }

    async sign_in_with_refresh_token (
        refresh_token: string
    ): Promise<Http_Response<TokensRow>> {
        const refresh_token_exists = await this.refreshTokenRepo.getByToken(this.db, refresh_token);
        if(!refresh_token_exists){
            log.warn({
                action: "sign_in_with_refresh_token",
                msg: "Refresh token not found",
                refresh_token: refresh_token,
            });
            const response: Http_Response<TokensRow> = {
                status: "Failed",
                msg: "Refresh token not found",
                status_code: 404,
                data: {
                    access_token: null,
                    refresh_token: null
                },
                request_id: null,
                url: null,
                time_taken_ms: null
            };
            return response;
        }

        if (new Date(refresh_token_exists.expires_at).getTime() <= Date.now()) {
            await this.refreshTokenRepo.delete(this.db, refresh_token_exists.id);
            return {
                status: "Failed",
                msg: "Refresh token has expired",
                status_code: 401,
                data: { access_token: null, refresh_token: null },
                request_id: null,
                url: null,
                time_taken_ms: null
            };
        }

        const user = await this.userRepo.getById(this.db, refresh_token_exists.user_id);
        if(!user){
            log.warn({
                action: "sign_in_with_refresh_token",
                msg: "User not found",
                user_id: refresh_token_exists.user_id,
            });
            const response: Http_Response<TokensRow> = {
                status: "Failed",
                msg: "User not found",
                status_code: 404,
                data: {
                    access_token: null,
                    refresh_token: null
                },
                request_id: null,
                url: null,
                time_taken_ms: null
            };
            return response;
        }

        const now = new Date();
        
        const payload: Payload = {
            sub: user.id.toString(),
            email: user.email,
            username: user.username,
            tokenType: "access",
            role: user.role,
            iat: Math.floor(now.getTime() / 1000),
            iss: "safeway-api"
        };
        const refresh_payload: Payload = {
            ...payload,
            tokenType: "refresh"
        }
        const access_token = generateAccessToken(payload);
        const refresh_token_string = generateRefreshToken(refresh_payload);
        await this.refreshTokenRepo.update(this.db, refresh_token_exists.id, {
            token: refresh_token_string,
            expires_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        });

        const response: Http_Response<TokensRow> = {
            status: "Success",
            msg: "User signed in successfully",
            status_code: 200,
            data: {
                access_token,
                refresh_token: refresh_token_string
            },
            request_id: null,
            url: null,
            time_taken_ms: null
        };
        log.info({
            action: "sign_in_with_refresh_token",
            msg: "User signed in successfully",
            user_id: user.id,
            email: user.email,
        });
        return response;
    }



    hash_password(password: string) {
        const salt = crypto.randomBytes(16).toString('hex');
        const iterations = 100_000;
        const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
        return `pbkdf2$${iterations}$${salt}$${hash}`;
    };

    verify_password(user_password: string, password: string) {
        const [algorithm, iterationText, salt, storedHash] = user_password.split('$');
        const iterations = Number(iterationText);
        if (algorithm !== 'pbkdf2' || !salt || !storedHash || !Number.isInteger(iterations) || iterations < 1) {
            return false;
        }
        const actualHash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512');
        const expectedHash = Buffer.from(storedHash, 'hex');
        return actualHash.length === expectedHash.length && crypto.timingSafeEqual(actualHash, expectedHash);
    };

    validate_password(password: string) {
        //Have at least one number
        //Have at least one uppercase letter
        //Have at least one lowercase letter
        //Have at least one special character ($, @, #, %)
        // Require mixed case, a number, a supported symbol, and 8-128 characters.
        const password_regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[$@#%]).{8,128}$/;
        return password_regex.test(password);
    }
}