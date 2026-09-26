import type { UUID } from 'node:crypto';
import { pool, type Queryable } from '../db/pool.ts';
import { UserVisitsStatsRepository, type UserVisitStatsRow } from '../repositories/user_visits_stats.repository.ts';
import { NotFoundError,ValidationError } from '../lib/errors/errors.ts';
import { Http_Response} from '../lib/responses.ts';
import { logger } from '../lib/loggers/logger.ts';
import { PaginatedResult } from '../repositories/types.ts';

const log = logger.child({
    component: "user_stats_service"
});

export class UserStatsService{
    constructor(
        private readonly userVisistsRepo = new UserVisitsStatsRepository(),
        private readonly db: Queryable = pool
    ) {}

    async create(
        input:{
            id: UUID,
            email_click: boolean,
            whatsapp_click: boolean,
            phone_click: boolean,
            time_on_page: number,
            device_type: string,
            traffic_source: string,
            location: string,
        },
    ): Promise<Http_Response<UserVisitStatsRow>>{
        const row = await this.userVisistsRepo.create(this.db, input);

        if(!row){
            throw new ValidationError("user visit could not be created");
        }

        const response: Http_Response<UserVisitStatsRow> = {
            status: "Successfull",
            status_code: 201,
            data: row,
            msg: "Successful creation",
            request_id: null,
            url: null,
            time_taken_ms: null
        };

        log.info({
            action: "create",
            msg: response.msg,
            data: row,
        }, "Successful");

        return response;
    }
    async update(
        id: UUID,
        input:{
            email_click?: boolean | null,
            whatsapp_click?: boolean | null,
            phone_click?: boolean | null,
            time_on_page?: number | null,
            device_type?: string | null,
            traffic_source?: string | null,
            location?: string | null,
        },
    ): Promise<Http_Response<UserVisitStatsRow>>{
        const isRowReal = await this.userVisistsRepo.getById(this.db, id);

        if(!isRowReal){
            throw new NotFoundError("user visit could not be found");
        }

        const row = await this.userVisistsRepo.update(this.db, id, input);

        if(!row){
            throw new ValidationError("user visit could not be updated");
        }

        const response: Http_Response<UserVisitStatsRow> = {
            status: "Successfull",
            status_code: 200,
            data: row,
            msg: "Successful update",
            request_id: null,
            url: null,
            time_taken_ms: null
        };

        log.info({
            action: "update",
            msg: response.msg,
            data: row,
        }, "Successful");


        return response;
    }
    async delete(
        id: UUID
    ): Promise<Http_Response<null>>{
        await this.userVisistsRepo.delete(this.db, id);

        const response: Http_Response<null> = {
            status: "Successfull",
            status_code: 204,
            data: null,
            msg: "Successful deletion",
            request_id: null,
            url: null,
            time_taken_ms: null
        };

        log.info({
            action: "delete",
            msg: response.msg,
            data: null,
        }, "Successful");

        return response;
    }
    async getById(
        id: UUID
    ): Promise<Http_Response<UserVisitStatsRow>>{
        const row = await this.userVisistsRepo.getById(this.db, id);

        if(!row){
            throw new NotFoundError("user visit not found");
        }
        
        const response: Http_Response<UserVisitStatsRow> = {
            status: "Successfull",
            status_code: 200,
            data: row,
            msg: "Successful get by Id",
            request_id: null,
            url: null,
            time_taken_ms: null
        };
        return response;
    }
    async search(
        filters:{
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
    ): Promise<Http_Response<PaginatedResult<UserVisitStatsRow>>>{
        const data = await this.userVisistsRepo.search(this.db, filters, page, pageSize);

        const response: Http_Response<PaginatedResult<UserVisitStatsRow>> = {
            status: "Successfull",
            status_code: 200,
            data: data,
            msg: "search completed",
            request_id: null,
            url: null,
            time_taken_ms: null
        };

        log.info({
            action: "create",
            msg: response.msg,
            data_count: data.total,
        }, "Successful");

        return response;
    }
    async getAll(
        page: number,
        pageSize: number
    ): Promise<Http_Response<PaginatedResult<UserVisitStatsRow>>>{
        const data = await this.userVisistsRepo.getAll(this.db, page, pageSize);

        const response: Http_Response<PaginatedResult<UserVisitStatsRow>> = {
            status: "Successfull",
            status_code: 201,
            data: data,
            msg: "Successful get all operation",
            request_id: null,
            url: null,
            time_taken_ms: null
        };

        log.info({
            action: "create",
            msg: response.msg,
            data_count: data.total,
        }, "Successful");


        return response;
    }
}