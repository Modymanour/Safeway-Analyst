import express from 'express';
import { logger } from "./loggers/logger.ts";
import { env } from './config/env.ts';
import { errorLogger, requestLogger } from './middleware/logging.middleware.ts';

const PORT = env.PORT || 4000;

const app = express();
app.use(requestLogger);
app.use(express.json());

app.use(errorLogger);

app.listen(
    PORT,
    () => {
        logger.info({ port: PORT, component: "http-server" }, "server started");
        logger.info({})
    }
);