export interface Http_Response<T>{
    request_id: string | null,
    status: string | null,
    status_code: number | null,
    data: T | null,
    url: string | null,
    msg: string | null,
    time_taken_ms: number | null,
}
