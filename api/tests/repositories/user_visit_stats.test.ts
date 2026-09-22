import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { createUserStatsData } from "../tools.ts";
import { pool } from "../setup.ts";
import { PoolClient } from "pg";
import { UserVisitsStatsRepository} from "../../src/repositories/user_visits_stats.repository.ts";

let repository: UserVisitsStatsRepository = new UserVisitsStatsRepository();
let client: PoolClient;

describe("User Visit Stats Repository tests", () => {
    beforeEach(async () => {
        client = await pool.connect();
        await client.query("DELETE FROM user_visits_stats");
    });
    afterEach(async () => {
        client.release();
    })

    test("should create a new user visit stats record", async () => {

        const input = {
            email_click: true,
            whatsapp_click: false,
            phone_click: true,
            time_on_page: 120,
            device_type: "mobile",
            traffic_source: "organic",
            location: "New York",
        };

        const result = await repository.create(client, input);

        expect(result).toMatchObject(input);
        expect(result.id).toBeDefined();
        expect(result.created_at).toBeDefined();
        expect(typeof result.time_on_page).toBe("number");
    });

    test("should return error for unknown traffic source", async () => {

        const input = {
            email_click: true,
            whatsapp_click: false,
            phone_click: true,
            time_on_page: 120,
            device_type: "mobile",
            traffic_source: "random",
            location: "New York",
        };

        const result = await repository.create(client, input).catch((err: Error) => err);
        expect(result).toBeInstanceOf(Error);
    });

    test("should get saved user visit event", async () => {
        const created = await createUserStatsData(client, repository, 1).then((data) => data[0]);
        const fetched = await repository.getById(client, created.id);
        expect(fetched).toMatchObject(created);
    });

    test("should return null for non-existing user visit event", async () => {
        const fetched = await repository.getById(client, "00000000-0000-0000-0000-000000000000");
        expect(fetched).toBeNull();
    });

    test("should update an existing user visit event", async () => {
        const created = await createUserStatsData(client, repository, 1).then((data) => data[0]);
        const updateInput = {
            email_click: false,
            whatsapp_click: true,
            phone_click: false,
            time_on_page: 300,
            device_type: "desktop",
            traffic_source: "referral",
            location: "Los Angeles",
        };

        const updated = await repository.update(client, created.id, updateInput);
        expect(updated).toMatchObject(updateInput);
        expect(updated.id).toBe(created.id);
    });

    test("should delete an existing user visit event", async () => {
        const created = await createUserStatsData(client, repository, 1).then((data) => data[0]);
        await repository.delete(client, created.id);
        const fetched = await repository.getById(client, created.id);
        expect(fetched).toBeNull();
    });

    test("should search user visit events with filters and pagination", async () => {
        await createUserStatsData(client, repository, 10);

        const filters = {
            email_click: true,
            device_type: "mobile",
        };
        const page = 1;
        const pageSize = 5;

        const result = await repository.search(client, filters, page, pageSize);

        expect(result.data.length).toBeLessThanOrEqual(pageSize);
        expect(result.total).toBeGreaterThan(0);
        expect(typeof result.total).toBe("number");
        result.data.forEach((item: any) => {
            expect(item.email_click).toBe(true);
            expect(item.device_type).toBe("mobile");
            expect(typeof item.time_on_page).toBe("number");
        });

        const resultpag = await repository.search(client, filters, 0, 0);
        expect(resultpag.data.length).toBeGreaterThan(5);
    });
});

