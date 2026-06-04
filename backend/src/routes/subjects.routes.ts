import { Router } from "express";
import {
  createSubject,
  deleteSubject,
  getSubjects,
  updateSubject,
} from "../controllers/subjects.controller";

const router = Router();

router.post("/", createSubject);
router.get("/", getSubjects);
router.patch("/:id", updateSubject);
router.delete("/:id", deleteSubject);

export default router;
