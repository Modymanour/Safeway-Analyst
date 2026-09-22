import { UUID } from "crypto";
import { Queryable, query, queryOne, queryRows } from "../db/pool.ts";
import { PaginatedResult } from"./types.ts";

export interface PasswordTokenRow{
    id: UUID,
    user_id: UUID,
    token: string,
    expires_at: Date,
    created_at: Date,
    updated_at: Date
};

const PASSWORD_TOKEN_COLUMNS=`
    id, user_id, token, expires_at, created_at, updated_at`;

export class PasswordTokenRepository{
    constructor () {}
    async create(
        db: Queryable,
        input:{
            user_id: UUID,
            token: string,
            expires_at: Date,
        }
    ): Promise<PasswordTokenRow>{
        const result = await queryOne<PasswordTokenRow>(
            db,
            `INSERT INTO password_reset_tokens (${PASSWORD_TOKEN_COLUMNS})
             VALUES (gen_random_uuid(), $1, $2, $3, now(), now())
             RETURNING ${PASSWORD_TOKEN_COLUMNS}`,
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
            token: string,
            expires_at: Date
        }
    ): Promise<PasswordTokenRow | null>{
        const result = await queryOne<PasswordTokenRow>(
            db,
            `UPDATE password_reset_tokens SET
             token          = COALESCE($1, token),
             expires_at     = COALESCE($2, expires_at)
             WHERE id = $3
             RETURNING ${PASSWORD_TOKEN_COLUMNS}`,
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
            `DELETE FROM password_reset_tokens WHERE id = $1`,
            [id]
        );
    }
    async getById(
        db: Queryable,
        id: UUID
    ): Promise<PasswordTokenRow | null> {
        const result = await queryOne<PasswordTokenRow>(
            db,
            `SELECT ${PASSWORD_TOKEN_COLUMNS} FROM password_reset_tokens WHERE id = $1`,
            [id]
        );
        return result ?? null;
    }
    async getByToken(
        db: Queryable,
        token: string
    ): Promise<PasswordTokenRow | null> {
        const result = await queryOne<PasswordTokenRow>(
            db,
            `SELECT ${PASSWORD_TOKEN_COLUMNS} FROM password_reset_tokens WHERE token = $1`,
            [token]
        );
        return result ?? null;
    }

    async getByUserId(
        db: Queryable,
        user_id: UUID
    ): Promise<PasswordTokenRow | null> {
        const result = await queryOne<PasswordTokenRow>(
            db,
            `SELECT ${PASSWORD_TOKEN_COLUMNS} FROM password_reset_tokens WHERE user_id = $1`,
            [user_id]
        );
        return result ?? null;
    }
}