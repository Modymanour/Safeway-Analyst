import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer, request as proxyRequest } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "dist");
const basePath = "/dashboard";
const port = Number(process.env.PORT || 4173);
const apiTarget = new URL(process.env.API_PROXY_TARGET || "http://localhost:4000");
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url || "/", "http://localhost");
  if (requestUrl.pathname === "/api" || requestUrl.pathname.startsWith("/api/")) {
    const upstream = proxyRequest(new URL(`${requestUrl.pathname}${requestUrl.search}`, apiTarget), {
      method: request.method,
      headers: { ...request.headers, host: apiTarget.host },
    }, (upstreamResponse) => {
      response.writeHead(upstreamResponse.statusCode || 502, upstreamResponse.headers);
      upstreamResponse.pipe(response);
    });
    upstream.on("error", (error) => {
      console.error("API proxy request failed", error);
      if (!response.headersSent) response.writeHead(502, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ message: "The dashboard could not reach the API." }));
    });
    request.pipe(upstream);
    return;
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  } catch {
    response.writeHead(400).end("Bad request");
    return;
  }

  if (pathname === "/") {
    response.writeHead(302, { Location: `${basePath}/` }).end();
    return;
  }
  if (pathname === basePath) {
    response.writeHead(301, { Location: `${basePath}/` }).end();
    return;
  }
  if (pathname !== basePath && !pathname.startsWith(`${basePath}/`)) {
    response.writeHead(404).end("Not found");
    return;
  }

  const relativePath = pathname.slice(basePath.length).replace(/^\/+/, "");
  const requestedFile = path.resolve(root, relativePath || "index.html");
  if (!requestedFile.startsWith(`${root}${path.sep}`) && requestedFile !== path.join(root, "index.html")) {
    response.writeHead(403).end("Forbidden");
    return;
  }

  let filePath = requestedFile;
  try {
    const info = await stat(filePath);
    if (!info.isFile()) throw new Error("Not a file");
  } catch {
    if (path.extname(relativePath)) {
      response.writeHead(404).end("Not found");
      return;
    }
    filePath = path.join(root, "index.html");
  }

  const extension = path.extname(filePath).toLowerCase();
  response.writeHead(200, {
    "Content-Type": mimeTypes[extension] || "application/octet-stream",
    "Cache-Control": extension === ".html" ? "no-cache" : "public, max-age=31536000, immutable",
  });
  if (request.method === "HEAD") {
    response.end();
    return;
  }
  createReadStream(filePath).pipe(response);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Dashboard static server listening on port ${port}`);
});
