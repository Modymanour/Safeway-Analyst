import { UUID } from "crypto";
import { Queryable, query, queryOne, queryRows } from "../db/pool.ts";
import { PaginatedResult } from"./types.ts";
import { logger } from "../lib/loggers/logger.ts";

const log = logger.child({
    component: "user_repository",
});

export interface UserRow{
    id: UUID,
    username: string,
    email: string,
    password: string,
    role: string,
    created_at: Date,
    updated_at: Date,
};

const USER_COLUMNS = `
    id, username, email, password, role, created_at, updated_at`;

export class UserRepository {
    constructor() {}
    async create(
        db: Queryable,
        input:{
            username: string,
            email: string,
            password: string,
            role: string,
        }
    ): Promise<UserRow>{
        const result = await queryOne<UserRow>(
            db,
            `INSERT INTO users (${USER_COLUMNS})
            VALUES (gen_random_uuid(), $1, $2, $3, $4, now(), now())
            RETURNING ${USER_COLUMNS}`,
            [
                input.username,
                input.email,
                input.password,
                input.role
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
            username?: string | null,
            email?: string | null,
            password?: string | null,
            role?: string | null,
        }
    ): Promise<UserRow | null>{
        const setClauses = [];
        const values = [];
        let index = 1;

        for (const [key, value] of Object.entries(input)) {
            if (value !== undefined) {
                setClauses.push(`${key} = $${index}`);
                values.push(value);
                index++;
            }
        }

        if (setClauses.length === 0) {
            return await this.getById(db, id);
        }

        const result = await queryOne<UserRow>(
            db,
            `UPDATE users SET ${setClauses.join(", ")}, updated_at = now() WHERE id = $${index} AND verified = true RETURNING ${USER_COLUMNS}`,
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
            `DELETE FROM users WHERE id = $1 AND verified = true`,
            [id]
        );
        log.debug({
            action: "delete",
            id: id,
            msg: "success"
        });
    }
    async verify_user(
        db: Queryable,
        user_id: UUID
    ): Promise<UserRow | null>{
        const result = await queryOne<UserRow>(
            db,
            `UPDATE users SET verified = true, updated_at = now() WHERE id = $1 RETURNING ${USER_COLUMNS}`,
            [user_id]
        );
        log.debug({
            action: "verify_user",
            id: user_id,
            msg: result ? "successful": "not found"
        });
        return result ?? null;
    }

    async getById(
        db: Queryable,
        id: UUID
    ): Promise<UserRow | null>{
        const result = await queryOne<UserRow>(
            db,
            `SELECT ${USER_COLUMNS} FROM users WHERE id = $1 AND verified = true`,
            [id]
        );
        log.debug({
            action: "get by id",
            id: id,
            msg: result ? "successful": "not found"
        });
        return result ?? null;
    }
    async getByIdNonVerified(
        db: Queryable,
        id: UUID
    ): Promise<UserRow | null>{
        const result = await queryOne<UserRow>(
            db,
            `SELECT ${USER_COLUMNS} FROM users WHERE id = $1 AND verified = false`,
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
            username: string | null,
            email: string | null,
            role: string | null,
        },
        page: number,
        pageSize: number
    ): Promise<PaginatedResult<UserRow>>{
        const whereClauses = [];
        const values = [];
        let index = 1;

        if (filters.username) {
            whereClauses.push(`username ILIKE $${index}`);
            values.push(`%${filters.username}%`);
            index++;
        }
        if (filters.email) {
            whereClauses.push(`email ILIKE $${index}`);
            values.push(`%${filters.email}%`);
            index++;
        }
        if (filters.role) {
            whereClauses.push(`role = $${index}`);
            values.push(filters.role);
            index++;
        }

        const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")} AND verified = true` : "WHERE verified = true";
        const offset = (page - 1) * pageSize;
        const limitClause = pageSize > 0 ? `LIMIT ${pageSize}` : '';
        const offsetClause = page > 0 ? `OFFSET ${offset}` : '';

        const totalRow = await queryOne<{ total: number }>(
            db,
            `SELECT COUNT(*) AS total FROM users ${whereClause}`,
            [...values]
        );

        const rows = await queryRows<UserRow>(
            db,
            `SELECT ${USER_COLUMNS} FROM users ${whereClause} ORDER BY created_at DESC ${limitClause} ${offsetClause}`,
            [...values]
        );

        const total = totalRow?.total ?? 0;
        const totalPages = pageSize > 0 ? Math.ceil(total / pageSize) : 1;

        const result = {
            data: rows,
            page: page,
            pageSize: pageSize,
            total: total,
            totalPages: totalPages
        }

        log.debug({
            action: "search users",
            filters: filters,
            page: page,
            pageNumber: pageSize,
            data_count: result.total,
            msg: "success"
        });

        return result
    }
    

    async getByEmail(
        db: Queryable,
        email: string
    ): Promise<UserRow | null>{
        const result = await queryOne<UserRow>(
            db,
            `SELECT ${USER_COLUMNS} FROM users WHERE email = $1 AND verified = true`,
            [email]
        );
        log.debug({
            action: "get by email",
            email: email,
            msg: result ? "successful": "not found"
        });
        return result ?? null;
    }
    async getByEmailAnyVerificationState(
        db: Queryable,
        email: string
    ): Promise<UserRow | null> {
        const result = await queryOne<UserRow>(
            db,
            `SELECT ${USER_COLUMNS} FROM users WHERE email = $1`,
            [email]
        );
        return result ?? null;
    }
    async getByEmailNonVerified(
        db: Queryable,
        email: string
    ): Promise<UserRow | null>{
        const result = await queryOne<UserRow>(
            db,
            `SELECT ${USER_COLUMNS} FROM users WHERE email = $1 AND verified = false`,
            [email]
        );
        log.debug({
            action: "get by email",
            email: email,
            msg: result ? "successful": "not found"
        });
        return result ?? null;
    }

    async getAll(
        db: Queryable,
        page: number,
        pageSize: number
    ): Promise<PaginatedResult<UserRow>>{
        const offset = (page - 1) * pageSize;
        const limitClause = pageSize > 0 ? `LIMIT ${pageSize}` : '';
        const offsetClause = page > 0 ? `OFFSET ${offset}` : '';

        const totalRow = await queryOne<{ total: number }>(
            db,
            `SELECT COUNT(*) AS total FROM users`
        );

        const rows = await queryRows<UserRow>(
            db,
            `SELECT ${USER_COLUMNS} FROM users ORDER BY created_at DESC ${limitClause} ${offsetClause}`,
            []
        );

        const total = totalRow?.total ?? 0;
        const totalPages = pageSize > 0 ? Math.ceil(total / pageSize) : 1;

        const result = {
            data: rows,
            page: page,
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