export interface ProjectDocument {
  id: string;
  projectId: string;
  title: string;
  discipline: string;
  status: string;
  revision: string;
  fileName: string;
  author: string;
  updatedAt: string;
}

export interface Submittal {
  id: string;
  projectId: string;
  title: string;
  discipline: string;
  specSection: string | null;
  status: string;
  revision: string;
  dueDate: string | null;
  reviewer: string | null;
  submittedBy: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  number: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: { field: string; message: string }[];
  };
}

export interface DocumentSearchRequest {
  query?: string;
  discipline?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateSubmittalRequest {
  title: string;
  discipline: string;
  specSection?: string;
  dueDate?: string;
  reviewer?: string;
  description?: string;
}
