import { inject } from "vitest";
import { types } from "pg";

declare module "vitest" {
	export interface ProvidedContext {
		testDatabaseUrl: string;
	}
}

process.env.POSTGRESQL_CONNECTION_STRING = inject("testDatabaseUrl");

const poolModule = await import("../src/db/pool.ts");
export const pool = poolModule.pool;

types.setTypeParser(types.builtins.TIMESTAMPTZ, (value) => new Date(value));
types.setTypeParser(types.builtins.TIMESTAMP, (value) => new Date(value));
