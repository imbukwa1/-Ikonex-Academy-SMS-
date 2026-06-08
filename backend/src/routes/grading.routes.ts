import { Router } from "express";
import {
  getGradingScale,
  updateGradingScale,
} from "../controllers/grading.controller";

const router = Router();
router.get("/", getGradingScale);
router.put("/", updateGradingScale);
export default router;
