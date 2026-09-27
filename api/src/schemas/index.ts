import { z } from 'zod';

/* -------------------------------------------------------------------------- */
/* AUTH                                                                     */
/* -------------------------------------------------------------------------- */
export const registerSchema = z.object({
    name: z.string(),
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
    email_click: nullableBoolean,
    whatsapp_click: nullableBoolean,
    phone_click: nullableBoolean,
    device_type: z.string().nullable(),
    traffic_source: z.string().nullable(),
    location: z.string().nullable(),
    start_date: z.coerce.date().nullable(),
    end_date: z.coerce.date().nullable(),
});

/* -------------------------------------------------------------------------- */
/* Dashboard                                                                  */
/* -------------------------------------------------------------------------- */

export const searchUsersSchema = z.object({
    username: z.string().nullable(),
    email: z.email().nullable(),
    role: z.string().nullable()
});

export const specificMonthsSchema = z.object({
    months_number: z.object({
        year: z.number(),
        month_number: z.number()
    })
})