import { UUID } from 'crypto';
import { pool, type Queryable } from '../db/pool.ts';
import { IssuesRepository, IssuesRow, IssueStatus } from '../repositories/issues.repository.ts';
import { IssuesCommentsRepository, IssuesCommentsRow } from '../repositories/issues_comments.repository.ts';
import { CategoriesRepository, CategoryRow } from '../repositories/categories.repository.ts';
import { UserRepository } from '../repositories/user.repository.ts';
import { Http_Response} from '../lib/responses.ts';
import { logger } from '../lib/loggers/logger.ts';
import { ForbiddenError, NotFoundError, ValidationError } from '../lib/errors/errors.ts';
import { PaginatedResult } from '../repositories/types.ts';

const log = logger.child({
    component: "issue_service"
});

export class IssueService{
    constructor(
        private readonly issueRepo = new IssuesRepository(),
        private readonly userRepo = new UserRepository(),
        private readonly issueCommentsRepo = new IssuesCommentsRepository(),
        private readonly categoriesRepo = new CategoriesRepository(),
        private readonly db: Queryable = pool
    ) {}
    // Categories
    // -----
    // All the functions that pretains to the setting and getting of 
    // the categories which we define issues with
    // -----
    // Authorization:
    // Since they can only be created,edited or deleted by admins
    // there will be no need to pass any parameters for extra authorization
    // such as user_id and entity user_id
    // -----
    async create_category(
        input: {
            slug: string,
            name: string,
            color: string,
            description: string
        }
    ): Promise<Http_Response<CategoryRow>>{
        const row = await this.categoriesRepo.create(this.db, input);

        if(!row){
            throw new ValidationError("Category could not be created");
        }

        const response: Http_Response<CategoryRow> = {
            status: "Successful",
            status_code: 201,
            data: row,
            request_id: null,
            msg: "Category created successfully",
            url: null,
            time_taken_ms: null,
        };
        log.info({
            action: "create_category",
            msg: "Category created successfully",
            status: "Successful",
            name: input.name
            // response: response,
        });
        return response;
    }
    async update_category(
        id: UUID,
        input: {
            slug?: string | null,
            name?: string | null,
            color?: string | null,
            description?: string | null
        }
    ): Promise<Http_Response<CategoryRow>>{
        const isRowReal = await this.categoriesRepo.getById(this.db, id);

        if(!isRowReal){
            throw new NotFoundError("Category, to be updated, not found");
        }

        const row = await this.categoriesRepo.update(this.db, id, input);

        if(!row){
            throw new ValidationError("Category could not be updated");
        }

        const response: Http_Response<CategoryRow> = {
            status: "Successful",
            status_code: 200,
            data: row,
            request_id: null,
            msg: "Category updated successfully",
            url: null,
            time_taken_ms: null,
        };

        log.info({
            action: "updated_category",
            msg: "Category updated successfully",
            status: "Successful",
            input: input
            // response: response,
        });
        return response;
    }
    async delete_category(
        id: UUID
    ): Promise<Http_Response<void>>{
        const category = await this.categoriesRepo.getById(this.db, id);
        if (!category) {
            throw new NotFoundError("Category not found");
        }

        await this.categoriesRepo.delete(this.db, id);
        const response: Http_Response<null> = {
            status: "Successful",
            status_code: 200,
            data: null,
            request_id: null,
            msg: "Category deleted successfully",
            url: null,
            time_taken_ms: null,
        };

        log.info({
            action: "deleted_category",
            msg: "Category deleted successfully",
            status: "Successful",
            id: id
            // response: response,
        });
        return response;
    }
    async get_category_by_name(
        name: string
    ): Promise<Http_Response<CategoryRow>>{
        if(typeof name !== "string" || name.trim() === ""){
            throw new ValidationError("Invalid name given");
        }
        const row = await this.categoriesRepo.getByName(this.db, name.trim());

        if(!row){
            throw new NotFoundError("Category not found")
        }
        const response: Http_Response<CategoryRow> = {
            status: "Successful",
            status_code: 200,
            data: row,
            request_id: null,
            msg: "Category found successfully",
            url: null,
            time_taken_ms: null,
        };

        log.info({
            action: "get_category_by_name",
            msg: "Category found successfully",
            status: "Successful",
            name: name
            // response: response,
        });
        return response;
    }
    async search_categories(
        filters: {
            slug?: string | null,
            name?: string | null,
            color?: string | null,
            description?: string | null,
            start_date?: Date | null,
            end_date?: Date | null,
            page?: number | null,
            pageSize?: number | null
        }
    ): Promise<Http_Response<PaginatedResult<CategoryRow>>>{
        const data = await this.categoriesRepo.search(this.db, filters);

        const response: Http_Response<PaginatedResult<CategoryRow>> = {
            status: "Successful",
            status_code: 200,
            data: data,
            request_id: null,
            msg: "Category searched successfully",
            url: null,
            time_taken_ms: null,
        }
        log.info({
            action: "search_categories",
            msg: "Category searched successfully",
            status: "Successful",
            filters: filters
            // response: response,
        });
        return response;
    }
    async get_all_categories(
        page: number,
        pageSize: number
    ): Promise<Http_Response<PaginatedResult<CategoryRow>>>{
        const data = await this.categoriesRepo.getAll(this.db, page, pageSize);
        
        const response: Http_Response<PaginatedResult<CategoryRow>> = {
            status: "Successful",
            status_code: 200,
            data: data,
            msg: "Successful get all operation",
            request_id: null,
            url: null,
            time_taken_ms: null
        };

        log.info({
            action: "get_all_categories",
            msg: response.msg,
            data_count: data.total,
        }, "Successful");

        return response;
    }
    
    // Issues
    // -----
    // All the functions for creating issues 
    // -----
    // Authorization:
    // Since the data to be changed can be changed by either the creator
    // of it or the admin, additional parameters will be passed to perform
    // extra authorization 
    // -----
    async create_issue(
        user_id: UUID,
        input: {
            title: string,
            description: string,
            category_id:UUID,
            status: IssueStatus,
            priority: number,
        }
    ): Promise<Http_Response<IssuesRow>>{
        const created_by = await this.userRepo.getById(this.db, user_id);

        if(!created_by){
            throw new NotFoundError("Creator of the issue is not found");
        }

        const category = await this.categoriesRepo.getById(this.db, input.category_id);

        if(!category){
            throw new NotFoundError("Category for the issue was not found");
        }

        const row = await this.issueRepo.create(this.db, { ...input, created_by: user_id });

        if(!row){
            throw new ValidationError("Issue could not be created");
        }

        const response: Http_Response<IssuesRow> = {
            status: "Successful",
            status_code: 201,
            data: row,
            request_id: null,
            msg: "Issue created successfully",
            url: null,
            time_taken_ms: null,
        }
        log.info({
            action: "create_issue",
            msg: "Issue created successfully",
            status: "Successful",
            title: input.title,
            created_by: created_by.username,
            category: category.name
            // response: response,
        });
        return response;

    }
    async update_issue(
        user_id: UUID,
        role: 'user' | 'admin',
        id: UUID,
        input: {
            title?: string | null,
            description?: string | null,
            category_id?: UUID | null,
            status?: IssueStatus | null,
            priority?: number | null,
        }
    ): Promise<Http_Response<IssuesRow>>{
        const user = await this.userRepo.getById(this.db, user_id);
        
        if(!user){
            throw new NotFoundError("Creator of the issue is not found");
        }

        const issue = await this.issueRepo.getById(this.db, id);

        if(!issue){
            throw new NotFoundError("Issue was not found");
        }

        if(user.id !== issue.created_by && role != 'admin'){
            throw new ForbiddenError("You are not authorized for this action");
        }

        const row = await this.issueRepo.update(this.db, id, input);

        if(!row){
            throw new ValidationError("Issue could not be updated");
        }

        const response: Http_Response<IssuesRow> = {
            status: "Successful",
            status_code: 200,
            data: row,
            request_id: null,
            msg: "Issue updated successfully",
            url: null,
            time_taken_ms: null,
        }
        log.info({
            action: "update_issue",
            msg: "Issue updated successfully",
            status: "Successful",
            title: input.title,
            actor: user.username,
            // response: response,
        });
        return response;
    }
    async delete_issue(
        user_id: UUID,
        role: 'user' | 'admin',
        id: UUID,
    ): Promise<Http_Response<void>>{
        const user = await this.userRepo.getById(this.db, user_id);

        if(!user){
            throw new NotFoundError("Creator of the issue is not found");
        }

        const issue = await this.issueRepo.getById(this.db, id);

        if(!issue){
            throw new NotFoundError("Issue was not found");
        }

        if(user.id !== issue.created_by && role != 'admin'){
            throw new ForbiddenError("You are not authorized for this action");
        }

        await this.issueRepo.delete(this.db, id);

        const response: Http_Response<void> = {
            status: "Successful",
            status_code: 200,
            data: null,
            request_id: null,
            msg: "Issue deleted successfully",
            url: null,
            time_taken_ms: null,
        }
        log.info({
            action: "delete_issue",
            msg: "Issue deleted successfully",
            status: "Successful",
            title: issue.title,
            actor: user.username,
            // response: response,
        });
        return response;
    }
    async get_issue_by_id(
        id: UUID
    ): Promise<Http_Response<IssuesRow>>{
        const row = await this.issueRepo.getById(this.db, id);

        if(!row){
            throw new NotFoundError("Issue not found");
        }
        const response: Http_Response<IssuesRow> = {
            status: "Successful",
            status_code: 200,
            data: row,
            request_id: null,
            msg: "Issue returned successfully",
            url: null,
            time_taken_ms: null,
        }
        log.info({
            action: "get_issue_by_id",
            msg: "Issue returned successfully",
            status: "Successful",
            title: row.title,
            // response: response,
        });
        return response;

    }
    async search_issues(
        filters: {
            title?: string | null,
            description?: string | null,
            created_by?: UUID | null,
            category_id?: UUID | null,
            status?: IssueStatus | null,
            priority?: number | null,
            started_at?: Date | null,
            ended_at?: Date | null,
            page?: number | null,
            pageSize?: number | null
        }
    ): Promise<Http_Response<PaginatedResult<IssuesRow>>>{
        const data = await this.issueRepo.search(this.db, filters);

        const response: Http_Response<PaginatedResult<IssuesRow>> = {
            status: "Successful",
            status_code: 200,
            data: data,
            request_id: null,
            msg: "Issue returned successfully",
            url: null,
            time_taken_ms: null,
        }
        log.info({
            action: "search_issues",
            msg: "Issues searched successfully",
            status: "Successful",
            // response: response,
        });
        return response;
    }
    async get_all_issues(
        page: number,
        pageSize: number
    ): Promise<Http_Response<PaginatedResult<IssuesRow>>>{
        const data = await this.issueRepo.getAll(this.db, page, pageSize);

        const response: Http_Response<PaginatedResult<IssuesRow>> = {
            status: "Successful",
            status_code: 200,
            data: data,
            request_id: null,
            msg: "Issues returned successfully",
            url: null,
            time_taken_ms: null,
        }
        log.info({
            action: "get_all_issues",
            msg: "Issues searched successfully",
            status: "Successful",
            // response: response,
        });
        return response;
    }

    // Issues Comments
    // -----
    // All the functions for creating issue comments 
    // -----
    // Authorization:
    // 
    async create_comment(
        author_id: UUID,
        input: {
            issue_id: UUID,
            body: string,
        }
    ): Promise<Http_Response<IssuesCommentsRow>>{
        const user = await this.userRepo.getById(this.db, author_id);
        
        if(!user){
            throw new NotFoundError("Author of the comment is not found");
        }

        const issue = await this.issueRepo.getById(this.db, input.issue_id);

        if(!issue){
            throw new NotFoundError("Issue was not found");
        }

        const row = await this.issueCommentsRepo.create(this.db, { ...input, author_id });
        if (!row) {
            throw new ValidationError("Comment could not be created");
        }
        const response: Http_Response<IssuesCommentsRow> = {
            status: "Successful",
            status_code: 201,
            data: row,
            request_id: null,
            msg: "Comment created successfully",
            url: null,
            time_taken_ms: null,
        }
        log.info({
            action: "create_comment",
            msg: "Comment created successfully",
            status: "Successful",
            // response: response,
        });
        return response;
    }
    async update_comment(
        author_id: UUID,
        role: 'user' | 'admin',
        input: {
            comment_id: UUID,
            body: string,
        }
    ): Promise<Http_Response<IssuesCommentsRow>>{
        const user = await this.userRepo.getById(this.db, author_id);
        
        if(!user){
            throw new NotFoundError("Author of the comment is not found");
        }

        const comment = await this.issueCommentsRepo.getById(this.db, input.comment_id);

        if(!comment){
            throw new NotFoundError("Comment was not found");
        }

        if(user.id !== comment.author_id && role !== "admin"){
            throw new ForbiddenError("You are not authorized for this action")
        }

        const row = await this.issueCommentsRepo.update(this.db, input.comment_id, { body: input.body });
        if (!row) {
            throw new ValidationError("Comment could not be updated");
        }

        const response: Http_Response<IssuesCommentsRow> = {
            status: "Successful",
            status_code: 200,
            data: row,
            request_id: null,
            msg: "Comment updated successfully",
            url: null,
            time_taken_ms: null,
        }
        log.info({
            action: "update_comment",
            msg: "Comment updated successfully",
            status: "Successful",
            // response: response,
        });
        return response;
    }
    async delete_comment(
        author_id: UUID,
        role: 'user' | 'admin',
        id: UUID
    ): Promise<Http_Response<null>>{
        const user = await this.userRepo.getById(this.db, author_id);
        
        if(!user){
            throw new NotFoundError("Author of the comment is not found");
        }

        const comment = await this.issueCommentsRepo.getById(this.db, id);

        if(!comment){
            throw new NotFoundError("Comment was not found");
        }

        if(user.id !== comment.author_id && role !== "admin"){
            throw new ForbiddenError("You are not authorized for this action")
        }

        await this.issueCommentsRepo.delete(this.db, id);
         const response: Http_Response<null> = {
            status: "Successful",
            status_code: 200,
            data: null,
            request_id: null,
            msg: "Comment deleted successfully",
            url: null,
            time_taken_ms: null,
        }
        log.info({
            action: "delete_comment",
            msg: "Comment deleted successfully",
            id: id,
            status: "Successful",
            // response: response,
        });
        return response;
    }
    async get_comment_by_id(
        id: UUID
    ): Promise<Http_Response<IssuesCommentsRow>>{
        const row = await this.issueCommentsRepo.getById(this.db, id);

        if(!row){
            throw new NotFoundError("Comment not found");
        }

        const response: Http_Response<IssuesCommentsRow> = {
            status: "Successful",
            status_code: 200,
            data: row,
            request_id: null,
            msg: "Comment returned successfully",
            url: null,
            time_taken_ms: null,
        }
        log.info({
            action: "get_comment_by_id",
            msg: "Comment returned successfully",
            id: id,
            status: "Successful",
            // response: response,
        });
        return response;
    }
    async search_comments(
        filters: {
            issue_id?: UUID | null,
            author_id?: UUID | null,
            body?: string | null,
            edited?: boolean | null,
            started_at?: Date | null,
            ended_at?: Date | null,
            page?: number | null,
            pageSize?: number | null
        }
    ): Promise<Http_Response<PaginatedResult<IssuesCommentsRow>>> {
        const data = await this.issueCommentsRepo.search(this.db, filters);

        const response: Http_Response<PaginatedResult<IssuesCommentsRow>> = {
            status: "Successful",
            status_code: 200,
            data: data,
            request_id: null,
            msg: "Comments returned successfully",
            url: null,
            time_taken_ms: null,
        }
        log.info({
            action: "search_comments",
            msg: "Comments searched successfully",
            status: "Successful",
            // response: response,
        });
        return response;
    }
    async get_all_comments(
        page: number,
        pageSize: number
    ): Promise<Http_Response<PaginatedResult<IssuesCommentsRow>>>{
        const data = await this.issueCommentsRepo.getAll(this.db, page, pageSize);

        const response: Http_Response<PaginatedResult<IssuesCommentsRow>> = {
            status: "Successful",
            status_code: 200,
            data: data,
            request_id: null,
            msg: "Comments returned successfully",
            url: null,
            time_taken_ms: null,
        }
        log.info({
            action: "get_all_comments",
            msg: "Comments searched successfully",
            status: "Successful",
            // response: response,
        });
        return response;
    }
}