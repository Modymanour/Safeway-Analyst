import { pool, type Queryable } from '../db/pool.ts';
import { UserVisitsStatsRepository, type UserVisitStatsData, type UserVisitStatsRow } from '../repositories/user_visits_stats.repository.ts';
import { NotFoundError,ValidationError } from '../lib/errors/errors.ts';
import { Http_Response} from '../lib/responses.ts';
import { UserRepository, UserRow } from '../repositories/user.repository.ts';
import { logger } from '../lib/loggers/logger.ts';
import { PaginatedResult } from '../repositories/types.ts';
import { getCurrentMonthRange, getCurrentYearRange, dateRange, getCustomMonthRange } from '../lib/date.helper.ts';

const log = logger.child({
    component: "dashboard_service"
});

export interface MonthData{
    month_name: string,
    month_number: number
    data: UserVisitStatsData,
    start_date: Date,
    end_date: Date
}

export interface MonthsComparison{
    months: Array<MonthData>
    start_date: Date,
    end_date: Date
}

type DashboardUser = Omit<UserRow, "password">;

function withoutPassword(user: UserRow): DashboardUser {
    const { password: _password, ...publicUser } = user;
    return publicUser;
}

function toMonthData(data: UserVisitStatsData): MonthData {
    return {
        month_name: data.date_start.toLocaleString("en-US", { month: "long" }),
        month_number: data.date_start.getMonth() + 1,
        data,
        start_date: data.date_start,
        end_date: data.date_end,
    };
}

function isValidMonth(year: number, month: number): boolean {
    return Number.isInteger(year) && Number.isInteger(month) && month >= 1 && month <= 12;
}

export class DashboardService{
    constructor(
        private readonly userRepo = new UserRepository(),
        private readonly userVisistsRepo = new UserVisitsStatsRepository(),
        private readonly db: Queryable = pool
    ) {}

    // Gets current year data:
    // Generally used to immedietly fill the dashboard with the year data for visualizations
    // Has the following steps:
    // 1 - get the dates for the current months of the year
    // 2 - get the data for each month &  project them into month data
    // 3 - project the data unto the monthsCompariso
    // 4 - return http_response
    // 5 - log the data
    async getCurrentYearData(

    ): Promise<Http_Response<MonthsComparison>>{
        //1
        const year_range = getCurrentYearRange();
        const months = dateRange(year_range.start, year_range.end);
        const months_data: Array<MonthData> = [];
        //2
        for (let i = 0; i < months.length - 1; i++) {
            const data = await this.userVisistsRepo.getDashboardData(this.db, months[i], months[i + 1]);
            months_data.push(toMonthData(data));
        }
        //3
        const months_comparison: MonthsComparison = {
            start_date: year_range.start,
            end_date: year_range.end,
            months: months_data
        } 
        //4
        const response: Http_Response<MonthsComparison> = {
            status: "Successful",
            status_code: 200,
            data: months_comparison,
            request_id: null,
            msg: "Current year data retrieved successfully",
            url: null,
            time_taken_ms: null,
        }
        //5
        log.info({
            action: "get_current_year_range_data",
            msg: "Successful month range returned",
            status: "Successful",
            // response: response,
            start_date: year_range.start,
            end_Date: year_range.end
        })
        return response
    }

    // Get current month data:
    // Get the data for the current month and is used to fill the main upper windows of the dashboard
    // Has the following steps:
    // 1 - get the dates for the current month
    // 2 - get the data the month
    // 3 - project them onto the monthData
    // 4 - return http_response
    // 5 - log the data
    async getCurrentMonthData(

    ):  Promise<Http_Response<MonthData>>{
        //1
        const month_range = getCurrentMonthRange();
        //2
        const data = await this.userVisistsRepo.getDashboardData(this.db, month_range.start, month_range.end)

        //3
        const month_data = {
            month_name: data.date_start.toLocaleString('default', { month: 'long' }),
            month_number: data.date_start.getMonth(),
            data: data,
            start_date: data.date_start,
            end_date: data.date_end
        }
        //4
        const response: Http_Response<MonthData> = {
            status: "Successful",
            status_code: 200,
            data: month_data,
            request_id: null,
            msg: "Current month data retrieved successfully",
            url: null,
            time_taken_ms: null,
        }
        //5
        log.info({
            action: "get_current_month_data",
            msg: "Successful month range returned",
            status: "Success",
            // response: response,
            start_date: month_data.start_date,
            end_Date: month_data.end_date
        })
        return response
    }

    // Get CUSTOM month data:
    // Get the data for the given month
    // Has the following steps:
    // 1 - check for given data validity
    // 2 - get the dates for the given month
    // 3 - get the data the month
    // 4 - project them onto the monthData
    // 5 - return http_response
    // 6 - log the data
    async getCustomMonthData(
        year: number,
        month_number: number
    ): Promise<Http_Response<MonthData>>{
        //1
        if (!isValidMonth(year, month_number)) {
            log.error({
                action: "get_custom_month_data",
                msg: `Invalid month number given; year: ${year}, month_number: ${month_number}`,
                status: "Validation_Error",
            })
            throw new ValidationError("Invalid month Number given");
        }

        //2
        const range = {
            start_date: new Date(year, month_number - 1, 1),
            end_date: new Date(year, month_number, 1),
        };

        //3
        const data = await this.userVisistsRepo.getDashboardData(this.db, range.start_date, range.end_date);

        //4
        const month_data = toMonthData(data);

        //5
        const response: Http_Response<MonthData> = {
            status: "Successful",
            status_code: 200,
            data: month_data,
            request_id: null,
            msg: "Current month data retrieved successfully",
            url: null,
            time_taken_ms: null,
        }

        //6
        log.info({
            action: "get_custom_month_data",
            msg: "Successful month data returned",
            // response: response,
            start_date: range.start_date,
            end_Date: range.end_date
        })
        return response;
    }

    // Get custom month range data:
    // Get the data for given custom month range (for example january - may)
    // Has the following steps:
    // 1 - check data validity
    // 2 - get the dates for the custom month ranges
    // 3 - get the data the months & project them to monthsData
    // 4 - project them onto the monthsComparison
    // 5 - return http_response
    // 6 - log the data
    async getCustomMonthRangeData(
        start_year: number,
        start_month: number,
        end_year: number,
        end_month: number
    ): Promise<Http_Response<MonthsComparison>>{
        //1
        if (!isValidMonth(start_year, start_month)
            || !isValidMonth(end_year, end_month)
            || start_year > end_year
            || (start_year === end_year && start_month > end_month)) {
            log.error({
                action: "get_custom_month_range_data",
                msg: `Invalid data given; start_year: ${start_year}, start_month: ${start_month}, end_year: ${end_year}, end_month: ${end_month}`,
                status: "Validation_Error",
            })
            throw new ValidationError("Invalid month Number data given");
        }
        //2
        const range = getCustomMonthRange(start_year, start_month, end_year, end_month);

        const months = dateRange(range.start_date, range.end_date);

        //3
        const months_data: Array<MonthData> = []
        for (let i = 0; i < months.length - 1; i++) {
            const data = await this.userVisistsRepo.getDashboardData(this.db, months[i], months[i + 1]);
            months_data.push(toMonthData(data));
        }

        //5
        const months_comparison: MonthsComparison = {
            start_date: range.start_date,
            end_date: range.end_date,
            months: months_data
        } 

        //6
        const response: Http_Response<MonthsComparison> = {
            status: "Successful",
            status_code: 200,
            data: months_comparison,
            request_id: null,
            msg: "Custom month range data retrieved successfully",
            url: null,
            time_taken_ms: null,
        }

        //7
        log.info({
            action: "get_custom_month_range_data",
            msg: "Successful month range returned",
            status: "Successful",
            // response: response,
            start_date: range.start_date,
            end_Date: range.end_date
        })
        return response;
    }

    // Get specific months data:
    // Get the data specific given months (2025 january - 2026 january)
    // Has the following steps:
    // 1 - get the dates for the given months while checking data validity
    // 2 - get the data the months
    // 3 - project them onto the monthData
    // 4 - project them onto the monthsComparison
    // 5 - return http_response
    // 6 - log the data
    async getSpecificMonthsData(
        months_numbers: Array<{
            year: number,
            month_number: number
        }>
    ): Promise<Http_Response<MonthsComparison>>{
        //1
        if (months_numbers.length === 0) {
            log.error({
                action: "get_specific_month_data",
                msg: `Empty month query variables`,
                status: "Validation_Error",
            })
            throw new ValidationError("No months specified");
        }

        for (const month of months_numbers) {
            if (!isValidMonth(month.year, month.month_number)) {
                log.error({
                    action: "get_specific_month_data",
                    msg: `Invalid month number given; year: ${month.year}, month_number: ${month.month_number}`,
                    status: "Validation_Error",
                })
                throw new ValidationError("Month number must be between 1 and 12");
            }
        }

        const sortedMonths = [...months_numbers].sort((a, b) =>
            a.year - b.year || a.month_number - b.month_number,
        );
        const dates = sortedMonths.map(({ year, month_number }) => ({
            start_date: new Date(year, month_number - 1, 1),
            end_date: new Date(year, month_number, 1),
        }));

        //2
        const data: Array<UserVisitStatsData> = [];
        for (const range of dates) {
            data.push(await this.userVisistsRepo.getDashboardData(this.db, range.start_date, range.end_date));
        }

        //3
        const months_data = data.map(toMonthData);

        //4
        const months_comparison: MonthsComparison = {
            start_date: dates[0].start_date,
            end_date: dates[dates.length - 1].end_date,
            months: months_data
        } 

        //5
        const response: Http_Response<MonthsComparison> = {
            status: "Successful",
            status_code: 200,
            data: months_comparison,
            request_id: null,
            msg: "Custom month range data retrieved successfully",
            url: null,
            time_taken_ms: null,
        }
        //6
        log.info({
            action: "get_custom_month_range_data",
            msg: "Successful month range returned",
            response: response,
            start_date: dates[0].start_date,
            end_date: dates[dates.length - 1].end_date,
        })
        return response;
    }
    // Search Users:
    // Get users based on filters
    // Filters are: { username, email, role}
    // pageSize define the amount of data returned, and page define the certain page of the data
    // on the case that both page & pageSize are null, it will return all the data
    async searchUsers(
        filters: {
            username: string | null,
            email: string | null,
            role: string | null,
        },
        page: number,
        pageSize: number
    ): Promise<Http_Response<PaginatedResult<DashboardUser>>>{
        const result = await this.userRepo.search(this.db, filters, page, pageSize);
        const data = { ...result, data: result.data.map(withoutPassword) };

        const response: Http_Response<PaginatedResult<DashboardUser>> = {
            status: "Successful",
            status_code: 200,
            data: data,
            request_id: null,
            msg: "Users search retrieved successfully",
            url: null,
            time_taken_ms: null,
        }
        log.info({
            action: "search_users",
            msg: "Successful returned users",
            status: "Successful",
            response: response,
        })
        return response;
    }

    // Get Users:
    // Get all users with page & pageSize
    async getUsers(
        page: number,
        pageSize: number
    ): Promise<Http_Response<PaginatedResult<DashboardUser>>>{
        const result = await this.userRepo.getAll(this.db, page, pageSize);
        const data = { ...result, data: result.data.map(withoutPassword) };

        const response: Http_Response<PaginatedResult<DashboardUser>> = {
            status: "Successful",
            status_code: 200,
            data: data,
            request_id: null,
            msg: "Users retrieved successfully",
            url: null,
            time_taken_ms: null,
        }
        log.info({
            action: "get_users",
            msg: "Successful returned users",
            status: "Successful",
            response: response,
        })
        return response;
    }
}