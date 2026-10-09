import { UUID } from "crypto";
import { Queryable, query, queryOne, queryRows } from "../db/pool.ts";
import { PaginatedResult } from"./types.ts";
import { logger } from "../lib/loggers/logger.ts";

const log = logger.child({
    component: "issues_comments_repository",
});

export interface IssuesCommentsRow{
    id: UUID,
    issue_id: UUID,
    author_id: UUID | null,
    body: string,
    edited: boolean,
    created_at: Date,
    updated_at: Date
};

const ISSUES_COMMENTS_COLUMNS = `
    id, issue_id, author_id, body, edited, created_at, updated_at`;

export class IssuesCommentsRepository{
    constructor() {}
    async create(
        db: Queryable,
        input: {
            issue_id: UUID,
            author_id: UUID | null,
            body: string,
        }
    ): Promise<IssuesCommentsRow>{
        const result = await queryOne<IssuesCommentsRow>(
            db,
            `INSERT INTO issue_comments (${ISSUES_COMMENTS_COLUMNS})
             VALUES (gen_random_uuid(), $1, $2, $3, false, now(), now())
             RETURNING ${ISSUES_COMMENTS_COLUMNS}`,
            [
                input.issue_id,
                input.author_id,
                input.body
            ]
        );
        log.debug({
            action: "create",
            data: input,
            msg: "success"
        });
        return result!;
    }
    async update(
        db: Queryable,
        id: UUID,
        input: {
            issue_id?: UUID | null,
            author_id?: UUID | null,
            body?: string | null,
        }
    ): Promise<IssuesCommentsRow | null>{
        const setClauses = [];
        const values = [];
        let index = 1;

        const allowedFields = new Set(['issue_id', 'author_id', 'body']);
        for (const [key, value] of Object.entries(input)) {
            if (allowedFields.has(key) && value !== undefined && value !== null) {
                setClauses.push(`${key} = $${index}`);
                values.push(value);
                index++;
            }
        }

        if (setClauses.length === 0) {
            return await this.getById(db, id);
        }

        const result = await queryOne<IssuesCommentsRow>(
            db,
            `UPDATE issue_comments SET ${setClauses.join(", ")}, edited = true, updated_at = now() WHERE id = $${index} RETURNING ${ISSUES_COMMENTS_COLUMNS}`,
            [...values, id]
        );
        log.debug({
            action: "update",
            id: id,
            data: input,
            msg: result ? "successful": "not found"
        });
        return result ?? null;
    }
    async delete(
        db: Queryable,
        id: UUID
    ): Promise<void>{
        await query(
            db,
            `DELETE FROM issue_comments WHERE id = $1`,
            [id]
        );
        log.debug({
            action: "delete",
            id: id,
            msg: "success"
        });
    }
    async getById(
        db: Queryable,
        id: UUID
    ): Promise<IssuesCommentsRow | null>{
        const result = await queryOne<IssuesCommentsRow>(
            db,
            `SELECT ${ISSUES_COMMENTS_COLUMNS} FROM issue_comments WHERE id = $1`,
            [id]
        );
        log.debug({
            action: "get by id",
            id: id,
            msg: result ? "successful": "not found"
        });
        return result ?? null;
    }
    async search(
        db: Queryable,
        filters: {
            issue_id?: UUID | null,
            author_id?: UUID | null,
            body?: string | null,
            edited?: boolean | null,
            started_at?: Date | null,
            ended_at?: Date | null,
            page?: number | null,
            pageSize?: number | null
        }
    ): Promise<PaginatedResult<IssuesCommentsRow>>{
        const conditions = [];
        const values: unknown[] = [];
        let index = 1;

        if(filters.issue_id != null){
            conditions.push(`issue_id = $${index++}`);
            values.push(filters.issue_id);
        }
        
        if(filters.author_id != null){
            conditions.push(`author_id = $${index++}`);
            values.push(filters.author_id);
        }

        if(filters.body != null){
            conditions.push(`body ILIKE $${index++}`);
            values.push(`%${filters.body}%`);
        }

        if(filters.edited != null){
            conditions.push(`edited = $${index++}`);
            values.push(filters.edited);
        }
        
        if(filters.started_at != null){
            conditions.push(`created_at >= $${index++}`);
            values.push(filters.started_at);
        }

        if(filters.ended_at != null){
            conditions.push(`created_at <= $${index++}`);
            values.push(filters.ended_at);
        }
        
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
        const page = filters.page != null && filters.page > 0 ? filters.page : 1;
        const pageSize = filters.pageSize != null && filters.pageSize > 0 ? filters.pageSize : 10;

        const totalRow = await queryOne<{ total: number }>(
            db,
            `SELECT COUNT(*) AS total FROM issue_comments ${whereClause}`,
            values
        );
        const total = Number(totalRow?.total ?? 0);

        const limitClause = `LIMIT $${index++}`;
        const offsetClause = `OFFSET $${index++}`;
        values.push(pageSize, (page - 1) * pageSize);
        const rows = await queryRows<IssuesCommentsRow>(
            db,
            `SELECT ${ISSUES_COMMENTS_COLUMNS} FROM issue_comments ${whereClause} ORDER BY created_at DESC ${limitClause} ${offsetClause}`,
            values
        );

        log.debug({
            action: "search",
            filters: filters,
            msg: "success"
        });

        const result: PaginatedResult<IssuesCommentsRow> = {
            data: rows,
            page: page,
            pageSize: pageSize,
            total: total,
            totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 1
        }
        return result;
    }
    async getAll(
        db: Queryable,
        page: number,
        pageSize: number
    ): Promise<PaginatedResult<IssuesCommentsRow>>{
        const normalizedPage = page > 0 ? page : 1;
        const limitClause = pageSize > 0 ? `LIMIT $1` : '';
        const offsetClause = pageSize > 0 ? `OFFSET $2` : '';

        const totalRow = await queryOne<{ total: number }>(
            db,
            `SELECT COUNT(*) AS total FROM issue_comments`
        );

        const rows = await queryRows<IssuesCommentsRow>(
            db,
            `SELECT ${ISSUES_COMMENTS_COLUMNS} FROM issue_comments ORDER BY created_at DESC ${limitClause} ${offsetClause}`,
            pageSize > 0 ? [pageSize, (normalizedPage - 1) * pageSize] : []
        );

        const total = Number(totalRow?.total ?? 0);
        const totalPages = pageSize > 0 ? Math.ceil(total / pageSize) : 1;

        const result = {
            data: rows,
            page: normalizedPage,
            pageSize: pageSize,
            total: total,
            totalPages: totalPages
        }

        log.debug({
            action: "get all users",
            page: page,
            pageSize: pageSize,
            data_count: result.total,
            msg: "success"
        });

        return result;
    }
}