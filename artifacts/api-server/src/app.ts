import express, { type Express } from "express";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { DatabaseUnavailableError } from "./lib/mysql";

const app: Express = express();
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(express.json({ limit: "32kb" }));
app.use(express.urlencoded({ extended: true, limit: "32kb" }));
app.use(cookieParser());

app.use("/api", router);

app.use(
  (
    error: unknown,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    if (res.headersSent) {
      next(error);
      return;
    }

    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String(error.code)
        : "";
    if (error instanceof DatabaseUnavailableError) {
      req.log.warn({ err: error }, "Database is not available");
      res.status(503).json({ error: error.message });
      return;
    }
    if (code === "ER_DUP_ENTRY") {
      req.log.info({ err: error }, "Duplicate value rejected");
      res.status(409).json({
        error: "That slug or email address is already in use.",
      });
      return;
    }
    if (
      /^(ECONN|ENOTFOUND|ETIMEDOUT|PROTOCOL|ER_CON_COUNT_ERROR)/.test(code)
    ) {
      req.log.error({ err: error }, "Database connection failed");
      res.status(503).json({
        error: "The booking system cannot reach its database right now.",
      });
      return;
    }

    req.log.error({ err: error }, "API request failed");
    res.status(500).json({ error: "The request could not be completed." });
  },
);

export default app;
