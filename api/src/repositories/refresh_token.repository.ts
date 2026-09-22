import { UUID } from "crypto";
import { Queryable, query, queryOne, queryRows } from "../db/pool.ts";
import { PaginatedResult } from"./types.ts";

export interface RefreshTokenRow {
    id: UUID,
    user_id: UUID,
    token: string,
    expires_at: Date,
    created_at: Date,
    updated_at: Date,
}

const REFRESH_TOKEN_COLUMNS = `
    id, user_id, token, expires_at, created_at, updated_at`;

export class RefreshTokenRepository {
    constructor() {}
    async create(
        db: Queryable,
        input:{
            user_id: UUID,
            token: string,
            expires_at: Date,
        }
    ): Promise<RefreshTokenRow>{
        const result = await queryOne<RefreshTokenRow>(
            db,
            `INSERT INTO refresh_tokens (${REFRESH_TOKEN_COLUMNS})
             VALUES (gen_random_uuid(), $1, $2, $3, now(), now())
             RETURNING ${REFRESH_TOKEN_COLUMNS}
            `,
            [
                input.user_id,
                input.token,
                input.expires_at
            ]
        );
        return result!;
    }

    async update(
        db: Queryable,
        id: UUID,
        input:{
            token?: string | null,
            expires_at?: Date | null,
        }
    ): Promise<RefreshTokenRow | null> {
        const result = await queryOne<RefreshTokenRow>(
            db,
            `UPDATE refresh_tokens SET
             token          = COALESCE($1, token),
             expires_at     = COALESCE($2, expires_at)
             WHERE id = $3
             RETURNING ${REFRESH_TOKEN_COLUMNS}`,
             [
                input.token ?? null,
                input.expires_at ?? null,
                id
             ]
        );
        return result ?? null;
    }

    async delete(
        db: Queryable,
        id: UUID
    ): Promise<void> {
        await query(
            db,
            `DELETE FROM refresh_tokens WHERE id = $1`,
            [id]
        );
    }

    async getById(
        db: Queryable,
        id: UUID
    ): Promise<RefreshTokenRow | null> {
        const result = await queryOne<RefreshTokenRow>(
            db,
            `SELECT ${REFRESH_TOKEN_COLUMNS} FROM refresh_tokens WHERE id = $1`,
            [id]
        );
        return result ?? null;
    }

    async getByToken(
        db: Queryable,
        token: string
    ): Promise<RefreshTokenRow | null> {
        const result = await queryOne<RefreshTokenRow>(
            db,
            `SELECT ${REFRESH_TOKEN_COLUMNS} FROM refresh_tokens WHERE token = $1`,
            [token]
        );
        return result ?? null;
    }

    async getByUserId(
        db: Queryable,
        user_id: UUID
    ): Promise<RefreshTokenRow | null> {
        const result = await queryOne<RefreshTokenRow>(
            db,
            `SELECT ${REFRESH_TOKEN_COLUMNS} FROM refresh_tokens WHERE user_id = $1`,
            [user_id]
        );
        return result ?? null;
    }
}