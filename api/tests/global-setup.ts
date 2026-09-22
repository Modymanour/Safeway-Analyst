import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { execSync } from "node:child_process";

export default async function globalSetup({ provide }: { provide: (key: string, value: string) => void }) {
    const container: StartedPostgreSqlContainer = await new PostgreSqlContainer("postgres:17")
        .withDatabase("testDb")
        .withUsername("postgres")
        .withPassword("postgres")
        .start();

    const connectionString = container.getConnectionUri();
    provide("testDatabaseUrl", connectionString);

    execSync("npm run db:migrate", {
        stdio: "inherit",
        env: {
            ...process.env,
            POSTGRESQL_CONNECTION_STRING: connectionString,
        },
    });

    return async () => {
        await container.stop();
    };
}
