import { Router } from "express";
import {
  assignSubjectsToStream,
  createStream,
  getStreamById,
  getStreams,
} from "../controllers/streams.controller";

const router = Router();

router.post("/", createStream);
router.get("/", getStreams);
router.get("/:id", getStreamById);
router.post("/:id/subjects", assignSubjectsToStream);

export default router;
