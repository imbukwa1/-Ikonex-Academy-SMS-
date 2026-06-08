//backend\src\controllers\scores.controller.ts
import { RequestHandler } from "express";
import { prisma } from "../db";
import { getGradeAndRemarks } from "../services/results.service";
import { AppError } from "../utils/AppError";

export const getScoreEntries: RequestHandler = async (req, res, next) => {
  try {
    const subjectId = Number(req.params.subjectId);
    const streamId = Number(req.params.streamId);
    const term = typeof req.query.term === "string" ? req.query.term : "";
    if (!subjectId || !streamId || !term) {
      throw new AppError("subjectId, streamId, and term are required.");
    }
    res.json(
      await prisma.assessment.findMany({
        where: {
          subject_id: subjectId,
          term,
          student: { stream_id: streamId },
        },
        orderBy: { student_id: "asc" },
      })
    );
  } catch (error) {
    next(error);
  }
};

export const createScore: RequestHandler = async (req, res, next) => {
  try {
    const { student_id, subject_id, ca_score, exam_score, term } = req.body;

    if (!student_id || !subject_id || ca_score === undefined || exam_score === undefined || !term) {
      throw new AppError("student_id, subject_id, ca_score, exam_score, and term are required.");
    }

    const caScore = Number(ca_score);
    const examScore = Number(exam_score);

    if (Number.isNaN(caScore) || Number.isNaN(examScore)) {
      throw new AppError("ca_score and exam_score must be numbers.");
    }

    if (caScore < 0 || caScore > 40) {
      throw new AppError("ca_score must be between 0 and 40.");
    }

    if (examScore < 0 || examScore > 60) {
      throw new AppError("exam_score must be between 0 and 60.");
    }

    const duplicate = await prisma.assessment.findUnique({
      where: {
        student_id_subject_id_term: {
          student_id: Number(student_id),
          subject_id: Number(subject_id),
          term,
        },
      },
    });

    if (duplicate) {
      throw new AppError("Score already exists for this student, subject, and term.", 409);
    }

    const totalScore = caScore + examScore;
    const { grade, remarks } = await getGradeAndRemarks(totalScore);

    const score = await prisma.assessment.create({
      data: {
        student_id: Number(student_id),
        subject_id: Number(subject_id),
        ca_score: caScore,
        exam_score: examScore,
        total_score: totalScore,
        grade,
        remarks,
        term,
      },
      include: {
        student: true,
        subject: true,
      },
    });

    res.status(201).json(score);
  } catch (error) {
    next(error);
  }
};

export const updateScore: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { ca_score, exam_score, term } = req.body;

    if (Number.isNaN(id)) {
      throw new AppError("Score id must be a number.");
    }

    if (ca_score === undefined && exam_score === undefined && !term) {
      throw new AppError("Provide ca_score, exam_score, or term to update.");
    }

    const existingScore = await prisma.assessment.findUnique({
      where: { id },
    });

    if (!existingScore) {
      throw new AppError("Score record not found.", 404);
    }

    const caScore = ca_score === undefined ? existingScore.ca_score : Number(ca_score);
    const examScore =
      exam_score === undefined ? existingScore.exam_score : Number(exam_score);

    if (Number.isNaN(caScore) || Number.isNaN(examScore)) {
      throw new AppError("ca_score and exam_score must be numbers.");
    }

    if (caScore < 0 || caScore > 40) {
      throw new AppError("ca_score must be between 0 and 40.");
    }

    if (examScore < 0 || examScore > 60) {
      throw new AppError("exam_score must be between 0 and 60.");
    }

    const totalScore = caScore + examScore;
    const { grade, remarks } = await getGradeAndRemarks(totalScore);

    const score = await prisma.assessment.update({
      where: { id },
      data: {
        ca_score: caScore,
        exam_score: examScore,
        total_score: totalScore,
        grade,
        remarks,
        term,
      },
      include: {
        student: true,
        subject: true,
      },
    });

    res.json(score);
  } catch (error) {
    next(error);
  }
};

type BulkScoreEntry = {
  student_id: number;
  score: number;
};

export const saveBulkScores: RequestHandler = async (req, res, next) => {
  try {
    const { subject_id, term, assessment_type, scores } = req.body as {
      subject_id?: number;
      term?: string;
      assessment_type?: "CAT" | "EXAM";
      scores?: BulkScoreEntry[];
    };

    const subjectId = Number(subject_id);
    if (
      !subjectId ||
      !term ||
      !["CAT", "EXAM"].includes(assessment_type ?? "") ||
      !Array.isArray(scores) ||
      scores.length === 0
    ) {
      throw new AppError(
        "subject_id, term, assessment_type, and a non-empty scores array are required."
      );
    }

    const normalizedScores = scores.map((entry) => ({
      studentId: Number(entry.student_id),
      score: Number(entry.score),
    }));
    const maximum = assessment_type === "CAT" ? 40 : 60;

    for (const entry of normalizedScores) {
      if (!entry.studentId) {
        throw new AppError("Each score entry must contain a valid student_id.");
      }
      if (!Number.isFinite(entry.score) || entry.score < 0 || entry.score > maximum) {
        throw new AppError(
          `Every ${assessment_type} score must be between 0 and ${maximum}.`
        );
      }
    }

    const uniqueStudentIds = new Set(normalizedScores.map((entry) => entry.studentId));
    if (uniqueStudentIds.size !== normalizedScores.length) {
      throw new AppError("A student cannot appear more than once in the batch.");
    }

    const existingScores = await prisma.assessment.findMany({
      where: {
        subject_id: subjectId,
        term,
        student_id: { in: normalizedScores.map((entry) => entry.studentId) },
      },
    });
    const existingByStudent = new Map(
      existingScores.map((score) => [score.student_id, score])
    );
    const operations = [];
    for (const entry of normalizedScores) {
      const existing = existingByStudent.get(entry.studentId);
      const caScore = assessment_type === "CAT" ? entry.score : existing?.ca_score ?? 0;
      const examScore =
        assessment_type === "EXAM" ? entry.score : existing?.exam_score ?? 0;
      const caRecorded = assessment_type === "CAT" || existing?.ca_recorded === true;
      const examRecorded =
        assessment_type === "EXAM" || existing?.exam_recorded === true;
      const totalScore = caScore + examScore;
      const grading = caRecorded && examRecorded
        ? await getGradeAndRemarks(totalScore)
        : { grade: "Pending", remarks: "Awaiting remaining assessment" };

      operations.push(
        prisma.assessment.upsert({
          where: {
            student_id_subject_id_term: {
              student_id: entry.studentId,
              subject_id: subjectId,
              term,
            },
          },
          update: {
            ca_score: caScore,
            exam_score: examScore,
            ca_recorded: caRecorded,
            exam_recorded: examRecorded,
            total_score: totalScore,
            grade: grading.grade,
            remarks: grading.remarks,
          },
          create: {
            student_id: entry.studentId,
            subject_id: subjectId,
            ca_score: caScore,
            exam_score: examScore,
            ca_recorded: caRecorded,
            exam_recorded: examRecorded,
            total_score: totalScore,
            grade: grading.grade,
            remarks: grading.remarks,
            term,
          },
        })
      );
    }
    const savedScores = await prisma.$transaction(operations);

    res.json({
      message: `${savedScores.length} score records saved successfully.`,
      count: savedScores.length,
      scores: savedScores,
    });
  } catch (error) {
    next(error);
  }
};
