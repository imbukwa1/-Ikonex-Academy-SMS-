import { Router } from "express";
import {
  createStudent,
  deleteStudent,
  getStudentById,
  getStudents,
  getStudentsByStream,
  updateStudent,
} from "../controllers/students.controller";

const router = Router();

router.post("/", createStudent);
router.get("/", getStudents);
router.get("/stream/:streamId", getStudentsByStream);
router.get("/:id", getStudentById);
router.patch("/:id", updateStudent);
router.delete("/:id", deleteStudent);

export default router;
