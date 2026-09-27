import { UUID } from "crypto";
import { Queryable, query, queryOne, queryRows } from "../db/pool.ts";
import { PaginatedResult } from"./types.ts";
import { logger } from "../lib/loggers/logger.ts";

const log = logger.child({
    component: "user_visit_stats_repository",
})

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

export interface UserVisitStatsData{
    date_start: Date,
    date_end: Date,
    summary: {
        total_visits: number,
        email_clicks: number,
        whatsapp_clicks: number,
        phone_clicks: number,
        total_click_events: number,
        email_click_rate: number,
        whatsapp_click_rate: number,
        phone_click_rate: number,
        average_time_on_page: number,
        median_time_on_page: number
    },
    daily: Array<{
        date: string,
        visits: number,
        email_clicks: number,
        whatsapp_clicks: number,
        phone_clicks: number
    }>,
    device_type: Array<{ device_type: string, visits: number }>,
    traffic_source: Array<{ traffic_source: string, visits: number }>,
    location: Array<{ location: string, visits: number }>
}


const USER_VISIT_STATS_COLUMNS = `
    id, email_click, whatsapp_click, phone_click, time_on_page, device_type, traffic_source, location, created_at`;

export class UserVisitsStatsRepository {
    constructor () {}
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
        log.debug({
            action: "update",
            data: input,
            msg: "success"
        });

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
        log.debug({
            action: "delete",
            id: id,
            msg: "success"
        });
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
        log.debug({
            action: "get by id",
            id: id,
            msg: result ? "successful": "not found"
        });
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
            email_click: boolean | null,
            whatsapp_click: boolean | null,
            phone_click: boolean | null,
            device_type: string | null,
            traffic_source: string | null,
            location: string | null,
            start_date: Date | null,
            end_date: Date | null
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

        log.debug({
            action: "search user visits",
            filters: filters,
            page: page,
            pageNumber: pageSize,
            data_count: result.total,
            msg: "success"
        });
        return result;
    }

    async getDashboardData(
        db: Queryable,
        start_date: Date,
        end_date: Date
    ): Promise<UserVisitStatsData>{
        const result = await queryOne<Omit<UserVisitStatsData, "date_start" | "date_end">>(
            db,
            `WITH filtered AS MATERIALIZED (
                SELECT email_click, whatsapp_click, phone_click, time_on_page,
                       device_type, traffic_source, location, created_at
                FROM user_visits_stats
                WHERE created_at >= $1 AND created_at < $2
            ),
            summary AS (
                SELECT
                    COUNT(*)::int AS total_visits,
                    COUNT(*) FILTER (WHERE email_click)::int AS email_clicks,
                    COUNT(*) FILTER (WHERE whatsapp_click)::int AS whatsapp_clicks,
                    COUNT(*) FILTER (WHERE phone_click)::int AS phone_clicks,
                    (
                        COUNT(*) FILTER (WHERE email_click)
                        + COUNT(*) FILTER (WHERE whatsapp_click)
                        + COUNT(*) FILTER (WHERE phone_click)
                    )::int AS total_click_events,
                    COALESCE(
                        (COUNT(*) FILTER (WHERE email_click) * 100.0 / NULLIF(COUNT(*), 0))::double precision,
                        0
                    ) AS email_click_rate,
                    COALESCE(
                        (COUNT(*) FILTER (WHERE whatsapp_click) * 100.0 / NULLIF(COUNT(*), 0))::double precision,
                        0
                    ) AS whatsapp_click_rate,
                    COALESCE(
                        (COUNT(*) FILTER (WHERE phone_click) * 100.0 / NULLIF(COUNT(*), 0))::double precision,
                        0
                    ) AS phone_click_rate,
                    COALESCE(AVG(time_on_page)::double precision, 0) AS average_time_on_page,
                    COALESCE(
                        percentile_cont(0.5) WITHIN GROUP (ORDER BY time_on_page::double precision),
                        0
                    ) AS median_time_on_page
                FROM filtered
            ),
            daily AS (
                SELECT
                    created_at::date AS visit_date,
                    COUNT(*)::int AS visits,
                    COUNT(*) FILTER (WHERE email_click)::int AS email_clicks,
                    COUNT(*) FILTER (WHERE whatsapp_click)::int AS whatsapp_clicks,
                    COUNT(*) FILTER (WHERE phone_click)::int AS phone_clicks
                FROM filtered
                GROUP BY created_at::date
            ),
            devices AS (
                SELECT device_type, COUNT(*)::int AS visits
                FROM filtered
                GROUP BY device_type
            ),
            sources AS (
                SELECT traffic_source::text AS traffic_source, COUNT(*)::int AS visits
                FROM filtered
                GROUP BY traffic_source
            ),
            locations AS (
                SELECT location, COUNT(*)::int AS visits
                FROM filtered
                GROUP BY location
                ORDER BY visits DESC, location ASC
                LIMIT 10
            )
            SELECT
                jsonb_build_object(
                    'total_visits', summary.total_visits,
                    'email_clicks', summary.email_clicks,
                    'whatsapp_clicks', summary.whatsapp_clicks,
                    'phone_clicks', summary.phone_clicks,
                    'total_click_events', summary.total_click_events,
                    'email_click_rate', summary.email_click_rate,
                    'whatsapp_click_rate', summary.whatsapp_click_rate,
                    'phone_click_rate', summary.phone_click_rate,
                    'average_time_on_page', summary.average_time_on_page,
                    'median_time_on_page', summary.median_time_on_page
                ) AS summary,
                COALESCE(
                    (SELECT jsonb_agg(jsonb_build_object(
                        'date', visit_date,
                        'visits', visits,
                        'email_clicks', email_clicks,
                        'whatsapp_clicks', whatsapp_clicks,
                        'phone_clicks', phone_clicks
                    ) ORDER BY visit_date) FROM daily),
                    '[]'::jsonb
                ) AS daily,
                COALESCE(
                    (SELECT jsonb_agg(jsonb_build_object(
                        'device_type', device_type,
                        'visits', visits
                    ) ORDER BY visits DESC, device_type) FROM devices),
                    '[]'::jsonb
                ) AS device_type,
                COALESCE(
                    (SELECT jsonb_agg(jsonb_build_object(
                        'traffic_source', traffic_source,
                        'visits', visits
                    ) ORDER BY visits DESC, traffic_source) FROM sources),
                    '[]'::jsonb
                ) AS traffic_source,
                COALESCE(
                    (SELECT jsonb_agg(jsonb_build_object(
                        'location', location,
                        'visits', visits
                    ) ORDER BY visits DESC, location) FROM locations),
                    '[]'::jsonb
                ) AS location
            FROM summary`,
            [start_date, end_date]
        );

        const data = {
            date_start: start_date,
            date_end: end_date,
            summary: result!.summary,
            daily: result!.daily,
            device_type: result!.device_type,
            traffic_source: result!.traffic_source,
            location: result!.location,
        } satisfies UserVisitStatsData;

        log.debug({
            action: "get dashboard data",
            date_start: start_date,
            date_end: end_date,
            total_visits: data.summary.total_visits,
        }, "success");

        return data;
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
        log.debug({
            action: "get all user visits",
            page: page,
            pageSize: pageSize,
            data_count: result.total,
            msg: "success"
        });
        return result;
    }
}