import { afterEach, describe, expect, test, vi } from "vitest";
import type { Queryable } from "../../src/db/pool.ts";
import { UserRepository, type UserRow } from "../../src/repositories/user.repository.ts";
import { RefreshTokenRepository, RefreshTokenRow } from "../../src/repositories/refresh_token.repository.ts";
import { PasswordTokenRepository } from "../../src/repositories/password_token.repository.ts";
import { hash_password } from "../../src/lib/hash.ts";
import { AuthService } from "../../src/services/auth.service.ts";
import { NotFoundError, ValidationError } from "../../src/lib/errors/errors.ts";

const fakeDb: Queryable = { query: vi.fn() };

const tokenRow: RefreshTokenRow  = {
    id: "11111111-1111-1111-1111-111111111111",
    user_id: "11111111-1111-1111-1111-111111111111",
    token: "something-token-wise",
    expires_at: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
    updated_at: new Date(),
    created_at: new Date(),
}

const userRow: UserRow = {
    id: "11111111-1111-1111-1111-111111111111",
    username: "mody",
    email: "some@gmail.com",
    password: "hashed_password",
    role: "user",
    created_at: new Date(),
    updated_at: new Date(),
}

function createService(){
    const userRepo = {
        update: vi.fn(),
        delete: vi.fn(),
        search: vi.fn(),
        getByEmail: vi.fn(),
        getById: vi.fn(),
        getAll: vi.fn(),
        create: vi.fn(),
    } satisfies {
        [method in keyof UserRepository]:
            UserRepository[method];
    };
    const refreshTokenRepo = {
        getByUserId: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        getByToken: vi.fn(),
        getById: vi.fn(),
        getAll: vi.fn(),
        delete: vi.fn()
    } satisfies {
        [method in keyof RefreshTokenRepository]:
            RefreshTokenRepository[method];
    };
    const service = new AuthService(userRepo, refreshTokenRepo, undefined, fakeDb);
    return {userRepo, refreshTokenRepo, service};
}

describe("Auth service tests", () => {
    const {userRepo, refreshTokenRepo, service} = createService();
    describe("Create dashboard user", () => {
        // Since functions: create_dashboard_user, create_Admin & sign_up are all almost the same, I will only one of
        // them
        test("Successful creation of user", async () => {
            userRepo.getByEmail.mockResolvedValue(null);
            userRepo.create.mockResolvedValue(userRow);

            const input = {
                username: "mody",
                email: "some@gmail.com",
                password: "Strong_password2004" 
            };
            const result = await service.create_dashboard_user(input, "user");

            expect(result.status_code).toBe(201);
            expect(result.data?.email).toBe(input.email);
            expect(result.data?.role).toBe("user");
        });

        test("User already created", async () => {
            userRepo.getByEmail.mockResolvedValue(userRow);
            userRepo.create.mockResolvedValue(userRow);

            const input = {
                username: "mody",
                email: "some@gmail.com",
                password: "Strong_password2004" 
            };
            await expect(service.create_dashboard_user(input, "user")).rejects.toThrow(ValidationError);
        });

        test("Password does not meet requirements", async () => {
            userRepo.getByEmail.mockResolvedValue(userRow);
            userRepo.create.mockResolvedValue(userRow);

            const input = {
                username: "mody",
                email: "some@gmail.com",
                password: "weakPassword" 
            };
            await expect(service.create_dashboard_user(input, "user")).rejects.toThrow(ValidationError);
        });
    })

    describe("Sign in tests", () => {
        test("Successful sign in", async () => {
            userRepo.getByEmail.mockResolvedValue({
                ...userRow,
                password: hash_password(userRow.password)
            });

            const result = await service.sign_in(userRow.email, userRow.password);

            expect(result.status_code).toBe(200);
            expect(result.data?.access_token).not.toBe(null);
            expect(result.data?.refresh_token).not.toBe(null);
        });

        test("User not found", async () => {
            userRepo.getByEmail.mockResolvedValue(null);

            await expect(service.sign_in(userRow.email, userRow.password)).rejects.toThrow(NotFoundError);
        });

        test("Invalid Password", async () => {
            userRepo.getByEmail.mockResolvedValue({
                ...userRow,
                password: hash_password(userRow.password)
            });

            await expect(service.sign_in(userRow.email, "not THE same password")).rejects.toThrow(ValidationError);
        });
    });

    describe("Sign out tests", () => {
        test("Successful sign out", async () => {
            refreshTokenRepo.getByToken.mockResolvedValue(tokenRow);

            const result = await service.sign_out("the token");

            expect(result.status_code).toBe(200);
        });

        test("token not found", async () => {
            refreshTokenRepo.getByToken.mockResolvedValue(null);

            await expect(service.sign_out("wrong token")).rejects.toThrow(NotFoundError);
        })
    });

    describe("Sign in with refresh token", () => {
        test("Successful sign in", async () => {
            refreshTokenRepo.getByToken.mockResolvedValue(tokenRow);
            userRepo.getById.mockResolvedValue({
                ...userRow,
                password: hash_password(userRow.password)
            });


            const result = await service.sign_in_with_refresh_token("correct token");

            expect(result.status_code).toBe(200);
            expect(result.data?.access_token).not.toBe(null);
            expect(result.data?.refresh_token).not.toBe(null);
        });

        test("Token not found", async () => {
            refreshTokenRepo.getByToken.mockResolvedValue(null);

            await expect(service.sign_in_with_refresh_token("wrong token")).rejects.toThrow(NotFoundError);
        });

        test("Token is expired", async () => {
            refreshTokenRepo.getByToken.mockResolvedValue({
                ...tokenRow,
                expires_at: new Date(new Date().getTime() - 2000)
            });
            userRepo.getById.mockResolvedValue({
                ...userRow,
                password: hash_password(userRow.password)
            });

            await expect(service.sign_in_with_refresh_token("expired token")).rejects.toThrow(ValidationError);
        });

        test("User somehow not found", async () => {
            refreshTokenRepo.getByToken.mockResolvedValue(tokenRow);
            userRepo.getById.mockResolvedValue(null);

            await expect(service.sign_in_with_refresh_token("user not found?")).rejects.toThrow(NotFoundError);
        })
    })
})