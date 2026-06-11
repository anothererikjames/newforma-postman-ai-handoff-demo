import { Request, Response } from "express";
import { nextSubmittalId, projects, submittals } from "../data/seed";
import { validateCreateSubmittal } from "../validation/schemas";
import { CreateSubmittalRequest, Submittal } from "../types";

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

/** POST /projects/:projectId/submittals */
export function createSubmittal(req: Request, res: Response): void {
  const { projectId } = req.params;

  if (!projectExists(projectId)) {
    projectNotFound(res, projectId);
    return;
  }

  const validationErrors = validateCreateSubmittal(req.body);
  if (validationErrors.length > 0) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Submittal request body failed validation.",
        details: validationErrors
      }
    });
    return;
  }

  const body = req.body as CreateSubmittalRequest;

  const submittal: Submittal = {
    id: nextSubmittalId(),
    projectId,
    title: body.title.trim(),
    discipline: body.discipline,
    specSection: body.specSection ?? null,
    status: "Open",
    revision: "1",
    dueDate: body.dueDate ?? null,
    reviewer: body.reviewer ?? null,
    submittedBy: "API Client",
    createdAt: new Date().toISOString()
  };

  submittals.push(submittal);

  res.status(201).json(submittal);
}

/** GET /projects/:projectId/submittals/:submittalId */
export function getSubmittal(req: Request, res: Response): void {
  const { projectId, submittalId } = req.params;

  if (!projectExists(projectId)) {
    projectNotFound(res, projectId);
    return;
  }

  const submittal = submittals.find((s) => s.projectId === projectId && s.id === submittalId);
  if (!submittal) {
    res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: `Submittal '${submittalId}' was not found in project '${projectId}'.`
      }
    });
    return;
  }

  res.status(200).json(submittal);
}
