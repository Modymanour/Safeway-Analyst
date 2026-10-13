import { beforeEach, describe, expect, test, vi } from "vitest";
import type { UUID } from "node:crypto";
import type { Queryable } from "../../src/db/pool.ts";
import { ForbiddenError, NotFoundError, ValidationError } from "../../src/lib/errors/errors.ts";
import type { CategoriesRepository, CategoryRow } from "../../src/repositories/categories.repository.ts";
import type { IssuesCommentsRepository, IssuesCommentsRow } from "../../src/repositories/issues_comments.repository.ts";
import type { IssuesRepository, IssuesRow } from "../../src/repositories/issues.repository.ts";
import type { UserRepository, UserRow } from "../../src/repositories/user.repository.ts";
import { IssueService } from "../../src/services/issue.service.ts";

const fakeDb: Queryable = { query: vi.fn() };
const actorId = "11111111-1111-1111-1111-111111111111" as UUID;
const otherId = "22222222-2222-2222-2222-222222222222" as UUID;
const categoryId = "33333333-3333-3333-3333-333333333333" as UUID;
const issueId = "44444444-4444-4444-4444-444444444444" as UUID;
const commentId = "55555555-5555-5555-5555-555555555555" as UUID;
const now = new Date("2026-01-01T00:00:00.000Z");

const userRow: UserRow = {
    id: actorId,
    username: "issue-owner",
    email: "owner@example.com",
    password: "hashed-password",
    role: "user",
    created_at: now,
    updated_at: now,
};

const categoryRow: CategoryRow = {
    id: categoryId,
    slug: "enhancement",
    name: "Enhancement",
    color: "#2563EB",
    description: "Feature requests",
    created_at: now,
    updated_at: now,
};

const issueRow: IssuesRow = {
    id: issueId,
    title: "Add feature",
    description: "Feature description",
    created_by: actorId,
    category_id: categoryId,
    status: "open",
    priority: 3,
    created_at: now,
    updated_at: now,
};

const commentRow: IssuesCommentsRow = {
    id: commentId,
    issue_id: issueId,
    author_id: actorId,
    body: "A comment",
    edited: false,
    created_at: now,
    updated_at: now,
};

const page = <T,>(data: T[]) => ({ data, page: 1, pageSize: 10, total: data.length, totalPages: 1 });

function createService() {
    const issueRepo = {
        create: vi.fn(), update: vi.fn(), delete: vi.fn(), getById: vi.fn(), search: vi.fn(), getAll: vi.fn(),
    } as unknown as IssuesRepository;
    const userRepo = {
        getById: vi.fn(),
    } as unknown as UserRepository;
    const commentsRepo = {
        create: vi.fn(), update: vi.fn(), delete: vi.fn(), getById: vi.fn(), search: vi.fn(), getAll: vi.fn(),
    } as unknown as IssuesCommentsRepository;
    const categoriesRepo = {
        create: vi.fn(), update: vi.fn(), delete: vi.fn(), getById: vi.fn(), getByName: vi.fn(), search: vi.fn(), getAll: vi.fn(),
    } as unknown as CategoriesRepository;
    const service = new IssueService(issueRepo, userRepo, commentsRepo, categoriesRepo, fakeDb);
    return { service, issueRepo, userRepo, commentsRepo, categoriesRepo };
}

let repos: ReturnType<typeof createService>;

beforeEach(() => {
    repos = createService();
});

describe("IssueService category operations", () => {
    test("creates a category and returns a created response", async () => {
        repos.categoriesRepo.create = vi.fn().mockResolvedValue(categoryRow);

        const result = await repos.service.create_category({
            slug: categoryRow.slug,
            name: categoryRow.name,
            color: categoryRow.color,
            description: categoryRow.description ?? "",
        });

        expect(repos.categoriesRepo.create).toHaveBeenCalledWith(fakeDb, expect.objectContaining({ slug: categoryRow.slug }));
        expect(result.status_code).toBe(201);
        expect(result.data).toEqual(categoryRow);
    });

    test("fails category creation if the repository returns no row", async () => {
        repos.categoriesRepo.create = vi.fn().mockResolvedValue(null);
        await expect(repos.service.create_category({ slug: "x", name: "x", color: "#123456", description: "x" }))
            .rejects.toBeInstanceOf(ValidationError);
    });

    test("updates existing categories and reports missing categories", async () => {
        repos.categoriesRepo.getById = vi.fn().mockResolvedValue(categoryRow);
        repos.categoriesRepo.update = vi.fn().mockResolvedValue({ ...categoryRow, name: "Updated" });

        const result = await repos.service.update_category(categoryId, { name: "Updated" });
        expect(result.status_code).toBe(200);
        expect(result.data?.name).toBe("Updated");

        repos.categoriesRepo.getById = vi.fn().mockResolvedValue(null);
        await expect(repos.service.update_category(categoryId, { name: "Updated" })).rejects.toBeInstanceOf(NotFoundError);
    });

    test("deletes only an existing category", async () => {
        repos.categoriesRepo.getById = vi.fn().mockResolvedValue(categoryRow);
        repos.categoriesRepo.delete = vi.fn().mockResolvedValue(undefined);

        const result = await repos.service.delete_category(categoryId);
        expect(result.status_code).toBe(200);
        expect(repos.categoriesRepo.delete).toHaveBeenCalledWith(fakeDb, categoryId);

        repos.categoriesRepo.getById = vi.fn().mockResolvedValue(null);
        await expect(repos.service.delete_category(categoryId)).rejects.toBeInstanceOf(NotFoundError);
    });

    test("validates and retrieves categories by trimmed name", async () => {
        repos.categoriesRepo.getByName = vi.fn().mockResolvedValue(categoryRow);
        const result = await repos.service.get_category_by_name("  Enhancement  ");
        expect(repos.categoriesRepo.getByName).toHaveBeenCalledWith(fakeDb, "Enhancement");
        expect(result.data).toEqual(categoryRow);

        await expect(repos.service.get_category_by_name("   ")).rejects.toBeInstanceOf(ValidationError);
        repos.categoriesRepo.getByName = vi.fn().mockResolvedValue(null);
        await expect(repos.service.get_category_by_name("missing")).rejects.toBeInstanceOf(NotFoundError);
    });

    test("passes category search and pagination through", async () => {
        repos.categoriesRepo.search = vi.fn().mockResolvedValue(page([categoryRow]));
        repos.categoriesRepo.getAll = vi.fn().mockResolvedValue(page([categoryRow]));
        const filters = { name: "Enhancement", page: 1, pageSize: 10 };

        expect((await repos.service.search_categories(filters)).data?.data).toEqual([categoryRow]);
        const all = await repos.service.get_all_categories(1, 10);
        expect(all.status_code).toBe(200);
        expect(repos.categoriesRepo.search).toHaveBeenCalledWith(fakeDb, filters);
        expect(repos.categoriesRepo.getAll).toHaveBeenCalledWith(fakeDb, 1, 10);
    });
});

describe("IssueService issue operations", () => {
    test("creates issues using the authenticated user ID, not a body-supplied creator", async () => {
        repos.userRepo.getById = vi.fn().mockResolvedValue(userRow);
        repos.categoriesRepo.getById = vi.fn().mockResolvedValue(categoryRow);
        repos.issueRepo.create = vi.fn().mockResolvedValue(issueRow);
        const input = { title: issueRow.title, description: issueRow.description, category_id: categoryId, status: "open" as const, priority: 3 };

        const result = await repos.service.create_issue(actorId, input);

        expect(repos.issueRepo.create).toHaveBeenCalledWith(fakeDb, { ...input, created_by: actorId });
        expect(result.status_code).toBe(201);
        expect(result.data).toEqual(issueRow);
    });

    test("rejects issue creation for a missing user or category", async () => {
        repos.userRepo.getById = vi.fn().mockResolvedValue(null);
        await expect(repos.service.create_issue(actorId, {
            title: "A title", description: "A description", category_id: categoryId, status: "open", priority: 3,
        })).rejects.toBeInstanceOf(NotFoundError);
        expect(repos.issueRepo.create).not.toHaveBeenCalled();

        repos.userRepo.getById = vi.fn().mockResolvedValue(userRow);
        repos.categoriesRepo.getById = vi.fn().mockResolvedValue(null);
        await expect(repos.service.create_issue(actorId, {
            title: "A title", description: "A description", category_id: categoryId, status: "open", priority: 3,
        })).rejects.toBeInstanceOf(NotFoundError);
    });

    test("allows issue owners and admins to update, but denies other users", async () => {
        repos.userRepo.getById = vi.fn().mockResolvedValue(userRow);
        repos.issueRepo.getById = vi.fn().mockResolvedValue(issueRow);
        repos.issueRepo.update = vi.fn().mockResolvedValue({ ...issueRow, title: "Updated" });

        const ownerResult = await repos.service.update_issue(actorId, "user", issueId, { title: "Updated" });
        expect(ownerResult.status_code).toBe(200);
        repos.userRepo.getById = vi.fn().mockResolvedValue({ ...userRow, id: otherId });
        await expect(repos.service.update_issue(otherId, "user", issueId, { title: "No" })).rejects.toBeInstanceOf(ForbiddenError);
        await expect(repos.service.update_issue(otherId, "admin", issueId, { title: "Admin" })).resolves.toMatchObject({ status_code: 200 });
        expect(repos.issueRepo.update).toHaveBeenCalledTimes(2);
    });

    test("rejects issue updates when the user or issue is missing", async () => {
        repos.userRepo.getById = vi.fn().mockResolvedValue(null);
        await expect(repos.service.update_issue(actorId, "user", issueId, {})).rejects.toBeInstanceOf(NotFoundError);
        repos.userRepo.getById = vi.fn().mockResolvedValue(userRow);
        repos.issueRepo.getById = vi.fn().mockResolvedValue(null);
        await expect(repos.service.update_issue(actorId, "user", issueId, {})).rejects.toBeInstanceOf(NotFoundError);
    });

    test("allows issue owners and admins to delete, but denies other users", async () => {
        repos.userRepo.getById = vi.fn().mockResolvedValue(userRow);
        repos.issueRepo.getById = vi.fn().mockResolvedValue(issueRow);
        repos.issueRepo.delete = vi.fn().mockResolvedValue(undefined);

        const result = await repos.service.delete_issue(actorId, "user", issueId);
        expect(result.status_code).toBe(200);
        repos.userRepo.getById = vi.fn().mockResolvedValue({ ...userRow, id: otherId });
        await expect(repos.service.delete_issue(otherId, "user", issueId)).rejects.toBeInstanceOf(ForbiddenError);
        await expect(repos.service.delete_issue(otherId, "admin", issueId)).resolves.toMatchObject({ status_code: 200 });
        expect(repos.issueRepo.delete).toHaveBeenCalledTimes(2);
    });

    test("gets, searches and lists issues", async () => {
        repos.issueRepo.getById = vi.fn().mockResolvedValue(issueRow);
        repos.issueRepo.search = vi.fn().mockResolvedValue(page([issueRow]));
        repos.issueRepo.getAll = vi.fn().mockResolvedValue(page([issueRow]));

        expect((await repos.service.get_issue_by_id(issueId)).data).toEqual(issueRow);
        expect((await repos.service.search_issues({ status: "open" })).data?.data).toEqual([issueRow]);
        expect((await repos.service.get_all_issues(1, 10)).data?.data).toEqual([issueRow]);

        repos.issueRepo.getById = vi.fn().mockResolvedValue(null);
        await expect(repos.service.get_issue_by_id(issueId)).rejects.toBeInstanceOf(NotFoundError);
    });
});

describe("IssueService comment operations", () => {
    test("creates comments using the authenticated user ID", async () => {
        repos.userRepo.getById = vi.fn().mockResolvedValue(userRow);
        repos.issueRepo.getById = vi.fn().mockResolvedValue(issueRow);
        repos.commentsRepo.create = vi.fn().mockResolvedValue(commentRow);

        const result = await repos.service.create_comment(actorId, { issue_id: issueId, body: "A comment" });
        expect(repos.commentsRepo.create).toHaveBeenCalledWith(fakeDb, { issue_id: issueId, body: "A comment", author_id: actorId });
        expect(result.status_code).toBe(201);
        expect(result.data).toEqual(commentRow);
    });

    test("rejects comments for missing users/issues or failed inserts", async () => {
        repos.userRepo.getById = vi.fn().mockResolvedValue(null);
        await expect(repos.service.create_comment(actorId, { issue_id: issueId, body: "text" })).rejects.toBeInstanceOf(NotFoundError);

        repos.userRepo.getById = vi.fn().mockResolvedValue(userRow);
        repos.issueRepo.getById = vi.fn().mockResolvedValue(null);
        await expect(repos.service.create_comment(actorId, { issue_id: issueId, body: "text" })).rejects.toBeInstanceOf(NotFoundError);

        repos.issueRepo.getById = vi.fn().mockResolvedValue(issueRow);
        repos.commentsRepo.create = vi.fn().mockResolvedValue(null);
        await expect(repos.service.create_comment(actorId, { issue_id: issueId, body: "text" })).rejects.toBeInstanceOf(ValidationError);
    });

    test("allows comment owners and admins to update, but denies other users", async () => {
        repos.userRepo.getById = vi.fn().mockResolvedValue(userRow);
        repos.commentsRepo.getById = vi.fn().mockResolvedValue(commentRow);
        repos.commentsRepo.update = vi.fn().mockResolvedValue({ ...commentRow, body: "Updated", edited: true });

        expect((await repos.service.update_comment(actorId, "user", { comment_id: commentId, body: "Updated" })).status_code).toBe(200);
        repos.userRepo.getById = vi.fn().mockResolvedValue({ ...userRow, id: otherId });
        await expect(repos.service.update_comment(otherId, "user", { comment_id: commentId, body: "No" })).rejects.toBeInstanceOf(ForbiddenError);
        await expect(repos.service.update_comment(otherId, "admin", { comment_id: commentId, body: "Admin" })).resolves.toMatchObject({ status_code: 200 });
        expect(repos.commentsRepo.update).toHaveBeenCalledTimes(2);
    });

    test("rejects missing comments and failed comment updates", async () => {
        repos.userRepo.getById = vi.fn().mockResolvedValue(userRow);
        repos.commentsRepo.getById = vi.fn().mockResolvedValue(null);
        await expect(repos.service.update_comment(actorId, "user", { comment_id: commentId, body: "text" })).rejects.toBeInstanceOf(NotFoundError);

        repos.commentsRepo.getById = vi.fn().mockResolvedValue(commentRow);
        repos.commentsRepo.update = vi.fn().mockResolvedValue(null);
        await expect(repos.service.update_comment(actorId, "user", { comment_id: commentId, body: "text" })).rejects.toBeInstanceOf(ValidationError);
    });

    test("allows comment owners and admins to delete, but denies other users", async () => {
        repos.userRepo.getById = vi.fn().mockResolvedValue(userRow);
        repos.commentsRepo.getById = vi.fn().mockResolvedValue(commentRow);
        repos.commentsRepo.delete = vi.fn().mockResolvedValue(undefined);

        const result = await repos.service.delete_comment(actorId, "user", commentId);
        expect(result.status_code).toBe(200);
        repos.userRepo.getById = vi.fn().mockResolvedValue({ ...userRow, id: otherId });
        await expect(repos.service.delete_comment(otherId, "user", commentId)).rejects.toBeInstanceOf(ForbiddenError);
        await expect(repos.service.delete_comment(otherId, "admin", commentId)).resolves.toMatchObject({ status_code: 200 });
        expect(repos.commentsRepo.delete).toHaveBeenCalledTimes(2);
    });

    test("gets, searches and lists comments", async () => {
        repos.commentsRepo.getById = vi.fn().mockResolvedValue(commentRow);
        repos.commentsRepo.search = vi.fn().mockResolvedValue(page([commentRow]));
        repos.commentsRepo.getAll = vi.fn().mockResolvedValue(page([commentRow]));

        expect((await repos.service.get_comment_by_id(commentId)).data).toEqual(commentRow);
        expect((await repos.service.search_comments({ issue_id: issueId })).data?.data).toEqual([commentRow]);
        expect((await repos.service.get_all_comments(1, 10)).data?.data).toEqual([commentRow]);

        repos.commentsRepo.getById = vi.fn().mockResolvedValue(null);
        await expect(repos.service.get_comment_by_id(commentId)).rejects.toBeInstanceOf(NotFoundError);
    });
});
