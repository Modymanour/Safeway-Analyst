import express from 'express';
import { logger } from "./lib/loggers/logger.ts";
import { env } from './config/env.ts';
import { errorLogger, requestLogger } from './middleware/logging.middleware.ts';
import { router } from './routes/router.ts';

const PORT = env.PORT || 4000;


const app = express();
app.use(requestLogger);
app.use(express.json());

app.use(router);

app.use(errorLogger);

app.listen(
    PORT,
    () => {
        logger.info({ port: PORT, component: "http-server" }, "server started");
        logger.info({})
    }
);