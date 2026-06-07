import { Router } from "express";
import {
  createScore,
  saveBulkScores,
  updateScore,
} from "../controllers/scores.controller";

const router = Router();

router.post("/", createScore);
router.post("/bulk", saveBulkScores);
router.patch("/:id", updateScore);

export default router;
