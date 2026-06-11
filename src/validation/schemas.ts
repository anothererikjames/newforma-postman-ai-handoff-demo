/**
 * Hand-rolled validation (kept dependency-free on purpose).
 * Each validator returns a list of { field, message } problems; empty = valid.
 */

export interface FieldError {
  field: string;
  message: string;
}

const DISCIPLINES = ["Architectural", "Structural", "Mechanical", "Electrical", "Plumbing", "Civil"];
const DOCUMENT_STATUSES = ["Draft", "Issued for Review", "Approved", "Superseded"];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

export function validateDocumentSearch(body: unknown): FieldError[] {
  if (!isPlainObject(body)) {
    return [{ field: "(body)", message: "Body must be a JSON object." }];
  }

  const errors: FieldError[] = [];

  if (body.query !== undefined && typeof body.query !== "string") {
    errors.push({ field: "query", message: "query must be a string." });
  }
  if (body.discipline !== undefined) {
    if (typeof body.discipline !== "string") {
      errors.push({ field: "discipline", message: "discipline must be a string." });
    } else if (!DISCIPLINES.includes(body.discipline)) {
      errors.push({ field: "discipline", message: `discipline must be one of: ${DISCIPLINES.join(", ")}.` });
    }
  }
  if (body.status !== undefined) {
    if (typeof body.status !== "string") {
      errors.push({ field: "status", message: "status must be a string." });
    } else if (!DOCUMENT_STATUSES.includes(body.status)) {
      errors.push({ field: "status", message: `status must be one of: ${DOCUMENT_STATUSES.join(", ")}.` });
    }
  }
  if (body.page !== undefined && (!Number.isInteger(body.page) || (body.page as number) < 1)) {
    errors.push({ field: "page", message: "page must be an integer >= 1." });
  }
  if (body.pageSize !== undefined && (!Number.isInteger(body.pageSize) || (body.pageSize as number) < 1 || (body.pageSize as number) > 100)) {
    errors.push({ field: "pageSize", message: "pageSize must be an integer between 1 and 100." });
  }

  return errors;
}

export function validateCreateSubmittal(body: unknown): FieldError[] {
  if (!isPlainObject(body)) {
    return [{ field: "(body)", message: "Body must be a JSON object." }];
  }

  const errors: FieldError[] = [];

  if (typeof body.title !== "string" || body.title.trim().length === 0) {
    errors.push({ field: "title", message: "title is required and must be a non-empty string." });
  }
  if (typeof body.discipline !== "string" || body.discipline.trim().length === 0) {
    errors.push({ field: "discipline", message: "discipline is required and must be a non-empty string." });
  } else if (!DISCIPLINES.includes(body.discipline)) {
    errors.push({ field: "discipline", message: `discipline must be one of: ${DISCIPLINES.join(", ")}.` });
  }
  if (body.specSection !== undefined && typeof body.specSection !== "string") {
    errors.push({ field: "specSection", message: "specSection must be a string (e.g. '23 73 13')." });
  }
  if (body.dueDate !== undefined) {
    if (typeof body.dueDate !== "string" || !isIsoDate(body.dueDate)) {
      errors.push({ field: "dueDate", message: "dueDate must be an ISO date string (YYYY-MM-DD)." });
    }
  }
  if (body.reviewer !== undefined && typeof body.reviewer !== "string") {
    errors.push({ field: "reviewer", message: "reviewer must be a string." });
  }
  if (body.description !== undefined && typeof body.description !== "string") {
    errors.push({ field: "description", message: "description must be a string." });
  }

  return errors;
}
