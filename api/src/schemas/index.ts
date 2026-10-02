import { z } from 'zod';

/* -------------------------------------------------------------------------- */
/* AUTH                                                                     */
/* -------------------------------------------------------------------------- */
export const registerSchema = z.object({
    username: z.string(),
    email: z.email().trim().toLowerCase(),
    password: z.string().min(8).max(256),
})


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