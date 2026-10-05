import { UUID } from "crypto";
import { Queryable, query, queryOne, queryRows } from "../db/pool.ts";
import { PaginatedResult } from"./types.ts";
import { logger } from "../lib/loggers/logger.ts";

const log = logger.child({
    component: "verification_token_repository"
})

export interface VerificationTokenRow{
    id: UUID,
    user_id: UUID,
    token: string,
    expires_at: Date,
    created_at: Date,
    updated_at: Date
};

const VERIFICATION_TOKEN_COLUMNS=`
    id, user_id, token, expires_at, created_at, updated_at`;

export class VerificationTokenRepository{
    constructor () {}
    async create(
        db: Queryable,
        input:{
            user_id: UUID,
            token: string,
            expires_at: Date,
        }
    ): Promise<VerificationTokenRow>{
        const result = await queryOne<VerificationTokenRow>(
            db,
            `INSERT INTO verification_tokens (${VERIFICATION_TOKEN_COLUMNS})
             VALUES (gen_random_uuid(), $1, $2, $3, now(), now())
             RETURNING ${VERIFICATION_TOKEN_COLUMNS}`,
             [
                input.user_id,
                input.token,
                input.expires_at
             ]
        );
        log.debug({
            action: "create",
            data: input,
            msg: "success"
        })
        return result!;
    }
    async update(
        db: Queryable,
        id: UUID,
        input:{
            token: string,
            expires_at: Date
        }
    ): Promise<VerificationTokenRow | null>{
        const result = await queryOne<VerificationTokenRow>(
            db,
            `UPDATE verification_tokens SET
             token          = COALESCE($1, token),
             expires_at     = COALESCE($2, expires_at)
             WHERE id = $3
             RETURNING ${VERIFICATION_TOKEN_COLUMNS}`,
             [
                input.token ?? null,
                input.expires_at ?? null,
                id
             ]
        );
        log.debug({
            action: "update",
            data: input,
            msg: result ? "successful": "not found"
        });
        return result ?? null;
    }
    async delete(
        db: Queryable,
        id: UUID
    ): Promise<void> {
        await query(
            db,
            `DELETE FROM verification_tokens WHERE id = $1`,
            [id]
        );
        log.debug({
            action: "delete",
            id: id,
            msg: "success"
        });
    }
    async deleteByUserId(db: Queryable, user_id: UUID): Promise<void> {
        await query(db, `DELETE FROM verification_tokens WHERE user_id = $1`, [user_id]);
    }
    async getById(
        db: Queryable,
        id: UUID
    ): Promise<VerificationTokenRow | null> {
        const result = await queryOne<VerificationTokenRow>(
            db,
            `SELECT ${VERIFICATION_TOKEN_COLUMNS} FROM verification_tokens WHERE id = $1`,
            [id]
        );
        log.debug({
            action: "get by id",
            id: id,
            msg: result ? "successful": "not found"
        });
        return result ?? null;
    }
    async getByToken(
        db: Queryable,
        token: string
    ): Promise<VerificationTokenRow | null> {
        const result = await queryOne<VerificationTokenRow>(
            db,
            `SELECT ${VERIFICATION_TOKEN_COLUMNS} FROM verification_tokens WHERE token = $1`,
            [token]
        );
        log.debug({
            action: "get by id",
            token: token,
            msg: result ? "successful": "not found"
        });
        return result ?? null;
    }

    async getByUserIdAndToken(
        db: Queryable,
        user_id: UUID,
        token: string
    ): Promise<VerificationTokenRow | null> {
        const result = await queryOne<VerificationTokenRow>(
            db,
            `SELECT ${VERIFICATION_TOKEN_COLUMNS} FROM verification_tokens WHERE user_id = $1 AND token = $2`,
            [user_id, token]
        );
        return result ?? null;
    }

    async getByUserId(
        db: Queryable,
        user_id: UUID
    ): Promise<VerificationTokenRow | null> {
        const result = await queryOne<VerificationTokenRow>(
            db,
            `SELECT ${VERIFICATION_TOKEN_COLUMNS} FROM verification_tokens WHERE user_id = $1`,
            [user_id]
        );
        log.debug({
            action: "get by id",
            id: user_id,
            msg: result ? "successful": "not found"
        });
        return result ?? null;
    }

    async getAll(
        db: Queryable,
        page: number,
        pageSize: number
    ): Promise<PaginatedResult<VerificationTokenRow>>{
        const offset = (page - 1) * pageSize;
        const limitClause = pageSize > 0 ? `LIMIT ${pageSize}` : '';
        const offsetClause = page > 0 ? `OFFSET ${offset}` : '';

        const totalRow = await queryOne<{ total: number }>(
            db,
            `SELECT COUNT(*) AS total FROM verification_tokens`
        );

        const rows = await queryRows<VerificationTokenRow>(
            db,
            `SELECT ${VERIFICATION_TOKEN_COLUMNS} FROM verification_tokens ORDER BY created_at DESC ${limitClause} ${offsetClause}`,
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
            action: "get all verification tokens",
            page: page,
            pageSize: pageSize,
            data_count: result.total,
            msg: "success"
        });

        return result;
    }
}