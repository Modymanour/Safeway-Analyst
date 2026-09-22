import { afterAll, beforeAll, beforeEach, describe, expect, test } from "vitest";
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

    const module = await import("../src/repositories/user.repository.ts");
    repository = new module.UserRepository();

    execSync("npm run db:migrate", {
        stdio: "inherit",
        env: process.env,
    });
}, 120000);

afterAll(async () => {
    await pool.end();
    await container.stop();
}, 120000);

describe("Dashboard User Repository tests", () => {
    beforeEach(async () => {
        const client = await pool.connect();
        await client.query("DELETE FROM users");
        client.release();
    });

    test("should create a new user record", async () => {
        const client = await pool.connect();

        const input = {
            username: "testuser",
            email: "test@gmail.com",
            password: "testpassword",
            role: "admin",
        }
        const result = await repository.create(client, input);
        expect(result).toHaveProperty("id");
        expect(result.username).toBe(input.username);
        expect(result.email).toBe(input.email);
        expect(result.password).toBe(input.password);
        expect(result.role).toBe(input.role);

        client.release();
    })

    test("should update an existing user record", async () => {
        const client = await pool.connect();

        const result = await createUser(client, 1).then((data) => data[0]);
        const updatedInput = {
            username: "updateduser",
            email: "updated@email,com",
            password: "updatedpassword",
            role: "user",
        }
        const updatedResult = await repository.update(client, result.id, updatedInput);
        expect(updatedResult).not.toBeNull();
        expect(updatedResult!.username).toBe(updatedInput.username);
        expect(updatedResult!.email).toBe(updatedInput.email);
        expect(updatedResult!.password).toBe(updatedInput.password);
        expect(updatedResult!.role).toBe(updatedInput.role);

        client.release();
    })

    test("should delete an existing user record", async () => {
        const client = await pool.connect();

        const result = await createUser(client, 1).then((data) => data[0]);
        await repository.delete(client, result.id);
        const deletedResult = await repository.getById(client, result.id);
        expect(deletedResult).toBeNull();

        client.release();
    })

    test("should search for user records with filters", async () => {
        const client = await pool.connect();

        await createUser(client, 5);
        const filters = {
            username: "testuser1",
            email: "test1@gamil.com",
            role: "admin",
        }
        const searchResult = await repository.search(client, filters, 1, 10);
        expect(searchResult).toHaveProperty("total");
        expect(searchResult.data.length).toBe(0);

        client.release();
    })
})

const createUser = async (db: Queryable, counter: number) => {
    const data = []
    for (let i = 0; i < counter; i++) {
        const input = {
            username: `testuser${i}`,
            email: `test${i}@gmail.com`,
            password: `testpassword${i}`,
            role: "admin",
        };
        data.push(await repository.create(db, input));
    }
    return data;
}