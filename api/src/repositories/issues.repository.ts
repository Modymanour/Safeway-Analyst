import { UUID } from "crypto";
import { Queryable, query, queryOne, queryRows } from "../db/pool.ts";
import { PaginatedResult } from"./types.ts";
import { logger } from "../lib/loggers/logger.ts";

const log = logger.child({
    component: "issues_repository",
});

export type IssueStatus = 'open' | 'planned' | 'in_progress' | 'completed' | 'closed';

export interface IssuesRow{
    id: UUID,
    title: string,
    description: string,
    created_by: UUID | null,
    category_id:UUID,
    status: IssueStatus,
    priority: number,
    created_at : Date,
    updated_at : Date
};

const ISSUES_COLUMNS = `
    id, title, description, created_by, category_id, status, priority, created_at, updated_at`;

export class IssuesRepository{
    constructor() {}
    async create(
        db: Queryable,
        input: {
            title: string,
            description: string,
            created_by: UUID | null,
            category_id:UUID,
            status: IssueStatus,
            priority: number,
        }
    ): Promise<IssuesRow>{
        const result = await queryOne<IssuesRow>(
            db,
            `INSERT INTO issues (${ISSUES_COLUMNS})
             VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, now(), now())
             RETURNING ${ISSUES_COLUMNS}`,
             [
                input.title,
                input.description,
                input.created_by,
                input.category_id,
                input.status,
                input.priority
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
        input:{
            title?: string | null,
            description?: string | null,
            created_by?: UUID | null,
            category_id?: UUID | null,
            status?: IssueStatus | null,
            priority?: number | null,
        }
    ): Promise<IssuesRow | null>{
        const setClauses = [];
        const values = [];
        let index = 1;

        const allowedFields = new Set(['title', 'description', 'created_by', 'category_id', 'status', 'priority']);
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

        const result = await queryOne<IssuesRow>(
            db,
            `UPDATE issues SET ${setClauses.join(", ")}, updated_at = now() WHERE id = $${index} RETURNING ${ISSUES_COLUMNS}`,
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
            `DELETE FROM issues WHERE id = $1`,
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
    ): Promise<IssuesRow | null>{
        const result = await queryOne<IssuesRow>(
            db,
            `SELECT ${ISSUES_COLUMNS} FROM issues WHERE id = $1`,
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
            title?: string | null,
            description?: string | null,
            created_by?: UUID | null,
            category_id?: UUID | null,
            status?: IssueStatus | null,
            priority?: number | null,
            started_at?: Date | null,
            ended_at?: Date | null,
            page?: number | null,
            pageSize?: number | null
        }
    ): Promise<PaginatedResult<IssuesRow>>{
        const conditions = [];
        const values: unknown[] = [];
        let index = 1;

        if(filters.title != null){
            conditions.push(`title ILIKE $${index++}`);
            values.push(`%${filters.title}%`);
        }

        if(filters.description != null){
            conditions.push(`description ILIKE $${index++}`);
            values.push(`%${filters.description}%`);
        }

        if(filters.created_by != null){
            conditions.push(`created_by = $${index++}`);
            values.push(filters.created_by);
        }

        if(filters.category_id != null){
            conditions.push(`category_id = $${index++}`);
            values.push(filters.category_id);
        }

        if(filters.status != null){
            conditions.push(`status = $${index++}`);
            values.push(filters.status);
        }

        if(filters.priority != null){
            conditions.push(`priority = $${index++}`);
            values.push(filters.priority);
        }

        if(filters.started_at != null){
            conditions.push(`created_at >= $${index++}`);
            values.push(filters.started_at);
        }

        if(filters.ended_at != null){
            conditions.push(`created_at <= $${index++}`);
            values.push(filters.ended_at);
        }
        
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : '';

        const totalRow = await queryOne<{ total: number }>(
            db,
            `SELECT COUNT(*) AS total FROM issues ${whereClause}`,
            values
        );
        
        let limitClause = '';
        let offsetClause = '';
        const page = filters.page != null && filters.page > 0 ? filters.page : 1;
        const pageSize = filters.pageSize != null && filters.pageSize > 0 ? filters.pageSize : null;
        if (pageSize !== null) {
            limitClause = `LIMIT $${index++}`;
            values.push(pageSize);
            offsetClause = `OFFSET $${index++}`;
            values.push((page - 1) * pageSize);
        }

        const rows = await queryRows<IssuesRow>(
            db,
            `SELECT ${ISSUES_COLUMNS} FROM issues ${whereClause} ORDER BY created_at DESC ${limitClause} ${offsetClause}`,
            values
        );

        const total = Number(totalRow?.total ?? 0);
        const totalPages = pageSize ? Math.ceil(total / pageSize) : 1;

        const result: PaginatedResult<IssuesRow> = {
            data: rows,
            page,
            pageSize: pageSize ?? total,
            total: total,
            totalPages: totalPages
        }
        log.debug({
            action: "search",
            filters: filters,
            msg: "success"
        });
        return result;
    }
    async getAll(
        db: Queryable,
        page: number,
        pageSize: number
    ): Promise<PaginatedResult<IssuesRow>>{
        const normalizedPage = page > 0 ? page : 1;
        const limitClause = pageSize > 0 ? `LIMIT $1` : '';
        const offsetClause = pageSize > 0 ? `OFFSET $2` : '';

        const totalRow = await queryOne<{ total: number }>(
            db,
            `SELECT COUNT(*) AS total FROM issues`
        );

        const rows = await queryRows<IssuesRow>(
            db,
            `SELECT ${ISSUES_COLUMNS} FROM issues ORDER BY created_at DESC ${limitClause} ${offsetClause}`,
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