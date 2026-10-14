import { beforeEach, describe, expect, test, vi } from "vitest";
import { IssuesController } from "../../src/controllers/issues.controller.ts";
import { checkPermission } from "../../src/config/permissions.ts";
import type { IssueService } from "../../src/services/issue.service.ts";

const actorId = "11111111-1111-4111-8111-111111111111";
const categoryId = "22222222-2222-4222-8222-222222222222";
const issueId = "33333333-3333-4333-8333-333333333333";
const commentId = "44444444-4444-4444-8444-444444444444";

const responseData = (status_code = 200, data: unknown = { id: issueId }) => ({
    status: "Successful",
    status_code,
    data,
    msg: "Successful",
    request_id: null,
    url: null,
    time_taken_ms: null,
});

const createIssueServiceMock = () => ({
    create_category: vi.fn(), update_category: vi.fn(), delete_category: vi.fn(),
    get_category_by_name: vi.fn(), search_categories: vi.fn(), get_all_categories: vi.fn(),
    create_issue: vi.fn(), update_issue: vi.fn(), delete_issue: vi.fn(),
    get_issue_by_id: vi.fn(), search_issues: vi.fn(), get_all_issues: vi.fn(),
    create_comment: vi.fn(), update_comment: vi.fn(), delete_comment: vi.fn(),
    get_comment_by_id: vi.fn(), search_comments: vi.fn(), get_all_comments: vi.fn(),
});

const mockRequest = (overrides: Record<string, unknown> = {}): any => ({
    body: {},
    query: {},
    params: {},
    method: "GET",
    originalUrl: "/api/issues",
    user: { sub: actorId, role: "user" },
    ...overrides,
});

const mockResponse = () => {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
};

const assertSuccess = (res: ReturnType<typeof mockResponse>, status = 200) => {
    expect(res.status).toHaveBeenCalledWith(status);
    expect(res.json).toHaveBeenCalledOnce();
    expect(res.json.mock.calls[0][0].url).toBe("/api/issues");
    expect(res.json.mock.calls[0][0].time_taken_ms).toBeTypeOf("number");
};

let service: ReturnType<typeof createIssueServiceMock>;
let controller: IssuesController;

beforeEach(() => {
    vi.clearAllMocks();
    service = createIssueServiceMock();
    controller = new IssuesController(service as unknown as IssueService);
});

describe("IssuesController category routes", () => {
    test("allows users to create categories while keeping category administration restricted", () => {
        expect(checkPermission("user", "create_category")).toBe(true);
        expect(checkPermission("admin", "create_category")).toBe(true);
        expect(checkPermission("user", "set_category")).toBe(false);
        expect(checkPermission("admin", "set_category")).toBe(true);
    });

    test("validates and creates categories", async () => {
        service.create_category.mockResolvedValue(responseData(201));
        const req = mockRequest({
            method: "POST",
            body: { slug: "bug", name: "Bug", color: "DC2626", description: "Bug reports" },
        });
        const res = mockResponse();

        await controller.create_category(req, res);

        expect(service.create_category).toHaveBeenCalledWith(req.body);
        assertSuccess(res, 201);
    });

    test("returns validation error for invalid category payloads", async () => {
        const res = mockResponse();
        await controller.create_category(mockRequest({ method: "POST", body: { slug: "bug" } }), res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(service.create_category).not.toHaveBeenCalled();
    });

    test("uses route IDs for category update and delete", async () => {
        service.update_category.mockResolvedValue(responseData());
        service.delete_category.mockResolvedValue(responseData());
        const updateResponse = mockResponse();
        await controller.update_category(mockRequest({
            method: "PUT",
            params: { id: categoryId },
            body: { slug: null, name: "Bug reports", color: null, description: null },
        }), updateResponse);
        expect(service.update_category).toHaveBeenCalledWith(categoryId, expect.objectContaining({ name: "Bug reports" }));
        assertSuccess(updateResponse);

        const deleteResponse = mockResponse();
        await controller.delete_category(mockRequest({ method: "DELETE", params: { id: categoryId } }), deleteResponse);
        expect(service.delete_category).toHaveBeenCalledWith(categoryId);
        assertSuccess(deleteResponse);
    });

    test("retrieves category by name and normalizes category search pagination", async () => {
        service.get_category_by_name.mockResolvedValue(responseData());
        service.search_categories.mockResolvedValue(responseData());
        const getRes = mockResponse();
        await controller.get_category_by_name(mockRequest({ query: { name: "Bug" } }), getRes);
        expect(service.get_category_by_name).toHaveBeenCalledWith("Bug");
        assertSuccess(getRes);

        const filters = {
            slug: null, name: "Bug", color: null, description: null,
            start_date: null, end_date: null, page: 2, pageNumber: 25,
        };
        const searchRes = mockResponse();
        await controller.search_categories(mockRequest({ method: "POST", body: filters }), searchRes);
        const { pageNumber, ...categoryFilters } = filters;
        expect(service.search_categories).toHaveBeenCalledWith({ ...categoryFilters, pageSize: pageNumber });
        assertSuccess(searchRes);

        service.get_all_categories.mockResolvedValue(responseData());
        const allRes = mockResponse();
        await controller.get_all_categories(mockRequest({ query: { page: "2", pageNumber: "5" } }), allRes);
        expect(service.get_all_categories).toHaveBeenCalledWith(2, 5);
        assertSuccess(allRes);
    });
});

describe("IssuesController issue routes", () => {
    test("creates issues using the authenticated subject", async () => {
        service.create_issue.mockResolvedValue(responseData(201));
        const req = mockRequest({
            method: "POST",
            body: { title: "Add search", description: "Search issues", category_id: categoryId, status: "open", priority: 3 },
        });
        const res = mockResponse();

        await controller.create_issue(req, res);

        expect(service.create_issue).toHaveBeenCalledWith(actorId, req.body);
        assertSuccess(res, 201);
    });

    test("rejects issue creation without an authenticated identity or valid body", async () => {
        const noIdentity = mockResponse();
        await controller.create_issue(mockRequest({ user: undefined }), noIdentity);
        expect(noIdentity.status).toHaveBeenCalledWith(400);
        expect(service.create_issue).not.toHaveBeenCalled();

        const invalid = mockResponse();
        await controller.create_issue(mockRequest({ method: "POST", body: {} }), invalid);
        expect(invalid.status).toHaveBeenCalledWith(400);
        expect(service.create_issue).not.toHaveBeenCalled();
    });

    test("passes authenticated actor, role and route ID for issue updates/deletes", async () => {
        service.update_issue.mockResolvedValue(responseData());
        service.delete_issue.mockResolvedValue(responseData());
        const updateRes = mockResponse();
        await controller.update_issue(mockRequest({
            method: "PUT", params: { id: issueId }, body: {
                title: "Updated", description: null, category_id: null, status: null, priority: null,
            },
        }), updateRes);
        expect(service.update_issue).toHaveBeenCalledWith(actorId, "user", issueId, expect.objectContaining({ title: "Updated" }));
        assertSuccess(updateRes);

        const deleteRes = mockResponse();
        await controller.delete_issue(mockRequest({ method: "DELETE", params: { id: issueId } }), deleteRes);
        expect(service.delete_issue).toHaveBeenCalledWith(actorId, "user", issueId);
        assertSuccess(deleteRes);
    });

    test("gets issue by route ID, normalizes search filters, and lists issues", async () => {
        service.get_issue_by_id.mockResolvedValue(responseData());
        service.search_issues.mockResolvedValue(responseData());
        service.get_all_issues.mockResolvedValue(responseData());
        const getRes = mockResponse();
        await controller.get_issue_by_id(mockRequest({ params: { id: issueId } }), getRes);
        expect(service.get_issue_by_id).toHaveBeenCalledWith(issueId);
        assertSuccess(getRes);

        const filters = {
            title: "search", description: null, created_by: null, category_id: null,
            status: null, priority: null, start_date: null, end_date: null, page: 1, pageNumber: 10,
        };
        const searchRes = mockResponse();
        await controller.search_issues(mockRequest({ method: "POST", body: filters }), searchRes);
        expect(service.search_issues).toHaveBeenCalledWith({
            title: "search", description: null, created_by: null, category_id: null,
            status: null, priority: null, started_at: null, ended_at: null, page: 1, pageSize: 10,
        });
        assertSuccess(searchRes);

        const allRes = mockResponse();
        await controller.get_all_issues(mockRequest({ query: { page: "3", pageNumber: "15" } }), allRes);
        expect(service.get_all_issues).toHaveBeenCalledWith(3, 15);
        assertSuccess(allRes);
    });
});

describe("IssuesController comment routes", () => {
    test("creates comments using authenticated user and validated body", async () => {
        service.create_comment.mockResolvedValue(responseData(201));
        const req = mockRequest({ method: "POST", body: { issue_id: issueId, body: "Helpful note" } });
        const res = mockResponse();
        await controller.create_issue_comment(req, res);
        expect(service.create_comment).toHaveBeenCalledWith(actorId, req.body);
        assertSuccess(res, 201);
    });

    test("updates and deletes comments using authenticated user, role, and route ID", async () => {
        service.update_comment.mockResolvedValue(responseData());
        service.delete_comment.mockResolvedValue(responseData());
        const updateRes = mockResponse();
        await controller.update_issue_comment(mockRequest({
            method: "PUT", body: { comment_id: commentId, body: "Edited note" },
        }), updateRes);
        expect(service.update_comment).toHaveBeenCalledWith(actorId, "user", { comment_id: commentId, body: "Edited note" });
        assertSuccess(updateRes);

        const deleteRes = mockResponse();
        await controller.delete_issue_comment(mockRequest({ method: "DELETE", params: { id: commentId } }), deleteRes);
        expect(service.delete_comment).toHaveBeenCalledWith(actorId, "user", commentId);
        assertSuccess(deleteRes);
    });

    test("retrieves comments by ID, normalizes search filters, and lists comments", async () => {
        service.get_comment_by_id.mockResolvedValue(responseData());
        service.search_comments.mockResolvedValue(responseData());
        service.get_all_comments.mockResolvedValue(responseData());
        const getRes = mockResponse();
        await controller.get_issue_comment_by_id(mockRequest({ params: { id: commentId } }), getRes);
        expect(service.get_comment_by_id).toHaveBeenCalledWith(commentId);
        assertSuccess(getRes);

        const filters = {
            issue_id: issueId, author_id: null, body: null, edited: null,
            start_date: null, end_date: null, page: 1, pageNumber: 10,
        };
        const searchRes = mockResponse();
        await controller.search_comments(mockRequest({ method: "POST", body: filters }), searchRes);
        expect(service.search_comments).toHaveBeenCalledWith({
            issue_id: issueId, author_id: null, body: null, edited: null,
            started_at: null, ended_at: null, page: 1, pageSize: 10,
        });
        assertSuccess(searchRes);

        const allRes = mockResponse();
        await controller.get_all_issues_comments(mockRequest({ query: { page: "2", pageNumber: "6" } }), allRes);
        expect(service.get_all_comments).toHaveBeenCalledWith(2, 6);
        assertSuccess(allRes);
    });
});
