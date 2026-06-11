import { Request, Response } from "express";
import { documents, projects } from "../data/seed";
import { validateDocumentSearch } from "../validation/schemas";
import { DocumentSearchRequest } from "../types";

function projectExists(projectId: string): boolean {
  return projects.some((p) => p.id === projectId);
}

function projectNotFound(res: Response, projectId: string): void {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: `Project '${projectId}' was not found.`
    }
  });
}

/** GET /projects/:projectId/documents/:documentId */
export function getDocument(req: Request, res: Response): void {
  const { projectId, documentId } = req.params;

  if (!projectExists(projectId)) {
    projectNotFound(res, projectId);
    return;
  }

  const document = documents.find((d) => d.projectId === projectId && d.id === documentId);
  if (!document) {
    res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: `Document '${documentId}' was not found in project '${projectId}'.`
      }
    });
    return;
  }

  res.status(200).json(document);
}

/** POST /projects/:projectId/documents/search */
export function searchDocuments(req: Request, res: Response): void {
  const { projectId } = req.params;

  if (!projectExists(projectId)) {
    projectNotFound(res, projectId);
    return;
  }

  const validationErrors = validateDocumentSearch(req.body);
  if (validationErrors.length > 0) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Search request body failed validation.",
        details: validationErrors
      }
    });
    return;
  }

  const body = (req.body || {}) as DocumentSearchRequest;
  const page = body.page ?? 1;
  const pageSize = body.pageSize ?? 25;

  let results = documents.filter((d) => d.projectId === projectId);

  if (body.query !== undefined && body.query.trim().length > 0) {
    const q = body.query.trim().toLowerCase();
    results = results.filter(
      (d) => d.title.toLowerCase().includes(q) || d.fileName.toLowerCase().includes(q)
    );
  }
  if (body.discipline !== undefined) {
    results = results.filter((d) => d.discipline === body.discipline);
  }
  if (body.status !== undefined) {
    results = results.filter((d) => d.status === body.status);
  }

  const total = results.length;
  const start = (page - 1) * pageSize;
  const paged = results.slice(start, start + pageSize);

  res.status(200).json({
    results: paged,
    total,
    page,
    pageSize
  });
}
