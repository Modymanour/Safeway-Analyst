import { type Request, type Response } from "express";
import { UserStatsService } from "../services/user_visits_stats.service";
import { userVisitCreateSchema, userVisitUpdateSchema, userVisitFilter } from "../schemas";
import { logger, logError, logZodError, slowLog, logInfo } from "../lib/loggers/logger";
import { ControllerErrorHelper } from "../lib/controller.helper";
import { UUID } from "node:crypto";
import { performance } from "node:perf_hooks";

const log = logger.child({
    component: "user_visit_controller"
})


//  ---    USER VISIT CONTROLLER    ---
// Any request that belongs to the safeway static page will pass through here to save to the database
// The controller has 6 functions: create, update, delete, search, getbyId getall
// Currently create, search, getall are only done since the others will not be of use
// The http_request interface will get returned from the service without url & time_taken_ms
// They will be given values inside the controller functions
export class UserVisitController{
    constructor(
        private readonly uservisitService = new UserStatsService()
    ) {}

    
    // ---    CREATE    ---
    // parses the req.body using userVisitCreateSchema which is in /schemas/index.ts
    // logs through the way if any error happens or slow request detected
    // id must be parsed to UUID since zod returns it as string
    create = async(
        req: Request,
        res: Response
    ): Promise<Response> => {
        const start = performance.now();

        const parse = userVisitCreateSchema.safeParse(req.body);
        
        if(!parse.success){
            logZodError(log, parse, "create_user_visit", req, res);
            return ControllerErrorHelper.handle(parse.error, req, res, log, {
                body: req.body,
                method: req.method,
                path: req.originalUrl,
            });
        }
        
        const input = {
            ...parse.data,
            id: parse.data.id as UUID
        }
        
        try{
            const data = await this.uservisitService.create(input);
            data.url = req.originalUrl;
            data.time_taken_ms = performance.now() - start;
            if(data.time_taken_ms > 1000){
                slowLog(log, data, "create_user_event", req, res);
            }
            else{
                logInfo(log, data, "create_user_event", req);
            }
            return res.status(201).json(data);
        } catch (err){
            logError(log, err, "create_user_visit", req);
            return ControllerErrorHelper.handle(err, req, res, log, {
                body: req.body,
                method: req.method,
                path: req.originalUrl,
            });
        }
    }

    // ---    Search    ---
    // parses the req.body using userVisitFilter which is in /schemas/index.ts
    // page & pageNumber must be extracted from query variables
    // logs through the way if any error happens or slow request detected
    search = async(
        req: Request,
        res: Response
    ): Promise<Response> => {
        const start = performance.now();

        const parse = userVisitFilter.safeParse(req.query);
        if(!parse.success){
            logZodError(log, parse, "search_user_visits", req, res);
            return ControllerErrorHelper.handle(parse.error, req, res, log, {
                body: req.body,
                method: req.method,
                path: req.originalUrl,
            });
        }

        const page = Number(req.query.page ?? 1);
        const pageNumber = Number(req.query.pageNumber ?? 10);

        const input = {
            ...parse.data
        };

        try{
            const data = await this.uservisitService.search(parse.data, page, pageNumber);
            data.url = req.originalUrl;
            data.time_taken_ms = performance.now() - start;
            if(data.time_taken_ms > 1000){
                slowLog(log, data, "create_user_event", req, res);
            }
            else{
                logInfo(log, data, "create_user_event", req);
            }
            return res.status(201).json(data);
        } catch (err){
            logError(log, err, "create_user_event", req);
            return ControllerErrorHelper.handle(err, req, res, log, {
                body: req.body,
                method: req.method,
                path: req.originalUrl,
            });
        }
    }

    // ---    Get All    ---
    // page & pageNumber must be extracted from query variables
    // logs through the way if any error happens or slow request detected
    getAll = async(
        req: Request,
        res: Response
    ): Promise<Response> => {
        const start = performance.now();

        const page = Number(req.query.page ?? 1);
        const pageNumber = Number(req.query.pageNumber ?? 10);

        try{
            const data = await this.uservisitService.getAll(page, pageNumber);
            data.url = req.originalUrl;
            data.time_taken_ms = performance.now() - start;
            if(data.time_taken_ms > 1000){
                slowLog(log, data, "get_all_user_visit", req, res);
            }
            else{
                logInfo(log, data, "get_all_user_visit", req);
            }
            return res.status(200).json(data);
        } catch (err){
            logError(log, err, "get_all_user_visit", req);
            return ControllerErrorHelper.handle(err, req, res, log, {
                body: req.body,
                method: req.method,
                path: req.originalUrl,
            });
        }
    }
}