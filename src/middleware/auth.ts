import { NextFunction, Request, Response } from "express";

const AUTH_TOKEN = process.env.AUTH_TOKEN || "demo-token";

/**
 * Simple bearer-token auth for the demo. Every non-health endpoint requires
 * `Authorization: Bearer demo-token`. Missing or wrong tokens get a 401 with
 * the standard error shape.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Missing bearer token. Send 'Authorization: Bearer <token>'."
      }
    });
    return;
  }

  const token = header.slice("Bearer ".length).trim();
  if (token !== AUTH_TOKEN) {
    res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Invalid bearer token."
      }
    });
    return;
  }

  next();
}
