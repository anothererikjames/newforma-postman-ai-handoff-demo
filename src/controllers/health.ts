import { Request, Response } from "express";

/** GET /health — unauthenticated liveness check. */
export function getHealth(_req: Request, res: Response): void {
  res.status(200).json({
    status: "ok",
    service: "newforma-project-api",
    version: "1.0.0",
    time: new Date().toISOString()
  });
}
