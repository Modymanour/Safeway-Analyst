import { beforeEach, afterEach, describe, expect, test } from "vitest";
import type { PoolClient } from "pg";
import { createUser, createToken } from "./tools.ts";
import { pool } from "./setup.ts";
import { RefreshTokenRepository } from "../src/repositories/refresh_token.repository.ts";
import { UserRepository } from "../src/repositories/user.repository.ts";

let repository: RefreshTokenRepository;
let userRepo: UserRepository;
let client: PoolClient;

repository = new RefreshTokenRepository();
userRepo = new UserRepository();

describe("Refresh Token Repository tests", () => {
    beforeEach(async () => {
            client = await pool.connect();
            await client.query("DELETE FROM refresh_tokens");
            await client.query("DELETE FROM users");
    });
    afterEach(() => {
        client.release();
    });

    test("should create a new refresh token record", async () => {
        const user = await createUser(client, userRepo, 1).then((data) => data[0]);
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

    test("should update a existing refresh token", async () => {
        const user = await createUser(client, userRepo, 1).then((data) => data[0]);
        const result = await createToken(client, repository, user.id).then((data) => data[0])
        const updateInput = {
            token: `updatedToken`,
            expires_at: new Date(Date.now() + 2000 * 60 * 60), // 2 hour from now
        }
        const updatedResult = await repository.update(client, result.id, updateInput);
        expect(updatedResult).not.toBe(null);
        expect(updatedResult?.token).toBe(updateInput.token)
        expect(updatedResult?.expires_at.getTime()).toBeCloseTo(updateInput.expires_at.getTime(), -2);
    })

    test("should delete an existing refresh token", async () =>{
        const user = await createUser(client, userRepo, 1).then((data) => data[0]);
        const result = await createToken(client, repository, user.id).then((data) => data[0]);

        const deleteResult = await repository.delete(client, result.id);
        expect(deleteResult).toBeUndefined();
    })
})

