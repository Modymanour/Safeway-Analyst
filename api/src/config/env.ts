import { z } from "zod";
import dotenv from "dotenv";
import path from "path";

const envSchema = z.object({
    NODE_ENV: z
        .enum(["development", "test", "production"])
        .default("development"),

    PINO_LOG_LEVEL: z
        .enum(["fatal", "error", "warn", "info", "debug", "trace"])
        .default("info"),

    POSTGRESQL_CONNECTION_STRING: z.string().min(1),

    PORT: z.string(),

    POSTGRES_USER: z.string().min(1),

    POSTGRES_PASSWORD: z.string().min(1),

    POSTGRES_DB: z.string().min(1)
});

const directoryPath = import.meta.dirname
dotenv.config({ path: path.resolve(directoryPath, '.env') });

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    console.error(parsedEnv.error.format());
    throw new Error("Invalid environment configuration");
}

export const env = parsedEnv.data;