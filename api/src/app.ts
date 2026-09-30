import express from 'express';
import { logger } from "./lib/loggers/logger.ts";
import { env } from './config/env.ts';
import { errorLogger, requestLogger } from './middleware/logging.middleware.ts';
import { router } from './routes/router.ts';
import swaggerUi from 'swagger-ui-express';
import { openApiSpecification } from './config/openapi.ts';

const PORT = env.PORT || 4000;


const app = express();
app.use(requestLogger);
app.use(express.json());

app.get('/api-docs/openapi.json', (_req, res) => res.json(openApiSpecification));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpecification));
app.use(router);

app.use(errorLogger);

app.listen(
    PORT,
    () => {
        logger.info({ port: PORT, component: "http-server" }, "server started");
        logger.info({ url: `http://localhost:${PORT}/api-docs`, component: "http-server" }, "Swagger API documentation available");
        logger.info({})
    }
);