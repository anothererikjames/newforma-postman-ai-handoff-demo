import { Router } from "express";
import { createSubmittal, getSubmittal } from "../controllers/submittals";

const router = Router();

router.post("/projects/:projectId/submittals", createSubmittal);
router.get("/projects/:projectId/submittals/:submittalId", getSubmittal);

export default router;
