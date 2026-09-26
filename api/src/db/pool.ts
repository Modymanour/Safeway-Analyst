import { Pool, PoolClient, QueryResult, QueryResultRow, types } from 'pg';
import moment from 'moment';
import { env } from '../config/env';
import { logger } from "../lib/loggers/logger.ts"

const log = logger.child({
    component: "pool"
})

//Adjusting data types coming for postgres so they are not strings but rather their original datatype
var parseFn = (val:string) => {
    return val == null ? null : moment(val);
}
var parseIn = (val:string) =>{
    return val == null ? null : parseInt(val, 10);
}
var parseFl = (val:string) => {
    return val == null ? null : parseFloat(val);
}
types.setTypeParser(types.builtins.TIMESTAMPTZ, parseFn);
types.setTypeParser(types.builtins.TIMESTAMP, parseFn)
types.setTypeParser(types.builtins.INT4, parseIn)
types.setTypeParser(types.builtins.INT8, parseIn)
types.setTypeParser(types.builtins.FLOAT8, parseFl);

//for console logging to remove extra sql stuff
function collapse(sql: string): string {
  return sql.replace(/\s+/g, ' ').trim().slice(0, 300);
}

const connectionString = env.POSTGRESQL_CONNECTION_STRING;

if (!connectionString) {
    throw new Error('POSTGRESQL_CONNECTION_STRING is not configured');
}


const config = {
    connectionString: connectionString,
    application_name: 'safeway-analyst',
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000
}

export const pool = new Pool({
    connectionString: config.connectionString,
    application_name: config.application_name,
    max: config.max,
    idleTimeoutMillis: config.idleTimeoutMillis,
    connectionTimeoutMillis: config.connectionTimeoutMillis
});

log.debug({
    connectionString: config.connectionString,
    application_name: config.application_name,
    max: config.max,
    idleTimeoutMillis: config.idleTimeoutMillis,
    connectionTimeoutMillis: config.connectionTimeoutMillis
});

pool.on('error', (error) => {
    log.error(error,'Unexpected PostgreSQL pool error');
});

pool.on('connect', () => {
    log.info({total: pool.totalCount, idle: pool.idleCount}, 'Postgres client connected');
})

const SLOW_QUERY_MS = 1000;

//abstraction for anyhting that can run a query such as pool:client or a transaction
export interface Queryable{
    query<R extends QueryResultRow = QueryResultRow>(
        text: string,
        values?: readonly unknown[]
    ): Promise<QueryResult<R>>
}

export async function query<R extends QueryResultRow = QueryResultRow>(
    db: Queryable,
    text: string,
    values: readonly unknown[] = [],
): Promise<QueryResult<R>>{
    const started = process.hrtime.bigint();
    try{
        const result = await db.query<R>(text,values);
        const ms = Number(process.hrtime.bigint() - started) / 1e6;
        if (ms > SLOW_QUERY_MS) {
            console.warn({ ms: Math.round(ms), sql: collapse(text), rows: result.rowCount }, 'Slow query');
        }
        return result;
    }
    catch(err){
        console.error('Query Failed:', collapse(text), err);
        throw err;
    }
}

export async function queryRows<R extends QueryResultRow = QueryResultRow>(
    db: Queryable,
    text: string,
    values: readonly unknown[] = []
): Promise<R[]> {
    return (await query<R>(db,text,values)).rows;
}

export async function queryOne<R extends QueryResultRow = QueryResultRow>(
  db: Queryable,
  text: string,
  values: readonly unknown[] = [],
): Promise<R | undefined> {
  const { rows } = await query<R>(db, text, values);
  return rows[0];
}
