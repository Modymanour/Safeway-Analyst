const responseEnvelope = {
  type: "object",
  properties: {
    request_id: { type: "string", nullable: true },
    status: { type: "string", nullable: true },
    status_code: { type: "integer", nullable: true },
    data: { type: "object", nullable: true, description: "Endpoint-specific response data." },
    url: { type: "string", nullable: true },
    msg: { type: "string", nullable: true },
    time_taken_ms: { type: "number", nullable: true },
  },
};

const success = {
  description: "Successful response.",
  content: { "application/json": { schema: { ...responseEnvelope } } },
};
const error = {
  description: "Validation, not-found, or server error.",
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          error: { type: "string" },
          message: { type: "string" },
        },
      },
    },
  },
};
const queryParameter = (name: string, description: string, schema: Record<string, unknown>, required = false) => ({
  name,
  in: "query",
  required,
  description,
  schema,
});
const pagination = [
  queryParameter("page", "One-based page number (defaults to 1).", { type: "integer", minimum: 1, default: 1 }),
  queryParameter("pageNumber", "Rows per page, up to 100 (defaults to 10).", { type: "integer", minimum: 1, maximum: 100, default: 10 }),
];

export const openApiSpecification = {
  openapi: "3.0.3",
  info: {
    title: "Safe Way Analytics API",
    version: "1.0.0",
    description: "HTTP API for recording user visits, retrieving Safe Way analytics, and managing dashboard accounts. Protected dashboard and user-list routes require an access bearer token.",
  },
  servers: [{ url: "/", description: "Current API server" }],
  tags: [
    { name: "User visits", description: "Create and search website visit records." },
    { name: "Dashboard", description: "Retrieve monthly analytics summaries and user records." },
  ],
  paths: {
    "/api/user-visit": {
      post: {
        tags: ["User visits"],
        summary: "Record a user visit",
        description: "Creates a visit record. The client must provide a UUID for id.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["id", "email_click", "whatsapp_click", "phone_click", "time_on_page", "device_type", "traffic_source", "location"],
                properties: {
                  id: { type: "string", format: "uuid" },
                  email_click: { type: "boolean" },
                  whatsapp_click: { type: "boolean" },
                  phone_click: { type: "boolean" },
                  time_on_page: { type: "number", minimum: 0 },
                  device_type: { type: "string", example: "mobile" },
                  traffic_source: { type: "string", example: "organic" },
                  location: { type: "string", example: "Cairo" },
                },
              },
            },
          },
        },
        responses: { "201": success, "400": error, "500": error },
      },
    },
    "/api/user-visit/get": {
      get: {
        tags: ["User visits"],
        summary: "List all visit records",
        description: "Returns paginated visit records.",
        parameters: pagination,
        responses: { "200": success, "500": error },
      },
    },
    "/api/user-visit/search": {
      get: {
        tags: ["User visits"],
        summary: "Search visit records",
        parameters: [
          queryParameter("email_click", "Filter by email click.", { type: "string", enum: ["true", "false"], nullable: true }),
          queryParameter("whatsapp_click", "Filter by WhatsApp click.", { type: "string", enum: ["true", "false"], nullable: true }),
          queryParameter("phone_click", "Filter by phone click.", { type: "string", enum: ["true", "false"], nullable: true }),
          queryParameter("device_type", "Filter by device type.", { type: "string", nullable: true }),
          queryParameter("traffic_source", "Filter by traffic source.", { type: "string", nullable: true }),
          queryParameter("location", "Filter by location.", { type: "string", nullable: true }),
          queryParameter("start_date", "Filter visits at or after this date-time.", { type: "string", format: "date-time", nullable: true }),
          queryParameter("end_date", "Filter visits at or before this date-time.", { type: "string", format: "date-time", nullable: true }),
          ...pagination,
        ],
        responses: { "200": success, "400": error, "500": error },
      },
    },
    "/api/dashboard/get-current-year-data": {
      get: { tags: ["Dashboard"], summary: "Get current calendar year's monthly analytics", responses: { "200": success, "500": error } },
    },
    "/api/dashboard/get-current-month-data": {
      get: { tags: ["Dashboard"], summary: "Get current month's analytics", responses: { "200": success, "500": error } },
    },
    "/api/dashboard/get-custom-month-data": {
      get: {
        tags: ["Dashboard"],
        summary: "Get one month's analytics",
        parameters: [
          queryParameter("year", "Calendar year.", { type: "integer", example: 2026 }, true),
          queryParameter("month_number", "Month number from 1 to 12.", { type: "integer", minimum: 1, maximum: 12, example: 9 }, true),
        ],
        responses: { "200": success, "400": error, "500": error },
      },
    },
    "/api/dashboard/get-custom-month-range-data": {
      get: {
        tags: ["Dashboard"],
        summary: "Get analytics for a contiguous month range",
        parameters: [
          queryParameter("start_year", "Starting calendar year.", { type: "integer", example: 2026 }, true),
          queryParameter("start_month", "Starting month number from 1 to 12.", { type: "integer", minimum: 1, maximum: 12, example: 1 }, true),
          queryParameter("end_year", "Ending calendar year.", { type: "integer", example: 2026 }, true),
          queryParameter("end_month", "Ending month number from 1 to 12.", { type: "integer", minimum: 1, maximum: 12, example: 9 }, true),
        ],
        responses: { "200": success, "400": error, "500": error },
      },
    },
    "/api/dashboard/get-specific-months-data": {
      get: {
        tags: ["Dashboard"],
        summary: "Get analytics for selected months",
        description: "Pass a JSON-encoded array in the months query parameter, e.g. ?months=%5B%7B%22year%22%3A2026%2C%22month_number%22%3A9%7D%5D.",
        parameters: [queryParameter("months", "JSON array of { year, month_number } objects.", { type: "string", example: "[{\"year\":2026,\"month_number\":9}]" }, true)],
        responses: { "200": success, "400": error, "500": error },
      },
    },
    "/api/dashboard/search-users": {
      get: {
        tags: ["Dashboard"],
        summary: "Search dashboard users",
        description: "Requires an access bearer token and read permission.",
        parameters: [
          queryParameter("username", "Username filter; pass an empty string for no filter.", { type: "string", nullable: true }, true),
          queryParameter("email", "Email filter; pass an empty string for no filter.", { type: "string", format: "email", nullable: true }, true),
          queryParameter("role", "Role filter; pass an empty string for no filter.", { type: "string", nullable: true }, true),
          ...pagination,
        ],
        responses: { "200": success, "400": error, "500": error },
      },
    },
    "/api/dashboard/get-all-users": {
      get: {
        tags: ["Dashboard"],
        summary: "List dashboard users",
        description: "Requires an access bearer token and read permission. Password hashes are not included.",
        parameters: pagination,
        responses: { "200": success, "500": error },
      },
    },
  },
} as const;
