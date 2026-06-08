import { Router } from "express";
import {
  getAssessmentTerms,
  getClassPerformance,
  getStudentAssessmentTerms,
  getStudentResults,
  getSubjectStreamResults,
} from "../controllers/results.controller";

const router = Router();

router.get("/terms", getAssessmentTerms);
router.get("/subject/:subjectId/stream/:streamId", getSubjectStreamResults);
router.get("/student/:studentId/terms", getStudentAssessmentTerms);
router.get("/student/:studentId", getStudentResults);
router.get("/class/:streamId", getClassPerformance);

export default router;
