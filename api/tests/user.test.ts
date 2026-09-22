import { beforeEach, describe, expect, test } from "vitest";
import { createUser } from "./tools.ts";
import { pool } from "./setup.ts";

let repository: any;

const { UserRepository } = await import("../src/repositories/user.repository.ts");
repository = new UserRepository();

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

        const result = await createUser(client, repository, 1).then((data) => data[0]);
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

        const result = await createUser(client, repository, 1).then((data) => data[0]);
        await repository.delete(client, result.id);
        const deletedResult = await repository.getById(client, result.id);
        expect(deletedResult).toBeNull();

        client.release();
    })

    test("should search for user records with filters", async () => {
        const client = await pool.connect();

        await createUser(client, repository, 5);
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

