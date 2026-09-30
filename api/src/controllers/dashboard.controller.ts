import { type Request, type Response } from "express";
import { DashboardService } from "../services/dashboard.service.ts"
import { specificMonthsSchema, searchUsersSchema} from "../schemas";
import { logger, logError, logZodError, slowLog, logInfo } from "../lib/loggers/logger";
import { ControllerErrorHelper } from "../lib/controller.helper";
import { performance } from "node:perf_hooks";
import { ValidationError } from "../lib/errors/errors";

const log = logger.child({
    component: "dashboard_controller"
});

export class DashboardController{
    constructor(
        private readonly dashboardService = new DashboardService()
    ) {}

    getCurrentYearData = async(
        req: Request,
        res: Response
    ): Promise<Response> => {
        const start = performance.now();

        try{
            const data = await this.dashboardService.getCurrentYearData();
            data.url = req.originalUrl;
            data.time_taken_ms = performance.now() - start;
            if(data.time_taken_ms > 1000){
                slowLog(log, data, "get_current_year_data", req, res);
            }
            else{
                logInfo(log, data, "get_current_year_data", req);
            }
            return res.status(200).json(data);
        } catch (err){
            logError(log, err, "get_current_year_data", req);
            return ControllerErrorHelper.handle(err, req, res, log, {
                body: req.body,
                method: req.method,
                path: req.originalUrl,
            });
        }
    }

    getCurrentMonthData = async(
        req: Request,
        res: Response
    ): Promise<Response> => {
        const start = performance.now();

        try{
            const data = await this.dashboardService.getCurrentMonthData();
            data.url = req.originalUrl;
            data.time_taken_ms = performance.now() - start;
            if(data.time_taken_ms > 1000){
                slowLog(log, data, "get_current_month_data", req, res);
            }
            else{
                logInfo(log, data, "get_current_month_data", req);
            }
            return res.status(200).json(data);
        } catch (err){
            logError(log, err, "get_current_month_data", req);
            return ControllerErrorHelper.handle(err, req, res, log, {
                body: req.body,
                method: req.method,
                path: req.originalUrl,
            });
        }
    }

    getCustomMonthData = async(
        req: Request,
        res: Response
    ): Promise<Response> => {
        const start = performance.now();

        if(!req.query.year || !req.query.month_number){
            logError(log, new ValidationError("Misisng year or month_number data"), "get_custom_month_data", req);
            return ControllerErrorHelper.handle(new ValidationError("Misisng year or month_number data"), req, res, log, {
                body: req.body,
                method: req.method,
                path: req.originalUrl,
            });
        }
        const year = Number(req.query.year);
        const month_number = Number(req.query.month_number);
        try{
            const data = await this.dashboardService.getCustomMonthData(year, month_number);
            data.url = req.originalUrl;
            data.time_taken_ms = performance.now() - start;
            if(data.time_taken_ms > 1000){
                slowLog(log, data, "get_custom_month_data", req, res);
            }
            else{
                logInfo(log, data, "get_custom_month_data", req);
            }
            return res.status(200).json(data);
        } catch (err){
            logError(log, err, "get_custom_month_data", req);
            return ControllerErrorHelper.handle(err, req, res, log, {
                body: req.body,
                method: req.method,
                path: req.originalUrl,
            });
        }
    }

    getCustomMonthRangeData = async(
        req: Request,
        res: Response
    ): Promise<Response> => {
        const start = performance.now();

        if(!req.query.start_year || !req.query.start_month || !req.query.end_year || !req.query.end_month){
            logError(log, new ValidationError("Misisng month and year data"), "get_custom_month_range_data", req);
            return ControllerErrorHelper.handle(new ValidationError("Misisng month and year data"), req, res, log, {
                body: req.body,
                method: req.method,
                path: req.originalUrl,
            });
        }
        const start_year = Number(req.query.start_year);
        const start_month = Number(req.query.start_month);
        const end_year = Number(req.query.end_year);
        const end_month = Number(req.query.end_month);
        try{
            const data = await this.dashboardService.getCustomMonthRangeData(start_year, start_month, end_year, end_month);
            data.url = req.originalUrl;
            data.time_taken_ms = performance.now() - start;
            if(data.time_taken_ms > 1000){
                slowLog(log, data, "get_custom_month_range_data", req, res);
            }
            else{
                logInfo(log, data, "get_custom_month_range_data", req);
            }
            return res.status(200).json(data);
        } catch (err){
            logError(log, err, "get_custom_month_range_data", req);
            return ControllerErrorHelper.handle(err, req, res, log, {
                body: req.body,
                method: req.method,
                path: req.originalUrl,
            });
        }
    }

    getSpecificMonthsData = async(
        req: Request,
        res: Response
    ): Promise<Response> => {
        const start = performance.now();

        let months: unknown;
        try {
            if (typeof req.query.months !== "string") {
                throw new Error("Missing months query parameter");
            }
            months = JSON.parse(req.query.months);
        } catch {
            const error = new ValidationError("Missing or invalid months query parameter");
            logError(log, error, "get_specific_months_data", req);
            return ControllerErrorHelper.handle(error, req, res, log, {
                body: req.body,
                method: req.method,
                path: req.originalUrl,
            });
        }

        const parse = specificMonthsSchema.safeParse(months);
        
        if(!parse.success){
            logZodError(log, parse, "get_specific_months_data", req, res);
            return ControllerErrorHelper.handle(parse.error, req, res, log, {
                body: req.body,
                method: req.method,
                path: req.originalUrl,
            });
        }
        try{
            const data = await this.dashboardService.getSpecificMonthsData(parse.data);
            data.url = req.originalUrl;
            data.time_taken_ms = performance.now() - start;
            if(data.time_taken_ms > 1000){
                slowLog(log, data, "get_custom_month_range_data", req, res);
            }
            else{
                logInfo(log, data, "get_custom_month_range_data", req);
            }
            return res.status(200).json(data);
        } catch (err){
            logError(log, err, "get_custom_month_range_data", req);
            return ControllerErrorHelper.handle(err, req, res, log, {
                body: req.body,
                method: req.method,
                path: req.originalUrl,
            });
        }
    }

    searchUsers = async(
        req: Request,
        res: Response
    ): Promise<Response> => {
        const start = performance.now();

        const parse = searchUsersSchema.safeParse(req.query);
        
        if(!parse.success){
            logZodError(log, parse, "search_user", req, res);
            return ControllerErrorHelper.handle(parse.error, req, res, log, {
                body: req.body,
                method: req.method,
                path: req.originalUrl,
            });
        }

        const { page, pageNumber, ...input} = parse.data
        try{
            const data = await this.dashboardService.searchUsers(input, page, pageNumber);
            data.url = req.originalUrl;
            data.time_taken_ms = performance.now() - start;
            if(data.time_taken_ms > 1000){
                slowLog(log, data, "search_user", req, res);
            }
            else{
                logInfo(log, data, "search_user", req);
            }
            return res.status(200).json(data);
        } catch (err){
            logError(log, err, "search_user", req);
            return ControllerErrorHelper.handle(err, req, res, log, {
                body: req.body,
                method: req.method,
                path: req.originalUrl,
            });
        }
    }

    getUsers = async(
        req: Request,
        res: Response
    ): Promise<Response> => {
        const start = performance.now();

        const page = Number(req.query.page ?? 1);
        const pageNumber = Number(req.query.pageNumber ?? 10);
        try{
            const data = await this.dashboardService.getUsers(page, pageNumber);
            data.url = req.originalUrl;
            data.time_taken_ms = performance.now() - start;
            if(data.time_taken_ms > 1000){
                slowLog(log, data, "get_all_users", req, res);
            }
            else{
                logInfo(log, data, "get_all_users", req);
            }
            return res.status(200).json(data);
        } catch (err){
            logError(log, err, "get_all_users", req);
            return ControllerErrorHelper.handle(err, req, res, log, {
                body: req.body,
                method: req.method,
                path: req.originalUrl,
            });
        }
    }

}