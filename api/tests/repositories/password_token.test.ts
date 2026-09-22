import { beforeEach, describe, expect, test } from "vitest";
import { createUser, createPasswordToken } from "../tools.ts";
import { pool } from "../setup.ts";
import { PasswordTokenRepository } from "../../src/repositories/password_token.repository.ts";
import { afterEach } from "node:test";
import { UserRepository } from "../../src/repositories/user.repository.ts";
import { PoolClient } from "pg";

let repository: PasswordTokenRepository;
let userRepository = new UserRepository();
let client: PoolClient;

const module = await import("../../src/repositories/password_token.repository.ts");
repository = new module.PasswordTokenRepository();

describe("Password Token Repository tests", () =>{
    beforeEach(async () => {
        client = await pool.connect();
        await client.query("DELETE FROM users");
    });

    afterEach(async () => {
        client.release();
    })
    test("should create a password token", async () => {
        const user = await createUser(client, userRepository, 1).then((data) => data[0]);
        const input = {
                user_id: user.id,
                token: "testtoken",
                expires_at: new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
            }
            const result = await repository.create(client, input); 
            expect(result).toHaveProperty("id");
            expect(result.user_id).toBe(input.user_id);
            expect(result.token).toBe(input.token);
            expect(result.expires_at.getTime()).toBeCloseTo(input.expires_at.getTime(), -2); // Allow for slight differences in milliseconds
    })
})