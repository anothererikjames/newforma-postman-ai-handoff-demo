import express from "express";
import healthRoutes from "./routes/health";
import documentRoutes from "./routes/documents";
import submittalRoutes from "./routes/submittals";
import { requireAuth } from "./middleware/auth";
import { errorHandler, notFoundHandler } from "./middleware/errors";

export function createApp(): express.Express {
  const app = express();

  app.use(express.json());

  // Health is open; everything else requires a bearer token.
  app.use(healthRoutes);
  app.use(requireAuth);
  app.use(documentRoutes);
  app.use(submittalRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
