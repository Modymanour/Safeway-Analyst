import { pool, queryOne } from "./pool.ts";
import { env } from "../config/env.ts";
import { hash_password } from "../lib/hash.ts";
import { logger } from "../lib/loggers/logger.ts";

const log = logger.child({
    component: "seed_admin"
})


export const seed_admin = async () => {
    const db = pool;

    const email = env.ADMIN_EMAIL;
    const password =  env.ADMIN_PASSWORD;

    const user_exists = await queryOne(
        db,
        `SELECT email FROM users WHERE email = $1`,
        [email]
    );

    if (user_exists) {
        log.info({
            msg: "Seed admin already exists",
            email,
        })
        return;
    }

    const hashed_pass = hash_password(password);

    await queryOne(
        db,
        `INSERT INTO users (id, username, email, password, role, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, 'admin', now(), now())`
        ,
         [
            email.split("@")[0],
            email,
            hashed_pass
         ]
    );
    log.info({
        msg: "Successfully added the seed admin",
        email,
    })
    return;
}