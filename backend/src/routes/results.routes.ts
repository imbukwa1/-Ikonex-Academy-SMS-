import { Router } from "express";
import {
  getClassPerformance,
  getStudentResults,
  getSubjectStreamResults,
} from "../controllers/results.controller";

const router = Router();

router.get("/subject/:subjectId/stream/:streamId", getSubjectStreamResults);
router.get("/student/:studentId", getStudentResults);
router.get("/class/:streamId", getClassPerformance);

export default router;
