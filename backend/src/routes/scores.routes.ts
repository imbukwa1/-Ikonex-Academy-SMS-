import { Router } from "express";
import {
  createScore,
  getScoreEntries,
  saveBulkScores,
  updateScore,
} from "../controllers/scores.controller";

const router = Router();

router.post("/", createScore);
router.post("/bulk", saveBulkScores);
router.get("/subject/:subjectId/stream/:streamId", getScoreEntries);
router.patch("/:id", updateScore);

export default router;
