import { afterAll, beforeAll } from "vitest";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { execSync } from "node:child_process";
import { Pool, types } from "pg";

let container: StartedPostgreSqlContainer;
export let pool: Pool;

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

    execSync("npm run db:migrate", {
        stdio: "inherit",
        env: process.env,
    });
}, 120000);

afterAll(async () => {
    if (pool) {
        await pool.end();
    }
    if (container) {
        await container.stop();
    }
}, 120000);
