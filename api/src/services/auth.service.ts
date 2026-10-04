import { pool, Queryable } from "../db/pool.ts";
import { UserRepository, UserRow } from "../repositories/user.repository.ts";
import { RefreshTokenRepository } from "../repositories/refresh_token.repository.ts"
import { PasswordTokenRepository } from "../repositories/password_token.repository.ts"
import { hash_password, verify_password } from "../lib/hash.ts";
import { NotFoundError, ValidationError } from '../lib/errors/errors.ts';
import { logger } from "../lib/loggers/logger.ts";
import { Http_Response } from "../lib/responses.ts";
import { generateAccessToken, generateRefreshToken, Payload } from "../lib/auth.helper.ts";
import { UUID } from "node:crypto";

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
            throw new ValidationError("User already exists");
        }
        if (!this.validate_password(input.password)) {
            throw new ValidationError("Password does not meet minimum requirements");
        }

        const user = await this.userRepo.create(this.db, {
            username: input.username,
            email: input.email,
            password: hash_password(input.password),
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
            throw new ValidationError("User already exists");
        }

        const password_valid = this.validate_password(input.password);
        if(!password_valid){
            log.warn({
                action: "sign_up",
                msg: "Password does not meet requirements",
                email: input.email,
            });
            throw new ValidationError("Password does not meet minimum requirements");
        }

        const hashed_password = hash_password(input.password);
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

        const access_token = generateAccessToken(payload);
        const refresh_token = generateRefreshToken(payload);

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
            throw new ValidationError("User already exists");
        }

        const password_valid = this.validate_password(input.password);
        if(!password_valid){
            log.warn({
                action: "sign_up",
                msg: "Password does not meet requirements",
                email: input.email,
            });
            throw new ValidationError("Password does not meet minimum requirements");
        }

        const hashed_password = hash_password(input.password);
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
        const access_token = generateAccessToken(payload);
        const refresh_token = generateRefreshToken(payload);

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
        email = email.trim().toLowerCase();
        const user = await this.userRepo.getByEmail(this.db, email);
        if(!user){
            log.warn({
                action: "sign_in",
                msg: "User not found",
                email: email,
            });
            throw new NotFoundError("User not found");
        }

        const is_valid_password = verify_password(user.password, password);
        if(!is_valid_password){
            log.warn({
                action: "sign_in",
                msg: "Invalid password",
                email: email,
            });
            throw new ValidationError("Invalid Password");
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
        const access_token = generateAccessToken(payload);
        const refresh_token = generateRefreshToken(payload);

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
        refresh_token: string
    ): Promise<Http_Response<null>> {
        const refresh_token_exists = await this.refreshTokenRepo.getByToken(this.db, refresh_token);
        if(!refresh_token_exists){
            log.warn({
                action: "sign_out",
                msg: "Refresh token not found",
            });
            throw new NotFoundError("Refresh Token not found");
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
            throw new NotFoundError("Refresh Token not found");
        }

        if (new Date(refresh_token_exists.expires_at).getTime() <= Date.now()) {
            await this.refreshTokenRepo.delete(this.db, refresh_token_exists.id);
            throw new ValidationError("Refresh Token expired");
        }

        const user = await this.userRepo.getById(this.db, refresh_token_exists.user_id);
        if(!user){
            log.warn({
                action: "sign_in_with_refresh_token",
                msg: "User not found",
                user_id: refresh_token_exists.user_id,
            });
            throw new NotFoundError("User not found");
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
        const access_token = generateAccessToken(payload);
        const refresh_token_string = generateRefreshToken(payload);
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
    async change_role(
        user_id: UUID,
        new_role: 'user' | 'admin'
    ): Promise<Http_Response<TokensRow>>{
        const user = await this.userRepo.getById(this.db, user_id);

        if(user?.role === new_role){
            log.debug({
                action: "change_role",
                msg: "given the same role as the current role",
                user_id: user.id,
                email: user.email,
            });
            throw new ValidationError("given the same role as the current role");
        }

        const result = await this.userRepo.update(this.db, user_id, { 
            role: new_role
        });

        if(!result) throw new ValidationError("Something happened");
        const payload: Payload = {
            sub: result.id.toString(),
            email: result.email,
            username: result.username,
            tokenType: "access",
            role: result.role,
            iat: Math.floor(new Date().getTime() / 1000),
            iss: "safeway-api"
        };

        const access_token = generateAccessToken(payload);
        const refresh_token_string = generateRefreshToken(payload);

        await this.refreshTokenRepo.update_with_user_id(this.db, result.id,  {
            token: refresh_token_string,
            expires_at: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000)
        })

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
        return response;
    }

    validate_password(password: string) {
        //Have at least one number
        //Have at least one uppercase letter
        //Have at least one lowercase letter
        //Have at least one special character ($, @, #, %, _, -)
        // Require mixed case, a number, a supported symbol, and 8-128 characters.
        const password_regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[$@#%_-]).{8,128}$/;
        return password_regex.test(password);
    }
}