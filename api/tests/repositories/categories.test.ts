import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { pool } from "../setup.ts";
import { CategoriesRepository } from "../../src/repositories/categories.repository.ts";

const repository = new CategoriesRepository();
let client: PoolClient;

const createCategory = (suffix: string) => ({
    slug: `repo-test-${suffix}-${randomUUID()}`,
    name: `Repository Test ${suffix}`,
    color: "#123ABC",
    description: `Category for ${suffix} tests`,
});

describe("Categories Repository tests", () => {
    beforeEach(async () => {
        client = await pool.connect();
        await client.query("BEGIN");
    });

    afterEach(async () => {
        await client.query("ROLLBACK");
        client.release();
    });

    test("should create and retrieve a category", async () => {
        const input = createCategory("create");
        const created = await repository.create(client, input);

        expect(created).toMatchObject(input);
        expect(created.id).toBeDefined();
        expect(created.created_at).toBeInstanceOf(Date);
        expect(created.updated_at).toBeInstanceOf(Date);
        await expect(repository.getById(client, created.id)).resolves.toMatchObject(created);
        await expect(repository.getByName(client, input.name)).resolves.toMatchObject(created);
    });

    test("should update an existing category and return null when missing", async () => {
        const created = await repository.create(client, createCategory("update"));
        const updated = await repository.update(client, created.id, {
            name: "Updated repository category",
            color: "#ABCDEF",
        });

        expect(updated).toMatchObject({
            id: created.id,
            name: "Updated repository category",
            color: "#ABCDEF",
        });
        await expect(repository.update(client, randomUUID(), { name: "Missing" })).resolves.toBeNull();
    });

    test("should delete a category", async () => {
        const created = await repository.create(client, createCategory("delete"));
        await repository.delete(client, created.id);
        await expect(repository.getById(client, created.id)).resolves.toBeNull();
    });

    test("should search categories by partial filters and paginate", async () => {
        const slugPrefix = `repo-search-${randomUUID()}`;
        const categories = await Promise.all([1, 2, 3].map((n) => repository.create(client, {
            slug: `${slugPrefix}-${n}`,
            name: `Searchable category ${n}`,
            color: "#00AA11",
            description: "Issue tracking category",
        })));

        const result = await repository.search(client, {
            slug: slugPrefix,
            description: "tracking",
            page: 2,
            pageSize: 1,
        });

        expect(result.total).toBe(3);
        expect(result.page).toBe(2);
        expect(result.pageSize).toBe(1);
        expect(result.totalPages).toBe(3);
        expect(result.data).toHaveLength(1);
        expect(categories.map(({ id }) => id)).toContain(result.data[0].id);
    });
});
