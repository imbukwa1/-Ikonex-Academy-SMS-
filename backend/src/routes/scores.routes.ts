import { Router } from "express";
import { createScore, updateScore } from "../controllers/scores.controller";

const router = Router();

router.post("/", createScore);
router.patch("/:id", updateScore);

export default router;
