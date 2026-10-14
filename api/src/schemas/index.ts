import { z } from 'zod';

/* -------------------------------------------------------------------------- */
/* AUTH                                                                     */
/* -------------------------------------------------------------------------- */
export const registerSchema = z.object({
    username: z.string(),
    email: z.email().trim().toLowerCase(),
    password: z.string().min(8).max(256),
})

export const verificationTokenRequestSchema = z.object({
    email: z.email().trim().toLowerCase(),
});

export const verificationTokenConfirmSchema = z.object({
    email: z.email().trim().toLowerCase(),
    otp: z.string().regex(/^\d{6}$/, "Verification code must be six digits"),
});

export const passwordTokenRequestSchema = z.object({
    email: z.email().trim().toLowerCase(),
});

export const passwordTokenConfirmSchema = z.object({
    email: z.email().trim().toLowerCase(),
    otp: z.string().regex(/^\d{6}$/, "Reset code must be six digits"),
    new_password: z.string().min(8).max(128),
});


/* -------------------------------------------------------------------------- */
/* User visits                                                                */
/* -------------------------------------------------------------------------- */

export const userVisitCreateSchema = z.object({
    id: z.uuid(),
    email_click: z.boolean(),
    whatsapp_click: z.boolean(),
    phone_click: z.boolean(),
    time_on_page: z.number(),
    device_type: z.string(),
    traffic_source: z.string(),
    location: z.string(),
});

export const userVisitUpdateSchema = z.object({
    email_click: z.boolean().nullable(),
    whatsapp_click: z.boolean().nullable(),
    phone_click: z.boolean().nullable(),
    time_on_page: z.number().nullable(),
    device_type: z.string().nullable(),
    traffic_source: z.string().nullable(),
    location: z.string().nullable(),
});

const nullableBoolean = z
    .enum(["true", "false"])
    .transform(value => value === "true")
    .nullable();

export const userVisitFilter = z.object({
    email_click: nullableBoolean.optional().default(null),
    whatsapp_click: nullableBoolean.optional().default(null),
    phone_click: nullableBoolean.optional().default(null),
    device_type: z.string().nullable().optional().default(null),
    traffic_source: z.string().nullable().optional().default(null),
    location: z.string().nullable().optional().default(null),
    start_date: z.coerce.date().nullable().optional().default(null),
    end_date: z.coerce.date().nullable().optional().default(null),
    page: z.coerce.number().int().min(1).default(1),
    pageNumber: z.coerce.number().int().min(1).max(100).default(10),
});

/* -------------------------------------------------------------------------- */
/* Dashboard                                                                  */
/* -------------------------------------------------------------------------- */

export const searchUsersSchema = z.object({
    username: z.string().nullable(),
    email: z.email().nullable(),
    role: z.string().nullable(),
    page: z.coerce.number().int().min(1).default(1),
    pageNumber: z.coerce.number().int().min(1).max(100).default(10),
});

export const specificMonthsSchema = z.array(
    z.object({
        year: z.coerce.number().int(),
        month_number: z.coerce.number().int().min(1).max(12),
}));

/* -------------------------------------------------------------------------- */
/* Issues                                                                     */
/* -------------------------------------------------------------------------- */

export const createCategory = z.object({
    slug: z.string(),
    name: z.string(),
    color: z.string().length(6),
    description: z.string()
});

export const updateCategory = z.object({
    slug: z.string().nullable(),
    name: z.string().nullable(),
    color: z.string().length(6).nullable(),
    description: z.string().nullable()
});

export const searchCategories = z.object({
    slug: z.string().nullable(),
    name: z.string().nullable(),
    color: z.string().length(6).nullable(),
    description: z.string().nullable(),
    start_date: z.coerce.date().nullable(),
    end_date: z.coerce.date().nullable(),
    page: z.coerce.number().int().min(1).default(1),
    pageNumber: z.coerce.number().int().min(1).max(100).default(10),
});

export const createIssue = z.object({
    title: z.string(),
    description: z.string(),
    category_id: z.uuid(),
    status: z.enum(["open", "planned" , "in_progress" , "completed" , "closed"]),
    priority: z.number().min(1).max(5)
});

export const updateIssue = z.object({
    title: z.string().nullable(),
    description: z.string().nullable(),
    category_id: z.uuid().nullable(),
    status: z.enum(["open", "planned" , "in_progress" , "completed" , "closed"]).nullable(),
    priority: z.number().min(1).max(5).nullable()
});

export const searchIssues = z.object({
    title: z.string().nullable(),
    description: z.string().nullable(),
    created_by: z.uuid().nullable(),
    category_id: z.uuid().nullable(),
    status: z.enum(["open", "planned" , "in_progress" , "completed" , "closed"]).nullable(),
    priority: z.number().min(1).max(5).nullable(),
    start_date: z.coerce.date().nullable(),
    end_date: z.coerce.date().nullable(),
    page: z.coerce.number().int().min(1).default(1),
    pageNumber: z.coerce.number().int().min(1).max(100).default(10),
});

export const createIssueComment = z.object({
    issue_id: z.uuid(),
    body: z.string()
});

export const updateIssueComment = z.object({
    comment_id: z.uuid(),
    body: z.string()
});

export const searchIssuesComments = z.object({
    issue_id: z.uuid().nullable(),
    author_id: z.uuid().nullable(),
    body: z.string().nullable(),
    edited: nullableBoolean,
    start_date: z.coerce.date().nullable(),
    end_date: z.coerce.date().nullable(),
    page: z.coerce.number().int().min(1).default(1),
    pageNumber: z.coerce.number().int().min(1).max(100).default(10),
})