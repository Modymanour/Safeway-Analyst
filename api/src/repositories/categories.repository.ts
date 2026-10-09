import { UUID } from "crypto";
import { Queryable, query, queryOne, queryRows } from "../db/pool.ts";
import { PaginatedResult } from"./types.ts";
import { logger } from "../lib/loggers/logger.ts";

const log = logger.child({
    component: "categories_repository",
});

export interface CategoryRow {
    id: UUID,
    slug: string,
    name: string,
    color: string,
    description: string | null,
    created_at: Date,
    updated_at: Date
};

const CATEGORY_COLUMNS= `
    id, slug, name, color, description, created_at, updated_at`;

export class CategoriesRepository{
    constructor () {}
    async create(
        db: Queryable,
        input:{
            slug: string,
            name: string,
            color: string,
            description: string,
        }
    ): Promise<CategoryRow>{
        const result = await queryOne<CategoryRow>(
            db,
            `INSERT INTO categories (${CATEGORY_COLUMNS})
             VALUES (gen_random_uuid(), $1, $2, $3, $4, now(), now())
             RETURNING ${CATEGORY_COLUMNS}`,
            [
                input.slug,
                input.name,
                input.color,
                input.description
            ] 
        );
        log.debug({
            action: "create",
            data: input,
            msg: "success"
        });
        return result!;
    };
    async update(
        db: Queryable,
        id: UUID,
        input: {
            slug?: string | null,
            name?: string | null,
            color?: string | null,
            description?: string | null,
        }
    ): Promise<CategoryRow | null> {
        const result = await queryOne<CategoryRow>(
            db,
            `UPDATE categories SET
             slug           = COALESCE($1, slug),
             name           = COALESCE($2, name),
             color          = COALESCE($3, color),
             description    = COALESCE($4, description),
             updated_at     = now()
             WHERE id = $5
             RETURNING ${CATEGORY_COLUMNS}`,
             [input.slug ?? null, input.name ?? null, input.color ?? null, input.description ?? null, id]
        );
        log.debug({ action: "update", id, data: input, msg: result ? "success" : "not found" });
        return result ?? null;
    };
    async delete(
        db: Queryable,
        id: UUID
    ): Promise<void>{
        await query(
            db,
            `DELETE FROM categories WHERE id = $1`,
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
    ): Promise<CategoryRow | null>{
        const result = await queryOne<CategoryRow>(
            db,
            `SELECT ${CATEGORY_COLUMNS} FROM categories WHERE id = $1`,
            [id]
        );
         log.debug({
            action: "get by id",
            id: id,
            msg: result ? "successful": "not found"
        });
        return result ?? null;
    };
    async getByName(
        db: Queryable,
        name: string
    ): Promise<CategoryRow | null>{
        const result = await queryOne<CategoryRow>(
            db,
            `SELECT ${CATEGORY_COLUMNS} FROM categories WHERE name = $1`,
            [name]
        );
         log.debug({
            action: "get by id",
            name: name,
            msg: result ? "successful": "not found"
        });
        return result ?? null;
    };
    async search(
        db: Queryable,
        filters: {
            slug?: string | null,
            name?: string | null,
            color?: string | null,
            description?: string | null,
            start_date?: Date | null,
            end_date?: Date | null,
            page?: number | null,
            pageSize?: number | null
        }
    ): Promise<PaginatedResult<CategoryRow>>{
        const conditions: string[] =  [];
        const values: unknown[] = [];
        let index = 1;

        if (filters.slug != null) {
            conditions.push(`slug ILIKE $${index++}`);
            values.push(`%${filters.slug}%`);
        }

        if (filters.name != null) {
            conditions.push(`name ILIKE $${index++}`);
            values.push(`%${filters.name}%`);
        }

        if (filters.color != null) {
            conditions.push(`color ILIKE $${index++}`);
            values.push(`%${filters.color}%`);
        }

        if (filters.description != null) {
            conditions.push(`description ILIKE $${index++}`);
            values.push(`%${filters.description}%`);
        }

        if (filters.start_date != null) {
            conditions.push(`created_at >= $${index++}`);
            values.push(filters.start_date);
        }

        if (filters.end_date != null) {
            conditions.push(`created_at <= $${index++}`);
            values.push(filters.end_date);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const totalRow = await queryOne<{ total: number }>(
            db,
            `SELECT COUNT(*) AS total FROM categories ${whereClause}`,
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

        const rows = await queryRows<CategoryRow>(
            db,
            `SELECT ${CATEGORY_COLUMNS} FROM categories ${whereClause} ORDER BY created_at DESC ${limitClause} ${offsetClause}`,
            values
        );
        const total = Number(totalRow?.total ?? 0);
        const totalPages = pageSize ? Math.ceil(total / pageSize) : 1;

        const result: PaginatedResult<CategoryRow> = {
            data: rows,
            total,
            page: page > 0 ? page : 1,
            pageSize: pageSize ?? total,
            totalPages,
        }
        log.debug({
            action: "search",
            filters: filters,
            page: page,
            pageSize: pageSize,
            data_count: result.total,
            msg: "success"
        });
        return result;
    }
}