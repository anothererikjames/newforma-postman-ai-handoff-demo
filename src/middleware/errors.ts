import { NextFunction, Request, Response } from "express";

/** 404 for unknown routes, using the standard error shape. */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: `No route matches ${req.method} ${req.path}.`
    }
  });
}

/** Catch-all error handler. Maps body-parse failures to a 400 validation error. */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  const anyErr = err as { type?: string; status?: number; message?: string };

  if (anyErr && (anyErr.type === "entity.parse.failed" || anyErr.status === 400)) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request body is not valid JSON.",
        details: [{ field: "(body)", message: "Body must be a valid JSON object." }]
      }
    });
    return;
  }

  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred."
    }
  });
}
