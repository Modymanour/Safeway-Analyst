import { afterEach, describe, expect, it, vi } from "vitest";
import type { Queryable } from "../../src/db/pool.ts";
import type { UserVisitsStatsRepository, UserVisitStatsData } from "../../src/repositories/user_visits_stats.repository.ts";
import { ValidationError } from "../../src/lib/errors/errors.ts";
import { DashboardService } from "../../src/services/dashboard.service.ts";

const fakeDb: Queryable = { query: vi.fn() };

function dashboardData(startDate: Date, endDate: Date): UserVisitStatsData {
    return {
        date_start: startDate,
        date_end: endDate,
        summary: {
            total_visits: 3,
            email_clicks: 1,
            whatsapp_clicks: 1,
            phone_clicks: 1,
            total_click_events: 3,
            email_click_rate: 100 / 3,
            whatsapp_click_rate: 100 / 3,
            phone_click_rate: 100 / 3,
            average_time_on_page: 90,
            median_time_on_page: 90,
        },
        daily: [],
        device_type: [{ device_type: "mobile", visits: 3 }],
        traffic_source: [{ traffic_source: "organic", visits: 3 }],
        location: [{ location: "New York", visits: 3 }],
    };
}

function createService() {
    const repository = {
        getDashboardData: vi.fn(async (_db: Queryable, start: Date, end: Date) =>
            dashboardData(start, end),
        ),
    } as unknown as UserVisitsStatsRepository;
    const service = new DashboardService(undefined, repository, fakeDb);
    return { service, repository };
}

afterEach(() => {
    vi.useRealTimers();
});

describe("DashboardService month data flow", () => {
    it("loads and returns all 12 months for the current year", async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2025-06-15T12:00:00.000Z"));
        const { service, repository } = createService();

        const response = await service.getCurrentYearData();

        expect(response.status_code).toBe(200);
        expect(response.data?.months).toHaveLength(12);
        expect(repository.getDashboardData).toHaveBeenCalledTimes(12);
        expect(response.data?.months[0]).toMatchObject({
            month_name: "January",
            month_number: 1,
            start_date: new Date(2025, 0, 1),
            end_date: new Date(2025, 1, 1),
        });
        expect(response.data?.months[11]).toMatchObject({
            month_name: "December",
            month_number: 12,
            start_date: new Date(2025, 11, 1),
            end_date: new Date(2026, 0, 1),
        });
        expect(response.data?.months[5].data.summary.total_visits).toBe(3);
    });

    it("loads every month in an inclusive custom month range", async () => {
        const { service, repository } = createService();

        const response = await service.getCustomMonthRangeData(2025, 1, 2025, 3);

        expect(response.data?.months.map(({ month_name }) => month_name)).toEqual([
            "January",
            "February",
            "March",
        ]);
        expect(repository.getDashboardData).toHaveBeenCalledTimes(3);
        expect(repository.getDashboardData).toHaveBeenNthCalledWith(
            1,
            fakeDb,
            new Date(2025, 0, 1),
            new Date(2025, 1, 1),
        );
        expect(repository.getDashboardData).toHaveBeenNthCalledWith(
            3,
            fakeDb,
            new Date(2025, 2, 1),
            new Date(2025, 3, 1),
        );
    });

    it("loads distinct requested months, including December across a year boundary", async () => {
        const { service, repository } = createService();

        const response = await service.getSpecificMonthsData([
            { year: 2024, month_number: 12 },
            { year: 2025, month_number: 1 },
            { year: 2025, month_number: 4 },
        ]);

        expect(response.data?.months.map(({ month_name, month_number }) => [month_name, month_number])).toEqual([
            ["December", 12],
            ["January", 1],
            ["April", 4],
        ]);
        expect(repository.getDashboardData).toHaveBeenCalledTimes(3);
        expect(repository.getDashboardData).toHaveBeenNthCalledWith(
            1,
            fakeDb,
            new Date(2024, 11, 1),
            new Date(2025, 0, 1),
        );
        expect(repository.getDashboardData).toHaveBeenNthCalledWith(
            2,
            fakeDb,
            new Date(2025, 0, 1),
            new Date(2025, 1, 1),
        );
        expect(response.data?.start_date).toEqual(new Date(2024, 11, 1));
        expect(response.data?.end_date).toEqual(new Date(2025, 4, 1));
    });

    it("rejects invalid custom ranges and invalid requested months", async () => {
        const { service, repository } = createService();

        await expect(service.getCustomMonthRangeData(2025, 4, 2025, 2))
            .rejects.toBeInstanceOf(ValidationError);
        await expect(service.getSpecificMonthsData([
            { year: 2025, month_number: 13 },
        ])).rejects.toBeInstanceOf(ValidationError);
        expect(repository.getDashboardData).not.toHaveBeenCalled();
    });
});
