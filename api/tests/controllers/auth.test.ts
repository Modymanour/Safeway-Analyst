import { beforeEach, describe, expect, test, vi } from "vitest";
import { AuthController } from "../../src/controllers/auth.controller.ts";

const createAuthService = () => ({
    create_dashboard_user: vi.fn(),
    sign_up: vi.fn(),
    sign_in: vi.fn(),
    sign_out: vi.fn(),
    change_role: vi.fn(),
    sign_in_with_refresh_token: vi.fn(),
});

const mockHttpResult = (status_code: number, msg: string) => ({
    status: "Success",
    status_code,
    data: { access_token: "access-token", refresh_token: "refresh-token" },
    msg,
    request_id: null,
    url: null,
    time_taken_ms: null,
});

const validRegistration = {
    username: "Alex Morgan",
    email: "alex@example.com",
    password: "Password123$",
};

const mockRequest = (overrides = {}): any => ({
    body: {},
    query: {},
    method: "POST",
    originalUrl: "/api/dashboard/sign-in",
    ...overrides,
});

const mockResponse = () => {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
};

const assertSuccess = (res: ReturnType<typeof mockResponse>, statusCode: number) => {
    expect(res.status).toHaveBeenCalledWith(statusCode);
    expect(res.json).toHaveBeenCalledOnce();
    const responseData = res.json.mock.calls[0][0];
    expect(responseData.url).toBeTypeOf("string");
    expect(responseData.time_taken_ms).toBeTypeOf("number");
};

const assertError = (res: ReturnType<typeof mockResponse>, statusCode: number, error: string) => {
    expect(res.status).toHaveBeenCalledWith(statusCode);
    expect(res.json).toHaveBeenCalledOnce();
    expect(res.json.mock.calls[0][0].error).toBe(error);
};

describe("Auth Controller", () => {
    let service = createAuthService();
    let controller: AuthController;

    beforeEach(() => {
        vi.clearAllMocks();
        service = createAuthService();
        controller = new AuthController(service as any);
    });

    describe("Creating dashboard accounts", () => {
        test.each([
            ["admin", "create_admin", "admin"],
            ["user", "create_user", "user"],
        ] as const)("creates a %s account", async (_label, method, role) => {
            service.create_dashboard_user.mockResolvedValue(mockHttpResult(201, "Created"));
            const req = mockRequest({ body: validRegistration, originalUrl: `/api/dashboard/${method}` });
            const res = mockResponse();

            await controller[method](req, res);

            expect(service.create_dashboard_user).toHaveBeenCalledWith(validRegistration, role);
            assertSuccess(res, 201);
        });

        test("returns a schema error for invalid account data", async () => {
            const req = mockRequest({ body: { email: "invalid" }, originalUrl: "/api/dashboard/create-user" });
            const res = mockResponse();

            await controller.create_user(req, res);

            expect(service.create_dashboard_user).not.toHaveBeenCalled();
            assertError(res, 400, "Schema error");
        });
    });

    test("registers a user", async () => {
        service.sign_up.mockResolvedValue(mockHttpResult(201, "Created"));
        const req = mockRequest({ body: validRegistration, originalUrl: "/api/dashboard/sign-up" });
        const res = mockResponse();

        await controller.sign_up(req, res);

        expect(service.sign_up).toHaveBeenCalledWith(validRegistration);
        assertSuccess(res, 201);
    });

    describe("Signing in", () => {
        test("signs in with email and password", async () => {
            service.sign_in.mockResolvedValue(mockHttpResult(200, "Signed in"));
            const req = mockRequest({
                body: { email: validRegistration.email, password: validRegistration.password },
            });
            const res = mockResponse();

            await controller.sign_in(req, res);

            expect(service.sign_in).toHaveBeenCalledWith(validRegistration.email, validRegistration.password);
            assertSuccess(res, 200);
        });

        test("requires email and password", async () => {
            const req = mockRequest({ body: { email: validRegistration.email } });
            const res = mockResponse();

            await controller.sign_in(req, res);

            expect(service.sign_in).not.toHaveBeenCalled();
            assertError(res, 400, "Validation error");
        });
    });

    describe("Signing out", () => {
        test("signs out with a refresh token", async () => {
            service.sign_out.mockResolvedValue(mockHttpResult(200, "Signed out"));
            const req = mockRequest({ body: { refresh_token: "refresh-token" }, originalUrl: "/api/dashboard/sign-out" });
            const res = mockResponse();

            await controller.sign_out(req, res);

            expect(service.sign_out).toHaveBeenCalledWith({ refresh_token: "refresh-token" });
            assertSuccess(res, 200);
        });

        test("requires a refresh token", async () => {
            const req = mockRequest({ originalUrl: "/api/dashboard/sign-out" });
            const res = mockResponse();

            await controller.sign_out(req, res);

            expect(service.sign_out).not.toHaveBeenCalled();
            assertError(res, 400, "Validation error");
        });
    });

    describe("Changing a role", () => {
        test("changes a user's role", async () => {
            service.change_role.mockResolvedValue(mockHttpResult(200, "Role changed"));
            const req = mockRequest({
                method: "PUT",
                originalUrl: "/api/dashboard/change-role",
                query: { user_id: "11111111-1111-1111-1111-111111111111", role: "admin" },
            });
            const res = mockResponse();

            await controller.change_role(req, res);

            expect(service.change_role).toHaveBeenCalledWith("11111111-1111-1111-1111-111111111111", "admin");
            assertSuccess(res, 200);
        });

        test.each([
            [{ role: "admin" }],
            [{ user_id: "11111111-1111-1111-1111-111111111111", role: "superuser" }],
        ])("rejects missing or invalid role parameters", async (query) => {
            const req = mockRequest({ method: "PUT", query });
            const res = mockResponse();

            await controller.change_role(req, res);

            expect(service.change_role).not.toHaveBeenCalled();
            assertError(res, 400, "Validation error");
        });
    });

    describe("Signing in with a refresh token", () => {
        test("returns a fresh token pair", async () => {
            service.sign_in_with_refresh_token.mockResolvedValue(mockHttpResult(200, "Signed in"));
            const req = mockRequest({
                originalUrl: "/api/dashboard/sign-in-with-refresh-token",
                body: { refresh_token: "refresh-token" },
            });
            const res = mockResponse();

            await controller.sign_in_with_refresh_token(req, res);

            expect(service.sign_in_with_refresh_token).toHaveBeenCalledWith("refresh-token");
            assertSuccess(res, 200);
        });

        test("requires a refresh token", async () => {
            const req = mockRequest({ originalUrl: "/api/dashboard/sign-in-with-refresh-token" });
            const res = mockResponse();

            await controller.sign_in_with_refresh_token(req, res);

            expect(service.sign_in_with_refresh_token).not.toHaveBeenCalled();
            assertError(res, 400, "Validation error");
        });
    });
});
