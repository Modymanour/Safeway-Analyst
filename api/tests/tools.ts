import { UUID } from "node:crypto";
import { Queryable } from "../src/db/pool";
import { UserRepository } from "../src/repositories/user.repository";
import { UserVisitsStatsRepository} from "../src/repositories/user_visits_stats.repository";
import { RefreshTokenRepository } from "../src/repositories/refresh_token.repository";


export const createUser = async (db: Queryable,repository:UserRepository, counter: number) => {
    const data = []
    for (let i = 0; i < counter; i++) {
        const input = {
            username: `testuser${i}`,
            email: `test${i}@gmail.com`,
            password: `testpassword${i}`,
            role: "admin",
        };
        data.push(await repository.create(db, input));
    }
    return data;
}

export const createUserStatsData = async (client: Queryable, repository:UserVisitsStatsRepository, count: number) => {
    const data = [];
    const input = {
        email_click: true,
        whatsapp_click: false,
        phone_click: true,
        time_on_page: 120,
        device_type: "mobile",
        traffic_source: "organic",
        location: "New York",
    };

    for (let i = 0; i < count; i++) {
        data.push(await repository.create(client, input));
    }

    return data;
};

export const createToken = async (db: Queryable, repository:RefreshTokenRepository, user_id: UUID) => {
    const data = []
    const input = {
        user_id: user_id,
        token: `testToken`,
        expires_at: new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
    }
    data.push(await repository.create(db, input))
    return data; 
}