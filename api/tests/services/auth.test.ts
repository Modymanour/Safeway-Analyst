import { beforeEach, describe, expect, test, vi } from "vitest";
import type { Queryable } from "../../src/db/pool.ts";
import { UserRepository, type UserRow } from "../../src/repositories/user.repository.ts";
import { RefreshTokenRepository, RefreshTokenRow } from "../../src/repositories/refresh_token.repository.ts";
import { PasswordTokenRepository } from "../../src/repositories/password_token.repository.ts";
import { VerificationTokenRepository } from "../../src/repositories/verification_token.repository.ts";
import { send_password_reset_email, send_verification_email } from "../../src/lib/email.helper.ts";
import { hash_password } from "../../src/lib/hash.ts";
import { AuthService } from "../../src/services/auth.service.ts";
import { NotFoundError, ValidationError } from "../../src/lib/errors/errors.ts";

vi.mock("../../src/lib/email.helper.ts", () => ({
    send_verification_email: vi.fn().mockResolvedValue(undefined),
    send_password_reset_email: vi.fn().mockResolvedValue(undefined),
}));

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
        getByEmailAnyVerificationState: vi.fn(),
        getByEmailNonVerified: vi.fn(),
        getByIdNonVerified: vi.fn(),
        verify_user: vi.fn(),
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
        delete: vi.fn(),
        update_with_user_id: vi.fn()
    } satisfies {
        [method in keyof RefreshTokenRepository]:
            RefreshTokenRepository[method];
    };
    const verificationTokenRepo = {
        create: vi.fn(),
        getByUserId: vi.fn(),
        getByUserIdAndToken: vi.fn(),
        delete: vi.fn(),
        deleteByUserId: vi.fn(),
    };
    const passwordTokenRepo = {
        create: vi.fn(),
        getByUserId: vi.fn(),
        getByUserIdAndToken: vi.fn(),
        delete: vi.fn(),
        deleteByUserId: vi.fn(),
    };
    const service = new AuthService(
        userRepo,
        refreshTokenRepo,
        passwordTokenRepo as unknown as PasswordTokenRepository,
        verificationTokenRepo as unknown as VerificationTokenRepository,
        fakeDb
    );
    return {userRepo, refreshTokenRepo, passwordTokenRepo, verificationTokenRepo, service};
}

describe("Auth service tests", () => {
    const {userRepo, refreshTokenRepo, service} = createService();
    describe("Create dashboard user", () => {
        // The admin and regular-user creation paths share create_dashboard_user.
        test("Successful creation of user", async () => {
            userRepo.getByEmailAnyVerificationState.mockResolvedValue(null);
            userRepo.create.mockResolvedValue(userRow);

            const input = {
                username: "mody",
                email: "some@gmail.com",
                password: "Strong_password2004" 
            };
            const result = await service.create_dashboard_user(input, "user");

            expect(result.status_code).toBe(201);
            expect(result.data).toBeNull();
            expect(send_verification_email).toHaveBeenCalledWith(input.email, userRow.username, expect.any(String));
        });

        test("User already created", async () => {
            userRepo.getByEmailAnyVerificationState.mockResolvedValue(userRow);
            userRepo.create.mockResolvedValue(userRow);

            const input = {
                username: "mody",
                email: "some@gmail.com",
                password: "Strong_password2004" 
            };
            await expect(service.create_dashboard_user(input, "user")).rejects.toThrow(ValidationError);
        });

        test("Password does not meet requirements", async () => {
            userRepo.getByEmailAnyVerificationState.mockResolvedValue(userRow);
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
            userRepo.getByEmailNonVerified.mockResolvedValue(null);

            await expect(service.sign_in(userRow.email, userRow.password)).rejects.toThrow(NotFoundError);
        });

        test("tells a pending user to verify their account", async () => {
            userRepo.getByEmail.mockResolvedValue(null);
            userRepo.getByEmailNonVerified.mockResolvedValue({
                ...userRow,
                password: hash_password("Strong_password2004"),
            });

            await expect(service.sign_in(userRow.email, "Strong_password2004"))
                .rejects.toThrow("Account is not verified");
        });

        test("does not disclose pending accounts when the password is wrong", async () => {
            userRepo.getByEmail.mockResolvedValue(null);
            userRepo.getByEmailNonVerified.mockResolvedValue({
                ...userRow,
                password: hash_password("Strong_password2004"),
            });

            await expect(service.sign_in(userRow.email, "wrong-password"))
                .rejects.toThrow("Invalid email or password");
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

    describe("Verification token tests", () => {
        let tokenService: AuthService;
        let tokenUsers: ReturnType<typeof createService>["userRepo"];
        let verificationTokens: ReturnType<typeof createService>["verificationTokenRepo"];

        beforeEach(() => {
            vi.clearAllMocks();
            const mocks = createService();
            tokenService = mocks.service;
            tokenUsers = mocks.userRepo;
            verificationTokens = mocks.verificationTokenRepo;
        });

        test("sends an OTP when an unverified account requests one", async () => {
            tokenUsers.getByEmailNonVerified.mockResolvedValue(userRow);
            const result = await tokenService.create_verification_token(" SOME@gmail.com ");

            expect(result.status_code).toBe(201);
            expect(tokenUsers.getByEmailNonVerified).toHaveBeenCalledWith(fakeDb, userRow.email);
            expect(verificationTokens.deleteByUserId).toHaveBeenCalledWith(fakeDb, userRow.id);
            expect(verificationTokens.create).toHaveBeenCalledWith(fakeDb, expect.objectContaining({
                user_id: userRow.id,
                token: expect.stringMatching(/^\d{6}$/),
                expires_at: expect.any(Date),
            }));
            expect(send_verification_email).toHaveBeenCalledWith(userRow.email, userRow.username, expect.any(String));
        });

        test("rejects a verification request when the account is not pending verification", async () => {
            tokenUsers.getByEmailNonVerified.mockResolvedValue(null);

            await expect(tokenService.create_verification_token(userRow.email)).rejects.toThrow(ValidationError);
            expect(verificationTokens.create).not.toHaveBeenCalled();
        });

        test("verifies the matching user and consumes their OTP", async () => {
            const otpRow = {
                id: "22222222-2222-2222-2222-222222222222",
                user_id: userRow.id,
                token: "123456",
                expires_at: new Date(Date.now() + 60_000),
            };
            tokenUsers.getByEmailNonVerified.mockResolvedValue(userRow);
            verificationTokens.getByUserIdAndToken.mockResolvedValue(otpRow);
            tokenUsers.verify_user.mockResolvedValue(userRow);

            const result = await tokenService.confirm_verification_token(userRow.email, "123456");

            expect(result.status_code).toBe(200);
            expect(result.data).toBeNull();
            expect(tokenUsers.verify_user).toHaveBeenCalledWith(fakeDb, userRow.id);
            expect(verificationTokens.delete).toHaveBeenCalledWith(fakeDb, otpRow.id);
        });

        test("rejects and removes an expired verification OTP", async () => {
            tokenUsers.getByEmailNonVerified.mockResolvedValue(userRow);
            verificationTokens.getByUserIdAndToken.mockResolvedValue({
                id: "22222222-2222-2222-2222-222222222222",
            user_id: userRow.id,
                token: "123456",
                expires_at: new Date(Date.now() - 60_000),
            });

            await expect(tokenService.confirm_verification_token(userRow.email, "123456")).rejects.toThrow(ValidationError);
            expect(tokenUsers.verify_user).not.toHaveBeenCalled();
            expect(verificationTokens.delete).toHaveBeenCalledOnce();
        });
    });

    describe("Password reset token tests", () => {
        let tokenService: AuthService;
        let tokenUsers: ReturnType<typeof createService>["userRepo"];
        let passwordTokens: ReturnType<typeof createService>["passwordTokenRepo"];

        beforeEach(() => {
            vi.clearAllMocks();
            const mocks = createService();
            tokenService = mocks.service;
            tokenUsers = mocks.userRepo;
            passwordTokens = mocks.passwordTokenRepo;
        });

        test("sends a reset OTP for a known account", async () => {
            tokenUsers.getByEmail.mockResolvedValue(userRow);
            const result = await tokenService.create_password_token(` ${userRow.email.toUpperCase()} `);

            expect(result.status_code).toBe(200);
            expect(passwordTokens.deleteByUserId).toHaveBeenCalledWith(fakeDb, userRow.id);
            expect(passwordTokens.create).toHaveBeenCalledWith(fakeDb, expect.objectContaining({
                user_id: userRow.id,
                token: expect.stringMatching(/^\d{6}$/),
                expires_at: expect.any(Date),
            }));
            expect(send_password_reset_email).toHaveBeenCalledWith(userRow.email, userRow.username, expect.any(String));
        });

        test("returns the same response for an unknown account without sending mail", async () => {
            tokenUsers.getByEmail.mockResolvedValue(null);

            const result = await tokenService.create_password_token("missing@example.com");

            expect(result.status_code).toBe(200);
            expect(passwordTokens.create).not.toHaveBeenCalled();
            expect(send_password_reset_email).not.toHaveBeenCalled();
        });

        test("updates the password and consumes a valid reset OTP", async () => {
            const resetToken = {
                id: "44444444-4444-4444-4444-444444444444",
                user_id: userRow.id,
                token: "123456",
                expires_at: new Date(Date.now() + 60_000),
            };
            tokenUsers.getByEmail.mockResolvedValue(userRow);
            passwordTokens.getByUserIdAndToken.mockResolvedValue(resetToken);
            tokenUsers.update.mockResolvedValue(userRow);

            const result = await tokenService.confirm_password_token(
                userRow.email,
                "123456",
                "NewStrong_password2026"
            );

            expect(result.status_code).toBe(200);
            expect(tokenUsers.update).toHaveBeenCalledWith(fakeDb, userRow.id, {
                password: expect.not.stringMatching(/^NewStrong_password2026$/),
            });
            expect(passwordTokens.delete).toHaveBeenCalledWith(fakeDb, resetToken.id);
        });

        test("rejects an expired reset OTP", async () => {
            passwordTokens.getByUserIdAndToken.mockResolvedValue({
                id: "44444444-4444-4444-4444-444444444444",
                user_id: userRow.id,
                token: "123456",
                expires_at: new Date(Date.now() - 60_000),
            });
            tokenUsers.getByEmail.mockResolvedValue(userRow);

            await expect(tokenService.confirm_password_token(
                userRow.email,
                "123456",
                "NewStrong_password2026"
            )).rejects.toThrow(ValidationError);
            expect(passwordTokens.delete).toHaveBeenCalledOnce();
            expect(tokenUsers.update).not.toHaveBeenCalled();
        });

        test("rejects a weak new password without consuming a valid token", async () => {
            tokenUsers.getByEmail.mockResolvedValue(userRow);
            passwordTokens.getByUserIdAndToken.mockResolvedValue({
                id: "44444444-4444-4444-4444-444444444444",
                user_id: userRow.id,
                token: "123456",
                expires_at: new Date(Date.now() + 60_000),
            });

            await expect(tokenService.confirm_password_token(userRow.email, "123456", "weakpassword"))
                .rejects.toThrow(ValidationError);
            expect(tokenUsers.update).not.toHaveBeenCalled();
            expect(passwordTokens.delete).not.toHaveBeenCalled();
        });
    });
})