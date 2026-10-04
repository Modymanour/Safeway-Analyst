import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { Queryable } from "../../src/db/pool.ts";
import { Response, Request } from "express";
import { UserVisitController } from "../../src/controllers/uservisit.controller.ts";
import { UserStatsService } from "../../src/services/user_visits_stats.service.ts";
import { ValidationError } from "../../src/lib/errors/errors.ts";
import { DashboardService } from "../../src/services/dashboard.service.ts";
import { DashboardController } from "../../src/controllers/dashboard.controller.ts";

const fakeDb: Queryable = { query: vi.fn() };

const createDashboardService = () => ({
    getCurrentMonthData: vi.fn(),
    getCurrentYearData: vi.fn(),
    getCustomMonthData: vi.fn(),
    getCustomMonthRangeData: vi.fn(),
    getSpecificMonthsData: vi.fn(),
    delete: vi.fn(),
    getUsers: vi.fn(),
    searchUsers: vi.fn()
}) satisfies {
    [method in keyof DashboardService]:
        DashboardService[method]
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

describe("Dashboard Controller", () => {
    let service = createDashboardService();
    let controller: DashboardController;

    beforeEach(() => {
        vi.clearAllMocks();

        controller = new DashboardController(service as any);
    })

    // There exists 2 functions in dashboard service (get_current_(year or month)_data) which do not need input
    // Since they don't need input, testing for zod error is meaningless
    // Furthermore, there are no validation error that could be thrown inside the services since they just return dashboard data
    // So both of them only have on test currently checking whether they return the response correctly or not
    describe("Controller get_current_year_data function", async () => {
        test("Returns get_current_year_Data successfully", async () =>{
            service.getCurrentYearData.mockResolvedValue(mockHttpResult(200, "Successful"));
    
            const req = mockRequest({
                method: "POST",
                originalUrl: "/api/user-visits",
            });
    
            const res = mockResponse();
                
            const controller = new DashboardController(service as any);
            await controller.getCurrentYearData(req, res);
    
            expect(service.getCurrentYearData).toHaveBeenCalledOnce();
    
            assertSuccess(res, 200);
        });
    });

    describe("Controller get_current_month_data function", async () => {
        test("Return get_current_month_data successfully", async () => {
            service.getCurrentMonthData.mockResolvedValue(mockHttpResult(200, "Successful"));
    
            const req = mockRequest({
                method: "POST",
                originalUrl: "/api/user-visits",
            });
    
            const res = mockResponse();
                
            const controller = new DashboardController(service as any);
            await controller.getCurrentMonthData(req, res);
    
            expect(service.getCurrentMonthData).toHaveBeenCalledOnce();
    
            assertSuccess(res, 200);
        });
    });

    describe("Controller get_custom_month_data function", async () => {
        test("Return get_custom_month_data successfully", async () => {
            service.getCustomMonthData.mockResolvedValue(mockHttpResult(200, "Successful"));
    
            const req = mockRequest({
                method: "POST",
                originalUrl: "/api/user-visits",
                query: {
                    year: 20,
                    month_number: 10
                }
            });
    
            const res = mockResponse();
                
            const controller = new DashboardController(service as any);
            await controller.getCustomMonthData(req, res);
    
            expect(service.getCustomMonthData).toHaveBeenCalledOnce();
    
            assertSuccess(res, 200);
        });

        test("Throws error because of missing year or month_number", async () => {
            service.getCustomMonthData.mockResolvedValue(mockHttpResult(200, "Successful"));
    
            const req = mockRequest({
                method: "POST",
                originalUrl: "/api/user-visits",
                query: {// Missing year var
                    month_number: 10
                }
            });
    
            const res = mockResponse();
                
            const controller = new DashboardController(service as any);
            await controller.getCustomMonthData(req, res);
    
            assertError(res, 400, "Validation error");
        });
    });

    describe("Controller get_custom_month_range_data function", async () => {
        test("Return get_custom_month_range_data successfully", async () => {
            service.getCustomMonthRangeData.mockResolvedValue(mockHttpResult(200, "Successful"));
    
            const req = mockRequest({
                method: "POST",
                originalUrl: "/api/user-visits",
                query: {
                    start_year: 20,
                    start_month: 10,
                    end_year: 10,
                    end_month: 10
                }
            });
    
            const res = mockResponse();
                
            const controller = new DashboardController(service as any);
            await controller.getCustomMonthRangeData(req, res);
    
            expect(service.getCustomMonthRangeData).toHaveBeenCalledOnce();
    
            assertSuccess(res, 200);
        });

        test("Throws error because of year or month data", async () => {
            service.getCustomMonthRangeData.mockResolvedValue(mockHttpResult(200, "Successful"));
    
            const req = mockRequest({
                method: "POST",
                originalUrl: "/api/user-visits",
                query: {// Missing variables
                }
            });
    
            const res = mockResponse();
                
            const controller = new DashboardController(service as any);
            await controller.getCustomMonthRangeData(req, res);
    
            assertError(res, 400, "Validation error");
        });
    });

    describe("Controller get_specific_months_data function", async () => {
        test("Return get_specific_months_data successfully", async () => {
            service.getSpecificMonthsData.mockResolvedValue(mockHttpResult(200, "Successful"));
    
            const req = mockRequest({
                method: "POST",
                originalUrl: "/api/user-visits",
                query: {
                    months: JSON.stringify([
                        {
                            year: 2026,
                            month_number: 9
                        },
                        {
                            year: 2026,
                            month_number: 10
                        }
                    ])
                }
            });
    
            const res = mockResponse();
                
            const controller = new DashboardController(service as any);
            await controller.getSpecificMonthsData(req, res);
    
            expect(service.getSpecificMonthsData).toHaveBeenCalledOnce();
    
            assertSuccess(res, 200);
        });

        test("Throws error because of year or month data", async () => {
            service.getSpecificMonthsData.mockResolvedValue(mockHttpResult(200, "Successful"));
    
            const req = mockRequest({
                method: "POST",
                originalUrl: "/api/user-visits",
                query: {// Missing variables
                    months: JSON.stringify([
                        {
                            year: 2026,// missing month_number
                        },
                        {
                            year: 2026,
                            month_number: 10
                        }
                    ])
                }
            });
    
            const res = mockResponse();
                
            const controller = new DashboardController(service as any);
            await controller.getSpecificMonthsData(req, res);
    
            assertError(res, 400, "Schema error");
        });
    });

    describe("Controller search_users function", async () => {
        test("Return search_users successfully", async () => {
            service.searchUsers.mockResolvedValue(mockHttpResult(200, "Successful"));
    
            const req = mockRequest({
                method: "POST",
                originalUrl: "/api/user-visits",
                query: {
                    username: "",//making email null to test nullability
                    role: "",
                    email: null,
                    page: 1,
                    pageNumber: 10,
                }
            });
    
            const res = mockResponse();
                
            const controller = new DashboardController(service as any);
            await controller.searchUsers(req, res);
    
            expect(service.searchUsers).toHaveBeenCalledOnce();
    
            assertSuccess(res, 200);
        });

        test("Throws error because of search users invalid data", async () => {
            service.searchUsers.mockResolvedValue(mockHttpResult(200, "Successful"));
    
            const req = mockRequest({
                method: "POST",
                originalUrl: "/api/user-visits",
                query: {// Missing variables
                }
            });
    
            const res = mockResponse();
                
            const controller = new DashboardController(service as any);
            await controller.searchUsers(req, res);
    
            assertError(res, 400, "Schema error");
        });
    });

    describe("Controller get_users function", async () => {
        test("Return get_users successfully", async () => {
            service.getUsers.mockResolvedValue(mockHttpResult(200, "Successful"));
    
            const req = mockRequest({
                method: "POST",
                originalUrl: "/api/user-visits",
                query: {
                    page: 1,
                    pageNumber: 10,
                }
            });
    
            const res = mockResponse();
                
            const controller = new DashboardController(service as any);
            await controller.getUsers(req, res);
    
            expect(service.getUsers).toHaveBeenCalledOnce();
    
            assertSuccess(res, 200);
        });
    });

    describe("Deleting a user", () => {
        test("User deleting their own account", async () =>{
            service.delete.mockResolvedValue(mockHttpResult(200, "success"));
            const req = mockRequest({
                method: "POST",
                originalUrl: "/api/user-visits",
                query: {
                    user_id: "userid",
                },
                user: {
                    role: "user",
                    sub: "sub"
                }
            });

            const res = mockResponse();
                
            const controller = new DashboardController(service as any);
            await controller.delete(req, res);

            expect(service.delete).toHaveBeenCalledWith("sub");
        });

        test("Admin deleting another user", async () => {
            service.delete.mockResolvedValue(mockHttpResult(200, "success"));
            const req = mockRequest({
                method: "POST",
                originalUrl: "/api/user-visits",
                query: {
                    user_id: "userid",
                },
                user: {
                    role: "admin",
                    sub: "sub"
                }
            });

            const res = mockResponse();
                
            const controller = new DashboardController(service as any);
            await controller.delete(req, res);

            expect(service.delete).toHaveBeenCalledWith("userid");
        });

        test("Admin deleting their own account", async () => {
            service.delete.mockResolvedValue(mockHttpResult(200, "success"));
            const req = mockRequest({
                method: "POST",
                originalUrl: "/api/user-visits",
                query: {
                },
                user: {
                    role: "admin",
                    sub: "sub"
                }
            });

            const res = mockResponse();
                
            const controller = new DashboardController(service as any);
            await controller.delete(req, res);

            expect(service.delete).toHaveBeenCalledWith("sub");
        })
    })
});