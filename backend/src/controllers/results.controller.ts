import { RequestHandler } from "express";
import {
  calculateClassPerformance,
  calculateStudentResults,
  calculateSubjectStreamResults,
} from "../services/results.service";
import { AppError } from "../utils/AppError";

export const getSubjectStreamResults: RequestHandler = async (req, res, next) => {
  try {
    const subjectId = Number(req.params.subjectId);
    const streamId = Number(req.params.streamId);
    const term = typeof req.query.term === "string" ? req.query.term : undefined;

    if (Number.isNaN(subjectId) || Number.isNaN(streamId)) {
      throw new AppError("subjectId and streamId must be numbers.");
    }

    if (!term) {
      throw new AppError("term query parameter is required.");
    }

    const results = await calculateSubjectStreamResults(subjectId, streamId, term);
    res.json(results);
  } catch (error) {
    next(error);
  }
};

export const getStudentResults: RequestHandler = async (req, res, next) => {
  try {
    const studentId = Number(req.params.studentId);
    const term = typeof req.query.term === "string" ? req.query.term : undefined;

    if (Number.isNaN(studentId)) {
      throw new AppError("studentId must be a number.");
    }

    if (!term) {
      throw new AppError("term query parameter is required.");
    }

    const results = await calculateStudentResults(studentId, term);
    res.json(results);
  } catch (error) {
    next(error);
  }
};

export const getClassPerformance: RequestHandler = async (req, res, next) => {
  try {
    const streamId = Number(req.params.streamId);
    const term = typeof req.query.term === "string" ? req.query.term : undefined;

    if (Number.isNaN(streamId)) {
      throw new AppError("streamId must be a number.");
    }

    if (!term) {
      throw new AppError("term query parameter is required.");
    }

    const results = await calculateClassPerformance(streamId, term);
    res.json(results);
  } catch (error) {
    next(error);
  }
};
