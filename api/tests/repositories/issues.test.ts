import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { pool } from "../setup.ts";
import { CategoriesRepository } from "../../src/repositories/categories.repository.ts";
import { IssuesRepository, type IssueStatus } from "../../src/repositories/issues.repository.ts";
import { UserRepository } from "../../src/repositories/user.repository.ts";

const repository = new IssuesRepository();
const categories = new CategoriesRepository();
const users = new UserRepository();
let client: PoolClient;

const createIssue = async (suffix: string, status: IssueStatus = "open") => {
    const user = await users.create(client, {
        username: `issue-user-${randomUUID()}`,
        email: `issue-${randomUUID()}@example.com`,
        password: "test-password",
        role: "user",
    });
    const category = await categories.create(client, {
        slug: `issue-test-${randomUUID()}`,
        name: `Issue test ${suffix}`,
        color: "#123ABC",
        description: "Issue repository test category",
    });

    return repository.create(client, {
        title: `Repository issue ${suffix}`,
        description: `Description for ${suffix}`,
        created_by: user.id,
        category_id: category.id,
        status,
        priority: 3,
    });
};

describe("Issues Repository tests", () => {
    beforeEach(async () => {
        client = await pool.connect();
        await client.query("BEGIN");
    });

    afterEach(async () => {
        await client.query("ROLLBACK");
        client.release();
    });

    test("should create and retrieve an issue", async () => {
        const created = await createIssue("create");

        expect(created).toMatchObject({
            title: "Repository issue create",
            status: "open",
            priority: 3,
        });
        expect(created.id).toBeDefined();
        expect(created.created_at).toBeInstanceOf(Date);
        expect(created.updated_at).toBeInstanceOf(Date);
        await expect(repository.getById(client, created.id)).resolves.toMatchObject(created);
        await expect(repository.getById(client, randomUUID())).resolves.toBeNull();
    });

    test("should update an existing issue and return null when missing", async () => {
        const created = await createIssue("update");
        const updated = await repository.update(client, created.id, {
            title: "Updated issue title",
            status: "planned",
            priority: 1,
        });

        expect(updated).toMatchObject({
            id: created.id,
            title: "Updated issue title",
            status: "planned",
            priority: 1,
        });
        await expect(repository.update(client, randomUUID(), { title: "Missing" })).resolves.toBeNull();
    });

    test("should leave the issue unchanged for an empty update", async () => {
        const created = await createIssue("no-op");
        await expect(repository.update(client, created.id, {})).resolves.toMatchObject(created);
    });

    test("should delete an issue", async () => {
        const created = await createIssue("delete");
        await repository.delete(client, created.id);
        await expect(repository.getById(client, created.id)).resolves.toBeNull();
    });

    test("should search issues by filters and paginate", async () => {
        const common = `search-${randomUUID()}`;
        const first = await createIssue(`${common}-first`, "open");
        await createIssue(`${common}-second`, "planned");
        const third = await createIssue(`${common}-third`, "open");

        const result = await repository.search(client, {
            title: common,
            status: "open",
            page: 1,
            pageSize: 1,
        });

        expect(result.total).toBe(2);
        expect(result.data).toHaveLength(1);
        expect(result.data[0].status).toBe("open");
        expect([first.id, third.id]).toContain(result.data[0].id);
        expect(result.pageSize).toBe(1);
        expect(result.totalPages).toBe(2);
    });

    test("should return all issues when pagination is omitted", async () => {
        const common = `unpaged-${randomUUID()}`;
        await createIssue(`${common}-one`);
        await createIssue(`${common}-two`);

        const result = await repository.search(client, { title: common });
        expect(result.total).toBe(2);
        expect(result.data).toHaveLength(2);
        expect(result.page).toBe(1);
        expect(result.pageSize).toBe(2);
    });
});
