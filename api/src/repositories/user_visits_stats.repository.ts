import { UUID } from "crypto";
import { Queryable, query, queryOne, queryRows } from "../db/pool.ts";
import {PaginatedResult} from"./types.ts";
;
export interface UserVisitStatsRow{
    id: UUID,
    email_click: boolean,
    whatsapp_click: boolean,
    phone_click: boolean,
    time_on_page: number,
    device_type: string,
    traffic_source: string,
    location: string,
    created_at: Date,
};

const USER_VISIT_STATS_COLUMNS = `
    id, email_click, whatsapp_click, phone_click, time_on_page, device_type, traffic_source, location, created_at`;

export class UserVisitsStatsRepository {
    async create(
        db: Queryable,
        input:{
            email_click: boolean,
            whatsapp_click: boolean,
            phone_click: boolean,
            time_on_page: number,
            device_type: string,
            traffic_source: string,
            location: string,
        }
    ): Promise<UserVisitStatsRow>{
        const result = await queryOne<UserVisitStatsRow>(
            db,
            `INSERT INTO user_visits_stats (${USER_VISIT_STATS_COLUMNS})
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, now())
            RETURNING ${USER_VISIT_STATS_COLUMNS}`,
            [
                input.email_click,
                input.whatsapp_click,
                input.phone_click,
                input.time_on_page,
                input.device_type,
                input.traffic_source,
                input.location
            ]
        );
        return result!;
    }

    async update(
        db: Queryable,
        id: UUID,
        input:{
            email_click?: boolean | null,
            whatsapp_click?: boolean | null,
            phone_click?: boolean | null,
            time_on_page?: number | null,
            device_type?: string | null,
            traffic_source?: string | null,
            location?: string | null,
        }
    ): Promise<UserVisitStatsRow>{
        const result = await queryOne<UserVisitStatsRow>(
            db,
            `UPDATE user_visits_stats SET
             email_click    =       COALESCE($1, email_click),
             whatsapp_click =       COALESCE($2, whatsapp_click),
             phone_click    =       COALESCE($3, phone_click),
             time_on_page   =       COALESCE($4, time_on_page),
             device_type    =       COALESCE($5, device_type),
             traffic_source =       COALESCE($6, traffic_source),
             location       =       COALESCE($7, location)
             WHERE id = $8
             RETURNING ${USER_VISIT_STATS_COLUMNS}`,
            [
                input.email_click ?? null,
                input.whatsapp_click ?? null,
                input.phone_click ?? null,
                input.time_on_page ?? null,
                input.device_type ?? null,
                input.traffic_source ?? null,
                input.location ?? null,
                id
            ]
        );
        return result!;
    }
    async delete(
        db: Queryable,
        id: UUID
    ): Promise<void>{
        await query(
            db,
            `DELETE FROM user_visits_stats WHERE id = $1`,
            [id]
        );
    }
    async getById(
        db: Queryable,
        id: UUID
    ): Promise<UserVisitStatsRow | null>{
        const result = await queryOne<UserVisitStatsRow>(
            db,
            `SELECT ${USER_VISIT_STATS_COLUMNS} FROM user_visits_stats WHERE id = $1`,
            [id]
        );
        return result ?? null;
    }
    //Search function with filters
    // -- How to use it:
    // 8 different filters can be applied and it all depens on what is given.
    // If a filter is not given, it will be skipped.
    // When it comes to the pagination:
    // - page: the page number to retrieve (1-based index)
    // - pageSize: the number of records per page
    // - if page is 0, it will return the first pageSize of the data.
    // - if pageSize is 0, it will return all records without limit.
    async search(
        db: Queryable,
        filters: {
            email_click?: boolean,
            whatsapp_click?: boolean,
            phone_click?: boolean,
            device_type?: string,
            traffic_source?: string,
            location?: string,
            start_date?: Date,
            end_date?: Date
        },
        page: number,
        pageSize: number
    ): Promise<PaginatedResult<UserVisitStatsRow>>{
        const conditions: string[] = [];
        const values: unknown[] = [];
        let index = 1;

        if (filters.email_click !== undefined) {
            conditions.push(`email_click = $${index++}`);
            values.push(filters.email_click);
        }
        if (filters.whatsapp_click !== undefined) {
            conditions.push(`whatsapp_click = $${index++}`);
            values.push(filters.whatsapp_click);
        }
        if (filters.phone_click !== undefined) {
            conditions.push(`phone_click = $${index++}`);
            values.push(filters.phone_click);
        }
        if (filters.device_type) {
            conditions.push(`device_type = $${index++}`);
            values.push(filters.device_type);
        }
        if (filters.traffic_source) {
            conditions.push(`traffic_source = $${index++}`);
            values.push(filters.traffic_source);
        }
        if (filters.location) {
            conditions.push(`location = $${index++}`);
            values.push(filters.location);
        }
        if (filters.start_date) {
            conditions.push(`created_at >= $${index++}`);
            values.push(filters.start_date);
        }
        if (filters.end_date) {
            conditions.push(`created_at <= $${index++}`);
            values.push(filters.end_date);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const totalRow = await queryOne<{ total: number }>(
            db,
            `SELECT COUNT(*) AS total FROM user_visits_stats ${whereClause}`,
            values
        );

        let limitClause, offsetClause;
        if(pageSize > 0){
            limitClause = `LIMIT $${index++}`;
            values.push(pageSize);
        } else {
            limitClause = '';
        }

        if(page > 0 && pageSize > 0){
            offsetClause = `OFFSET $${index++}`;
            values.push((page - 1) * pageSize);
        } else {
            offsetClause = '';
        }
        values.forEach((value, i) => console.log(`$${i + 1}: ${value}`));
        const rows = await queryRows<UserVisitStatsRow>(
            db,
            `SELECT ${USER_VISIT_STATS_COLUMNS} FROM user_visits_stats ${whereClause} ORDER BY created_at DESC ${limitClause} ${offsetClause}`,
            values
        );
        const total = totalRow?.total ?? 0;
        const totalPages = Math.ceil(total / (pageSize));
        const result: PaginatedResult<UserVisitStatsRow> = {
            data: rows,
            page : page ?? 1,
            pageSize : pageSize ?? total,
            total,
            totalPages
        };
        return result;
    }

    async getAll(
        db: Queryable,
        page: number,
        pageSize: number
    ): Promise<PaginatedResult<UserVisitStatsRow>>{
        const totalRow = await queryOne<{ total: number }>(
            db,
            `SELECT COUNT(*) AS total FROM user_visits_stats`
        );
        const rows = await queryRows<UserVisitStatsRow>(
            db,
            `SELECT ${USER_VISIT_STATS_COLUMNS} FROM user_visits_stats ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
            [pageSize, (page - 1) * pageSize]
        );
        const total = totalRow?.total ?? 0;
        const totalPages = Math.ceil(total / pageSize);
        const result: PaginatedResult<UserVisitStatsRow> = {
            data: rows,
            page,
            pageSize,
            total,
            totalPages
        };
        return result;
    }
}