import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { execSync } from "node:child_process";
import { Pool, types } from "pg";
import type { Queryable } from "../src/db/pool";

let container: StartedPostgreSqlContainer;
let repository: any;
let pool: Pool;

beforeAll(async () => {
    container = await new PostgreSqlContainer("postgres:17")
        .withDatabase("testDb")
        .withUsername("postgres")
        .withPassword("postgres")
        .start();

    process.env.POSTGRESQL_CONNECTION_STRING = container.getConnectionUri();

    types.setTypeParser(types.builtins.TIMESTAMPTZ, (val) => val === null ? null : new Date(val));
    types.setTypeParser(types.builtins.TIMESTAMP, (val) => val === null ? null : new Date(val));
    types.setTypeParser(types.builtins.INT4, (val) => val === null ? null : parseInt(val, 10));
    types.setTypeParser(types.builtins.INT8, (val) => val === null ? null : parseInt(val, 10));
    types.setTypeParser(types.builtins.FLOAT8, (val) => val === null ? null : parseFloat(val));

    pool = new Pool({
        connectionString: container.getConnectionUri(),
    });

    const module = await import("../src/repositories/user_visits_stats.repository.ts");
    repository = new module.UserVisitsStatsRepository();

    execSync("npm run db:migrate", {
        stdio: "inherit",
        env: process.env,
    });
}, 120000);

afterAll(async () => {
    pool.end();
    await container.stop();
}, 120000);

describe("User Visit Stats Repository tests", () => {
    beforeEach(async () => {
        const client = await pool.connect();
        client.query("DELETE FROM user_visits_stats");
        client.release();
        vi.resetModules();
    });

    it("should create a new user visit stats record", async () => {
        const client = await pool.connect();

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
        client.release();
    });

    it("should return error for unknown traffic source", async () => {
        const client = await pool.connect();

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
        client.release();
    });

    it("should get saved user visit event", async () => {
        const client = await pool.connect();

        const created = await createUserStatsData(client, 1).then((data) => data[0]);
        const fetched = await repository.getById(client, created.id);
        expect(fetched).toMatchObject(created);
        client.release();
    });

    it("should return null for non-existing user visit event", async () => {
        const client = await pool.connect();

        const fetched = await repository.getById(client, "00000000-0000-0000-0000-000000000000");
        expect(fetched).toBeNull();
        client.release();
    });

    it("should update an existing user visit event", async () => {
        const client = await pool.connect();

        const created = await createUserStatsData(client, 1).then((data) => data[0]);
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
        client.release();
    });

    it("should delete an existing user visit event", async () => {
        const client = await pool.connect();

        const created = await createUserStatsData(client, 1).then((data) => data[0]);
        await repository.delete(client, created.id);
        const fetched = await repository.getById(client, created.id);
        expect(fetched).toBeNull();
        client.release();
    });

    it("should search user visit events with filters and pagination", async () => {
        const client = await pool.connect();

        await createUserStatsData(client, 10);

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
        client.release();
    });
});

const createUserStatsData = async (client: Queryable, count: number) => {
    const data = [];
    const input = {
        email_click: true,
        whatsapp_click: false,
        phone_click: true,
        time_on_page: 120,
        device_type: "mobile",
        traffic_source: "organic",
        location: "New York",
    };

    for (let i = 0; i < count; i++) {
        data.push(await repository.create(client, input));
    }

    return data;
};