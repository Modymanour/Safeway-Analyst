import { inject } from "vitest";
import { types } from "pg";
import { resolve } from 'path';
import dotenv from "dotenv";

declare module "vitest" {
	export interface ProvidedContext {
		testDatabaseUrl: string;
	}
}

dotenv.config({
	path: resolve(__dirname, '../.env.test')
});

console.log(resolve(__dirname, '../.env.test'));



process.env.POSTGRESQL_CONNECTION_STRING = inject("testDatabaseUrl");

const poolModule = await import("../src/db/pool.ts");
export const pool = poolModule.pool;

types.setTypeParser(types.builtins.TIMESTAMPTZ, (value) => new Date(value));
types.setTypeParser(types.builtins.TIMESTAMP, (value) => new Date(value));
