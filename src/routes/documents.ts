import { Router } from "express";
import { getDocument, searchDocuments } from "../controllers/documents";

const router = Router();

router.get("/projects/:projectId/documents/:documentId", getDocument);
router.post("/projects/:projectId/documents/search", searchDocuments);

export default router;
