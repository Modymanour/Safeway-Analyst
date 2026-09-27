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

export const userVisitSchema = z.object({
    id: z.uuid(),
    email_click: z.boolean(),
    whatsapp_click: z.boolean(),
    phone_click: z.boolean(),
    time_on_page: z.number(),
    device_type: z.string(),
    traffic_source: z.string(),
    location: z.string(),
})