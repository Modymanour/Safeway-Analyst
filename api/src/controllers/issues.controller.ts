import { type Request, type Response } from "express";
import * as schema from "../schemas";
import { logger, logError, logZodError, slowLog, logInfo } from "../lib/loggers/logger";
import { ControllerErrorHelper } from "../lib/controller.helper";
import { performance } from "node:perf_hooks";
import { ValidationError } from "../lib/errors/errors";
import { UUID } from "node:crypto";
import { IssueService } from "../services/issue.service";

const log = logger.child({
    component: "issues_controller"
});

const requestId = (req: Request): string | undefined => {
    const id = req.params.id ?? req.query.id;
    return typeof id === "string" ? id : undefined;
};

export class IssuesController{
    constructor(
        private readonly issuesService = new IssueService()
    ) {}

    // Category controller functions
    // 6 functions: create, update, delete, find_by_name & get_all
    // creating, updating and deleting will be only authorized for admins
    // while getting data will be accessed by everybody
    create_category = async(
        req: Request,
        res: Response
    ): Promise<Response> => {
        const start = performance.now();

        try{
            const parse = schema.createCategory.safeParse(req.body);
            if (!parse.success) {
                logZodError(log, parse.error, "create_category", req, res);
                return ControllerErrorHelper.handle(parse.error, req, res, log, {
                    body: req.body, method: req.method, path: req.originalUrl,
                });
            }
            const data = await this.issuesService.create_category(parse.data);
            data.url = req.originalUrl,
            data.time_taken_ms = performance.now() - start;
            if(data.time_taken_ms > 1000){
                slowLog(log, data, "create_category", req, res);
            }
            else{
                logInfo(log, data, "create_category", req);
            }
            return res.status(data.status_code ?? 201).json(data);
        }catch(err){
            logError(log, err, "create_category", req);
            return ControllerErrorHelper.handle(err, req, res, log, {
                body: req.body, method: req.method, path: req.originalUrl,
            });
        }
    }

    update_category = async(
        req: Request,
        res: Response
    ): Promise<Response> => {
        const start = performance.now();

        try{
            const id = requestId(req);
            if (!id) {
                logError(log, new ValidationError("Misisng id"), "update_categroy", req);
                return ControllerErrorHelper.handle(new ValidationError("Misisng data"), req, res, log, {
                    body: req.body,
                    method: req.method,
                    path: req.originalUrl,
                });
            }

            const parse = await schema.updateCategory.safeParse(req.body);
            if (!parse.success) {
                logZodError(log, parse.error, "update_category", req, res);
                return ControllerErrorHelper.handle(parse.error, req, res, log, {
                    body: req.body, method: req.method, path: req.originalUrl,
                });
            }
            const data = await this.issuesService.update_category(id as UUID, parse.data);
            data.url = req.originalUrl,
            data.time_taken_ms = performance.now() - start;
            if(data.time_taken_ms > 1000){
                slowLog(log, data, "update_category", req, res);
            }
            else{
                logInfo(log, data, "update_category", req);
            }
            return res.status(data.status_code ?? 201).json(data);
        }catch(err){
            logError(log, err, "update_category", req);
            return ControllerErrorHelper.handle(err, req, res, log, {
                body: req.body, method: req.method, path: req.originalUrl,
            });
        }
    }
    delete_category = async(
        req: Request,
        res: Response
    ): Promise<Response> => {
        const start = performance.now();

        try{
            const id = requestId(req);
            if (!id) {
                logError(log, new ValidationError("Misisng id"), "delete_categroy", req);
                return ControllerErrorHelper.handle(new ValidationError("Misisng data"), req, res, log, {
                    body: req.body,
                    method: req.method,
                    path: req.originalUrl,
                });
            }
            const data = await this.issuesService.delete_category(id as UUID);
            data.url = req.originalUrl,
            data.time_taken_ms = performance.now() - start;
            if(data.time_taken_ms > 1000){
                slowLog(log, data, "delete_category", req, res);
            }
            else{
                logInfo(log, data, "delete_category", req);
            }
            return res.status(data.status_code ?? 201).json(data);
        }catch(err){
            logError(log, err, "delete_category", req);
            return ControllerErrorHelper.handle(err, req, res, log, {
                body: req.body, method: req.method, path: req.originalUrl,
            });
        }
    }
    
    get_category_by_name = async(
        req: Request,
        res: Response
    ): Promise<Response> => {
        const start = performance.now();

        try{
            if(!req.query.name){
                logError(log, new ValidationError("Misisng name"), "get_category_by_name", req);
                return ControllerErrorHelper.handle(new ValidationError("Misisng name"), req, res, log, {
                    body: req.body,
                    method: req.method,
                    path: req.originalUrl,
                });
            }
            const data = await this.issuesService.get_category_by_name(req.query.name as string);
            data.url = req.originalUrl,
            data.time_taken_ms = performance.now() - start;
            if(data.time_taken_ms > 1000){
                slowLog(log, data, "get_category_by_name", req, res);
            }
            else{
                logInfo(log, data, "get_category_by_name", req);
            }
            return res.status(data.status_code ?? 200).json(data);
        }catch(err){
            logError(log, err, "get_category_by_name", req);
            return ControllerErrorHelper.handle(err, req, res, log, {
                body: req.body, method: req.method, path: req.originalUrl,
            });
        }
    }

    search_categories = async(
        req: Request,
        res: Response
    ): Promise<Response> => {
        const start = performance.now();

        try{
            const parse = await schema.searchCategories.safeParse(req.body);
            if (!parse.success) {
                logZodError(log, parse.error, "search_categories", req, res);
                return ControllerErrorHelper.handle(parse.error, req, res, log, {
                    body: req.body, method: req.method, path: req.originalUrl,
                });
            }
            const { start_date, end_date, pageNumber, ...filters } = parse.data;
            const data = await this.issuesService.search_categories({
                ...filters,
                start_date,
                end_date,
                pageSize: pageNumber,
            });
            data.url = req.originalUrl,
            data.time_taken_ms = performance.now() - start;
            if(data.time_taken_ms > 1000){
                slowLog(log, data, "search_categories", req, res);
            }
            else{
                logInfo(log, data, "search_categories", req);
            }
            return res.status(data.status_code ?? 200).json(data);
        }catch(err){
            logError(log, err, "search_categories", req);
            return ControllerErrorHelper.handle(err, req, res, log, {
                body: req.body, method: req.method, path: req.originalUrl,
            });
        }
    }

    get_all_categories = async(
        req: Request,
        res: Response
    ): Promise<Response> => {
        const start = performance.now();

        const page = Number(req.query.page ?? 1);
        const pageNumber = Number(req.query.pageNumber ?? 10);
        try{
            const data = await this.issuesService.get_all_categories(page, pageNumber);
            data.url = req.originalUrl;
            data.time_taken_ms = performance.now() - start;
            if(data.time_taken_ms > 1000){
                slowLog(log, data, "get_categories", req, res);
            }
            else{
                logInfo(log, data, "get_categories", req);
            }
            return res.status(200).json(data);
        } catch (err){
            logError(log, err, "get_categories", req);
            return ControllerErrorHelper.handle(err, req, res, log, {
                body: req.body,
                method: req.method,
                path: req.originalUrl,
            });
        }
    }

    // Issues controller functions
    // 6 functions: create, update, delete, find_by_name & get_all
    // all functions will be open for users and admins, but extra authorization will be made for
    // update and delete in to determine whether the data belongs to the user.
    // In the case of an admin, they will by pass this authorization and execute the endpoint
    create_issue = async(
        req: Request,
        res: Response
    ): Promise<Response> => {
        const start = performance.now();

        try{
            if(!req.user?.sub){
                logError(log, new ValidationError("Misisng id"), "create_issue", req);
                return ControllerErrorHelper.handle(new ValidationError("Misisng id"), req, res, log, {
                    body: req.body,
                    method: req.method,
                    path: req.originalUrl,
                });
            }

            const user_id = req.user.sub as UUID

            const parse = schema.createIssue.safeParse(req.body);
            if (!parse.success) {
                logZodError(log, parse.error, "create_issue", req, res);
                return ControllerErrorHelper.handle(parse.error, req, res, log, {
                    body: req.body, method: req.method, path: req.originalUrl,
                });
            }
            const parse_data = {
                ...parse.data,
                category_id: parse.data.category_id as UUID
            };

            const data = await this.issuesService.create_issue(user_id, parse_data);
            data.url = req.originalUrl,
            data.time_taken_ms = performance.now() - start;
            if(data.time_taken_ms > 1000){
                slowLog(log, data, "create_issue", req, res);
            }
            else{
                logInfo(log, data, "create_issue", req);
            }
            return res.status(data.status_code ?? 200).json(data);
        }catch(err){
            logError(log, err, "create_issue", req);
            return ControllerErrorHelper.handle(err, req, res, log, {
                body: req.body, method: req.method, path: req.originalUrl,
            });
        }
    }

    update_issue = async(
        req: Request,
        res: Response
    ): Promise<Response> => {
        const start = performance.now();

        try{
            const issueId = requestId(req);
            if(!req.user?.sub || !issueId){
                logError(log, new ValidationError("Misisng id(s)"), "update_issue", req);
                return ControllerErrorHelper.handle(new ValidationError("Misisng id"), req, res, log, {
                    body: req.body,
                    method: req.method,
                    path: req.originalUrl,
                });
            }

            const user_id = req.user.sub as UUID;

            const id = issueId as UUID;

            const role = req.user.role as 'user' | 'admin';

            const parse = schema.updateIssue.safeParse(req.body);
            if (!parse.success) {
                logZodError(log, parse.error, "update_issue", req, res);
                return ControllerErrorHelper.handle(parse.error, req, res, log, {
                    body: req.body, method: req.method, path: req.originalUrl,
                });
            }
            const parse_data = {
                ...parse.data,
                category_id: parse.data.category_id as UUID
            };

            const data = await this.issuesService.update_issue(user_id, role, id, parse_data);
            data.url = req.originalUrl,
            data.time_taken_ms = performance.now() - start;
            if(data.time_taken_ms > 1000){
                slowLog(log, data, "update_issue", req, res);
            }
            else{
                logInfo(log, data, "update_issue", req);
            }
            return res.status(data.status_code ?? 200).json(data);
        }catch(err){
            logError(log, err, "update_issue", req);
            return ControllerErrorHelper.handle(err, req, res, log, {
                body: req.body, method: req.method, path: req.originalUrl,
            });
        }
    }

    delete_issue = async(
        req: Request,
        res: Response
    ): Promise<Response> => {
        const start = performance.now();

        try{
            const issueId = requestId(req);
            if(!req.user?.sub || !issueId){
                logError(log, new ValidationError("Misisng id(s)"), "delete_issue", req);
                return ControllerErrorHelper.handle(new ValidationError("Misisng id"), req, res, log, {
                    body: req.body,
                    method: req.method,
                    path: req.originalUrl,
                });
            }

            const user_id = req.user.sub as UUID;

            const id = issueId as UUID;

            const role = req.user.role as 'user' | 'admin';

            const data = await this.issuesService.delete_issue(user_id, role, id);
            data.url = req.originalUrl,
            data.time_taken_ms = performance.now() - start;
            if(data.time_taken_ms > 1000){
                slowLog(log, data, "delete_issue", req, res);
            }
            else{
                logInfo(log, data, "delete_issue", req);
            }
            return res.status(data.status_code ?? 200).json(data);
        }catch(err){
            logError(log, err, "delete_issue", req);
            return ControllerErrorHelper.handle(err, req, res, log, {
                body: req.body, method: req.method, path: req.originalUrl,
            });
        }
    }

    get_issue_by_id = async(
        req: Request,
        res: Response
    ): Promise<Response> => {
        const start = performance.now();

        try{
            const issueId = requestId(req);
            if(!issueId){
                logError(log, new ValidationError("Misisng id"), "get_issue_by_id", req);
                return ControllerErrorHelper.handle(new ValidationError("Misisng id"), req, res, log, {
                    body: req.body,
                    method: req.method,
                    path: req.originalUrl,
                });
            }

            const id = issueId as UUID;

            const data = await this.issuesService.get_issue_by_id(id);
            data.url = req.originalUrl,
            data.time_taken_ms = performance.now() - start;
            if(data.time_taken_ms > 1000){
                slowLog(log, data, "get_issue_by_id", req, res);
            }
            else{
                logInfo(log, data, "get_issue_by_id", req);
            }
            return res.status(data.status_code ?? 200).json(data);
        }catch(err){
            logError(log, err, "get_issue_by_id", req);
            return ControllerErrorHelper.handle(err, req, res, log, {
                body: req.body, method: req.method, path: req.originalUrl,
            });
        }
    }

    search_issues = async(
        req: Request,
        res: Response
    ): Promise<Response> => {
        const start = performance.now();

        try{

            const parse = schema.searchIssues.safeParse(req.body);
            if (!parse.success) {
                logZodError(log, parse.error, "search_issues", req, res);
                return ControllerErrorHelper.handle(parse.error, req, res, log, {
                    body: req.body, method: req.method, path: req.originalUrl,
                });
            }
            const { start_date, end_date, pageNumber, ...filters } = parse.data;
            const endedAt = end_date ? new Date(end_date) : null;
            endedAt?.setUTCHours(23, 59, 59, 999);
            const parse_data = {
                ...filters,
                created_by: filters.created_by as UUID | null,
                category_id: filters.category_id as UUID | null,
                started_at: start_date,
                ended_at: endedAt,
                pageSize: pageNumber,
            };

            const data = await this.issuesService.search_issues(parse_data);
            data.url = req.originalUrl,
            data.time_taken_ms = performance.now() - start;
            if(data.time_taken_ms > 1000){
                slowLog(log, data, "search_issues", req, res);
            }
            else{
                logInfo(log, data, "search_issues", req);
            }
            return res.status(data.status_code ?? 200).json(data);
        }catch(err){
            logError(log, err, "search_issues", req);
            return ControllerErrorHelper.handle(err, req, res, log, {
                body: req.body, method: req.method, path: req.originalUrl,
            });
        }
    }

    get_all_issues = async(
        req: Request,
        res: Response
    ): Promise<Response> => {
        const start = performance.now();

        const page = Number(req.query.page ?? 1);
        const pageNumber = Number(req.query.pageNumber ?? 10);
        try{
            const data = await this.issuesService.get_all_issues(page, pageNumber);
            data.url = req.originalUrl;
            data.time_taken_ms = performance.now() - start;
            if(data.time_taken_ms > 1000){
                slowLog(log, data, "get_all_issues", req, res);
            }
            else{
                logInfo(log, data, "get_all_issues", req);
            }
            return res.status(200).json(data);
        } catch (err){
            logError(log, err, "get_all_issues", req);
            return ControllerErrorHelper.handle(err, req, res, log, {
                body: req.body,
                method: req.method,
                path: req.originalUrl,
            });
        }
    }

    // Issues Comments controller functions
    // 6 functions: create, update, delete, find_by_name & get_all
    // all functions will be open for users and admins, but extra authorization will be made for
    // update and delete in to determine whether the data belongs to the user.
    // In the case of an admin, they will by pass this authorization and execute the endpoint
    create_issue_comment = async(
        req: Request,
        res: Response
    ): Promise<Response> => {
        const start = performance.now();

        try{
            if(!req.user?.sub){
                logError(log, new ValidationError("Misisng id"), "create_issue_comment", req);
                return ControllerErrorHelper.handle(new ValidationError("Misisng id"), req, res, log, {
                    body: req.body,
                    method: req.method,
                    path: req.originalUrl,
                });
            };

            const user_id = req.user.sub as UUID;

            const parse = schema.createIssueComment.safeParse(req.body);
            if (!parse.success) {
                logZodError(log, parse.error, "create_issue_comment", req, res);
                return ControllerErrorHelper.handle(parse.error, req, res, log, {
                    body: req.body, method: req.method, path: req.originalUrl,
                });
            };

            const parse_data = {
                ...parse.data,
                issue_id: parse.data.issue_id as UUID
            };

            const data = await this.issuesService.create_comment(user_id, parse_data);
            data.url = req.originalUrl,
            data.time_taken_ms = performance.now() - start;
            if(data.time_taken_ms > 1000){
                slowLog(log, data, "create_issue_comment", req, res);
            }
            else{
                logInfo(log, data, "create_issue_comment", req);
            }
            return res.status(data.status_code ?? 200).json(data);
        }catch(err){
            logError(log, err, "create_issue_comment", req);
            return ControllerErrorHelper.handle(err, req, res, log, {
                body: req.body, method: req.method, path: req.originalUrl,
            });
        }
    }
    update_issue_comment = async(
        req: Request,
        res: Response
    ): Promise<Response> => {
        const start = performance.now();

        try{
            if(!req.user?.sub || !req.user.role){
                logError(log, new ValidationError("Misisng data in json webtoken"), "update_issue_comment", req);
                return ControllerErrorHelper.handle(new ValidationError("Misisng data"), req, res, log, {
                    body: req.body,
                    method: req.method,
                    path: req.originalUrl,
                });
            };

            const user_id = req.user.sub as UUID;

            const role = req.user.role as 'user' | 'admin';

            const parse = schema.updateIssueComment.safeParse(req.body);
            if (!parse.success) {
                logZodError(log, parse.error, "update_issue_comment", req, res);
                return ControllerErrorHelper.handle(parse.error, req, res, log, {
                    body: req.body, method: req.method, path: req.originalUrl,
                });
            };

            const parse_data = {
                ...parse.data,
                comment_id: (requestId(req) ?? parse.data.comment_id) as UUID
            };

            const data = await this.issuesService.update_comment(user_id, role, parse_data);
            data.url = req.originalUrl,
            data.time_taken_ms = performance.now() - start;
            if(data.time_taken_ms > 1000){
                slowLog(log, data, "update_issue_comment", req, res);
            }
            else{
                logInfo(log, data, "update_issue_comment", req);
            }
            return res.status(data.status_code ?? 200).json(data);
        }catch(err){
            logError(log, err, "update_issue_comment", req);
            return ControllerErrorHelper.handle(err, req, res, log, {
                body: req.body, method: req.method, path: req.originalUrl,
            });
        }
    }
    delete_issue_comment = async(
        req: Request,
        res: Response
    ): Promise<Response> => {
        const start = performance.now();

        try{
            const commentId = requestId(req);
            if(!req.user?.sub || !req.user.role || !commentId){
                logError(log, new ValidationError("Misisng data in json webtoken"), "delete_issue_comment", req);
                return ControllerErrorHelper.handle(new ValidationError("Misisng data"), req, res, log, {
                    body: req.body,
                    method: req.method,
                    path: req.originalUrl,
                });
            };

            const user_id = req.user.sub as UUID;

            const role = req.user.role as 'user' | 'admin';

            const id = commentId as UUID;

            const data = await this.issuesService.delete_comment(user_id, role, id);
            data.url = req.originalUrl,
            data.time_taken_ms = performance.now() - start;
            if(data.time_taken_ms > 1000){
                slowLog(log, data, "delete_issue_comment", req, res);
            }
            else{
                logInfo(log, data, "delete_issue_comment", req);
            }
            return res.status(data.status_code ?? 200).json(data);
        }catch(err){
            logError(log, err, "delete_issue_comment", req);
            return ControllerErrorHelper.handle(err, req, res, log, {
                body: req.body, method: req.method, path: req.originalUrl,
            });
        }
    }
    get_issue_comment_by_id = async(
        req: Request,
        res: Response
    ): Promise<Response> => {
        const start = performance.now();

        try{
            const commentId = requestId(req);
            if(!commentId){
                logError(log, new ValidationError("Misisng id"), "get_issue_comment_by_id", req);
                return ControllerErrorHelper.handle(new ValidationError("Misisng data"), req, res, log, {
                    body: req.body,
                    method: req.method,
                    path: req.originalUrl,
                });
            };

            const id = commentId as UUID;

            const data = await this.issuesService.get_comment_by_id(id);
            data.url = req.originalUrl,
            data.time_taken_ms = performance.now() - start;
            if(data.time_taken_ms > 1000){
                slowLog(log, data, "get_issue_comment_by_id", req, res);
            }
            else{
                logInfo(log, data, "get_issue_comment_by_id", req);
            }
            return res.status(data.status_code ?? 200).json(data);
        }catch(err){
            logError(log, err, "get_issue_comment_by_id", req);
            return ControllerErrorHelper.handle(err, req, res, log, {
                body: req.body, method: req.method, path: req.originalUrl,
            });
        }
    }
    search_comments = async(
        req: Request,
        res: Response
    ): Promise<Response> => {
        const start = performance.now();

        try{
            const parse = schema.searchIssuesComments.safeParse(req.body);
            if (!parse.success) {
                logZodError(log, parse.error, "search_comments", req, res);
                return ControllerErrorHelper.handle(parse.error, req, res, log, {
                    body: req.body, method: req.method, path: req.originalUrl,
                });
            }
            const { start_date, end_date, pageNumber, ...filters } = parse.data;
            const parse_data = {
                ...filters,
                issue_id: filters.issue_id as UUID | null,
                author_id: filters.author_id as UUID | null,
                started_at: start_date,
                ended_at: end_date,
                pageSize: pageNumber,
            };

            const data = await this.issuesService.search_comments(parse_data);
            data.url = req.originalUrl,
            data.time_taken_ms = performance.now() - start;
            if(data.time_taken_ms > 1000){
                slowLog(log, data, "search_comments", req, res);
            }
            else{
                logInfo(log, data, "search_comments", req);
            }
            return res.status(data.status_code ?? 200).json(data);
        }catch(err){
            logError(log, err, "search_comments", req);
            return ControllerErrorHelper.handle(err, req, res, log, {
                body: req.body, method: req.method, path: req.originalUrl,
            });
        }
    }
    get_all_issues_comments = async(
        req: Request,
        res: Response
    ): Promise<Response> => {
        const start = performance.now();

        const page = Number(req.query.page ?? 1);
        const pageNumber = Number(req.query.pageNumber ?? 10);
        try{
            const data = await this.issuesService.get_all_comments(page, pageNumber);
            data.url = req.originalUrl;
            data.time_taken_ms = performance.now() - start;
            if(data.time_taken_ms > 1000){
                slowLog(log, data, "get_all_comments", req, res);
            }
            else{
                logInfo(log, data, "get_all_comments", req);
            }
            return res.status(200).json(data);
        } catch (err){
            logError(log, err, "get_all_comments", req);
            return ControllerErrorHelper.handle(err, req, res, log, {
                body: req.body,
                method: req.method,
                path: req.originalUrl,
            });
        }
    }
}