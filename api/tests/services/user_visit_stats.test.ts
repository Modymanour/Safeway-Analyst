import { describe, expect, test, vi } from "vitest";
import { UserVisitStatsRow, UserVisitsStatsRepository } from "../../src/repositories/user_visits_stats.repository.ts";
import { UserStatsService } from "../../src/services/user_visits_stats.service.ts";
import { Queryable } from "../../src/db/pool.ts";
import { NotFoundError, ValidationError } from "../../src/lib/errors/errors.ts";

const userVisitRow: UserVisitStatsRow = {
    id: "11111111-1111-1111-1111-111111111111",
    email_click: true,
    whatsapp_click: false,
    phone_click: true,
    time_on_page: 120,
    device_type: "mobile",
    traffic_source: "organic",
    location: "New York",
    created_at: new Date(),
};

const createRepositoryMock = () => ({
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getById: vi.fn(),
    search: vi.fn(),
    getAll: vi.fn(),
}) satisfies {
    [method in keyof UserVisitsStatsRepository]:
        UserVisitsStatsRepository[method];
};

describe("User stats service unit tests", () => {
    const repository = createRepositoryMock();

    test("create user stat successfully", async () => {
        repository.create.mockResolvedValue(userVisitRow);

        const fakeDb: Queryable = {
            query: vi.fn()
        };

        const service = new UserStatsService(repository, fakeDb);

        const result = await service.create(userVisitRow);
        
        expect(result.status_code).toBe(201);
        expect(result.data).toEqual(userVisitRow)
    })

    test("throws error when repository can't create row", async () => {
        repository.create.mockResolvedValue(null);

        const service = new UserStatsService(repository, {
           
            query: vi.fn()
        });

        await expect(service.create(userVisitRow)).rejects.toThrow(ValidationError);
    })

    test("Updates user stat Successfully", async () => {
        repository.getById.mockResolvedValue(userVisitRow);
        repository.update.mockResolvedValue(userVisitRow);

        const service = new UserStatsService(repository, {
            query: vi.fn()
        });

        const updateData = {
            email_click: userVisitRow.email_click,
            whatsapp_click: userVisitRow.whatsapp_click,
            phone_click: userVisitRow.phone_click,
            time_on_page: userVisitRow.time_on_page,
            device_type: userVisitRow.device_type,
            traffic_source: userVisitRow.traffic_source,
            location: userVisitRow.location
        }

        const result = await service.update(userVisitRow.id, updateData);

        expect(result.status_code).toBe(200);
        expect(result.data).toEqual(userVisitRow);
    })

    test("throw error when repository can't update non-existent row", async () =>{
        repository.getById.mockResolvedValue(null);

        const service = new UserStatsService(repository, {
            query: vi.fn()
        });

        await expect(service.update(userVisitRow.id, {
            email_click: userVisitRow.email_click,
            whatsapp_click: userVisitRow.whatsapp_click,
            phone_click: userVisitRow.phone_click,
            time_on_page: userVisitRow.time_on_page,
            device_type: userVisitRow.device_type,
            traffic_source: userVisitRow.traffic_source,
            location: userVisitRow.location
        })).rejects.toThrow(NotFoundError);
    });

    test("throw error when repository can't update row", async () =>{
        repository.getById.mockResolvedValue(userVisitRow);
        repository.update.mockResolvedValue(null);

        const service = new UserStatsService(repository, {
            query: vi.fn()
        });

        await expect(service.update(userVisitRow.id, {
            email_click: userVisitRow.email_click,
            whatsapp_click: userVisitRow.whatsapp_click,
            phone_click: userVisitRow.phone_click,
            time_on_page: userVisitRow.time_on_page,
            device_type: userVisitRow.device_type,
            traffic_source: userVisitRow.traffic_source,
            location: userVisitRow.location
        })).rejects.toThrow(ValidationError);
    })

    test("Get by id data successful", async () => {
        repository.getById.mockResolvedValue(userVisitRow);

        const service = new UserStatsService(repository, {
            query: vi.fn()
        });
        
        const data = await service.getById(userVisitRow.id);
        expect(data.status_code).toBe(200);
        expect(data.data).toEqual(userVisitRow);
    });

    test("throw error when repository can't find row by id", async () => {
        repository.getById.mockResolvedValue(null);

        const service = new UserStatsService(repository, {
            query: vi.fn()
        });

        await expect(service.getById(userVisitRow.id)).rejects.toThrow(NotFoundError)
    });
})