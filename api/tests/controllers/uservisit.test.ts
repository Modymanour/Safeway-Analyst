import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { Queryable } from "../../src/db/pool.ts";
import { Response, Request } from "express";
import { UserVisitController } from "../../src/controllers/uservisit.controller.ts";
import { UserStatsService } from "../../src/services/user_visits_stats.service.ts";
import { ValidationError } from "../../src/lib/errors/errors.ts";

const fakeDb: Queryable = { query: vi.fn() };

const createUserStatsService = () => ({
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getById: vi.fn(),
    search: vi.fn(),
    getAll: vi.fn(),
    getDashboardData: vi.fn(),
}) satisfies {
    [method in keyof UserStatsService]:
        UserStatsService[method]
};

const mockHttpResult = (status_code: number, msg: string) => ({
    status: "Successfull",
    status_code: status_code,
    data: "data",
    msg: msg,
    request_id: null,
    url: null,
    time_taken_ms: null
})

const mockRequest = (overrides = {}): any => ({
    body: {},
    query: {},
    method: "Get",
    originalUrl: "/api/something",
    ...overrides,
});

const mockResponse = () => {
    const res: any = {};

    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);

    return res;
};

const assertSuccess = (res: ReturnType<typeof mockResponse>, status_code: number) => {
    expect(res.status).toHaveBeenCalledWith(status_code);
    expect(res.json).toHaveBeenCalledOnce();

    const responseData = res.json.mock.calls[0][0];

    expect(responseData.url).toBe("/api/user-visits");
    expect(responseData.time_taken_ms).toBeTypeOf("number");
}

const assertError = (res: ReturnType<typeof mockResponse>, status_code: number, error_name:string) => {
    expect(res.status).toHaveBeenCalledWith(status_code);
    expect(res.json).toHaveBeenCalledOnce();
    expect(res.json.mock.calls[0][0].error).toBe(error_name);
}

describe("User visit Controller", () => {
    const service = createUserStatsService();
    let controller: UserVisitController;

    beforeEach(() => {
        vi.clearAllMocks();

        controller = new UserVisitController(service as any);
    })

    describe("Controller create function", () => {

        test("Controller creates successfully and return data", async () => {
            service.create.mockResolvedValue(mockHttpResult(201, "Successful"));
    
            const req = mockRequest({
                method: "POST",
                originalUrl: "/api/user-visits",
                body: {
                    id: "550e8400-e29b-41d4-a716-446655440000",
                    email_click: false,
                    whatsapp_click: true,
                    phone_click: false,
                    time_on_page: 2000,
                    device_type: "mobile",
                    traffic_source: "google",
                    location: "Cairo",
                },
            });
    
            const res = mockResponse();
    
            const controller = new UserVisitController(service as any);
            await controller.create(req, res);
    
            expect(service.create).toHaveBeenCalledOnce();
    
            assertSuccess(res, 201);
        });
    
        test("Controller returns Zod error", async () => {
            service.create.mockResolvedValue(mockHttpResult(201, "Successful"));
            
            const req = mockRequest({
                method: "POST",
                originalUrl: "/api/user-visits",
                body: {
                    id: "550e8400-e29b-41d4-a716-446655440000",// empty email_click will return error
                    whatsapp_click: true,
                    phone_click: false,
                    time_on_page: 2000,
                    device_type: "mobile",
                    traffic_source: "google",
                    location: "Cairo",
                },
            });
    
            const res = mockResponse();
    
            const controller = new UserVisitController(service as any);
            await controller.create(req, res);
    
            assertError(res, 400, "Schema error");
        });
    
        test("Controller returns validation error", async () => {
            service.create.mockThrow(new ValidationError("error"));
            
            const req = mockRequest({
                method: "POST",
                originalUrl: "/api/user-visits",
                body: {
                    id: "550e8400-e29b-41d4-a716-446655440000",
                    email_click: false,
                    whatsapp_click: true,
                    phone_click: false,
                    time_on_page: 2000,
                    device_type: "mobile",
                    traffic_source: "google",
                    location: "Cairo",
                },
            });
    
            const res = mockResponse();
    
            const controller = new UserVisitController(service as any);
            await controller.create(req, res);
    
            assertError(res, 400, "Validation error");
        });
    
        test("Controller returns server error for undefined error", async () => {
            service.create.mockThrow(new Error("error"));
            
            const req = mockRequest({
                method: "POST",
                originalUrl: "/api/user-visits",
                body: {
                    id: "550e8400-e29b-41d4-a716-446655440000",
                    email_click: false,
                    whatsapp_click: true,
                    phone_click: false,
                    time_on_page: 2000,
                    device_type: "mobile",
                    traffic_source: "google",
                    location: "Cairo",
                },
            });
    
            const res = mockResponse();
    
            const controller = new UserVisitController(service as any);
            await controller.create(req, res);
            
            assertError(res, 500, "Internal server error");
        });
    })

    describe("Controller search function", () => {
        test("Controller returns search result successfully", async () => {
            service.search.mockResolvedValue(mockHttpResult(200, "Successful"));

            const req = mockRequest({
                method: "GET",
                originalUrl: "/api/user-visits",
                query: {
                    email_click: "false",// has to be string to simulate real sent req
                    whatsapp_click: "true",
                    phone_click: "false",
                    device_type: "mobile",
                    traffic_source: "google",
                    location: "Cairo",
                    start_date: new Date(),
                    end_date: new Date(),
                    page: 1,
                    pageNumber: 10,
                },
            });

            const res = mockResponse();

            const controller = new UserVisitController(service as any);
            await controller.search(req, res);
    
            expect(service.search).toHaveBeenCalledOnce();
    
            assertSuccess(res, 200);
        });
        
        test("Controller returns Zod error", async () => {
            service.search.mockResolvedValue(mockHttpResult(200, "Successful"));
            
            const req = mockRequest({
                method: "GET",
                originalUrl: "/api/user-visits",
                query: {
                    id: "550e8400-e29b-41d4-a716-446655440000",// Totally wrong schema
                    whatsapp_click: true,
                    phone_click: false,
                    time_on_page: 2000,
                    device_type: "mobile",
                    traffic_source: "google",
                    location: "Cairo",
                },
            });
    
            const res = mockResponse();
    
            const controller = new UserVisitController(service as any);
            await controller.search(req, res);
    
           assertError(res, 400, "Schema error");
        })
    });
    
    describe("Controller getall function", () => {
        test("Controller getsAll successfully", async () => {
            service.getAll.mockResolvedValue(mockHttpResult(200, "Successful"));

            const req = mockRequest({
                method: "GET",
                originalUrl: "/api/user-visits",
                query: {
                    page: 1,
                    pageNumber: 10,
                },
            });

            const res = mockResponse();

            const controller = new UserVisitController(service as any);
            await controller.getAll(req, res);
    
            expect(service.getAll).toHaveBeenCalledOnce();
    
            assertSuccess(res, 200);
        });
    });
})