import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { pool } from "../setup.ts";
import { CategoriesRepository } from "../../src/repositories/categories.repository.ts";
import { IssuesRepository } from "../../src/repositories/issues.repository.ts";
import { IssuesCommentsRepository } from "../../src/repositories/issues_comments.repository.ts";
import { UserRepository } from "../../src/repositories/user.repository.ts";

const repository = new IssuesCommentsRepository();
const issues = new IssuesRepository();
const categories = new CategoriesRepository();
const users = new UserRepository();
let client: PoolClient;

const createComment = async (body: string) => {
    const suffix = randomUUID();
    const user = await users.create(client, {
        username: `comment-user-${suffix}`,
        email: `comment-${suffix}@example.com`,
        password: "test-password",
        role: "user",
    });
    const category = await categories.create(client, {
        slug: `comment-test-${suffix}`,
        name: `Comment test ${suffix}`,
        color: "#123ABC",
        description: "Issue comments test category",
    });
    const issue = await issues.create(client, {
        title: `Comment test issue ${suffix}`,
        description: "Issue for comment repository tests",
        created_by: user.id,
        category_id: category.id,
        status: "open",
        priority: 3,
    });
    const comment = await repository.create(client, {
        issue_id: issue.id,
        author_id: user.id,
        body,
    });

    return { user, issue, comment };
};

describe("Issue Comments Repository tests", () => {
    beforeEach(async () => {
        client = await pool.connect();
        await client.query("BEGIN");
    });

    afterEach(async () => {
        await client.query("ROLLBACK");
        client.release();
    });

    test("should create and retrieve an issue comment", async () => {
        const { comment } = await createComment("Initial comment");

        expect(comment).toMatchObject({ body: "Initial comment", edited: false });
        expect(comment.id).toBeDefined();
        expect(comment.created_at).toBeInstanceOf(Date);
        expect(comment.updated_at).toBeInstanceOf(Date);
        await expect(repository.getById(client, comment.id)).resolves.toMatchObject(comment);
        await expect(repository.getById(client, randomUUID())).resolves.toBeNull();
    });

    test("should update a comment and mark it edited", async () => {
        const { comment } = await createComment("Before edit");
        const updated = await repository.update(client, comment.id, { body: "After edit" });

        expect(updated).toMatchObject({
            id: comment.id,
            body: "After edit",
            edited: true,
        });
        await expect(repository.update(client, randomUUID(), { body: "Missing" })).resolves.toBeNull();
    });

    test("should leave the comment unchanged for an empty update", async () => {
        const { comment } = await createComment("No-op update");
        await expect(repository.update(client, comment.id, {})).resolves.toMatchObject(comment);
    });

    test("should delete a comment", async () => {
        const { comment } = await createComment("Delete me");
        await repository.delete(client, comment.id);
        await expect(repository.getById(client, comment.id)).resolves.toBeNull();
    });

    test("should search comments by issue, body and edited status with pagination", async () => {
        const { issue, user, comment: first } = await createComment("Search phrase first");
        const second = await repository.create(client, {
            issue_id: issue.id,
            author_id: user.id,
            body: "Search phrase second",
        });
        await repository.update(client, second.id, { body: "Search phrase edited" });

        const result = await repository.search(client, {
            issue_id: issue.id,
            author_id: user.id,
            body: "Search phrase",
            edited: true,
            page: 1,
            pageSize: 1,
        });

        expect(result.total).toBe(1);
        expect(result.data).toHaveLength(1);
        expect(result.data[0].id).toBe(second.id);
        expect(result.data[0].edited).toBe(true);
        expect(result.page).toBe(1);
        expect(result.pageSize).toBe(1);
        expect(first.edited).toBe(false);
    });
});
