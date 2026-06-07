//backend\src\controllers\scores.controller.ts
import { RequestHandler } from "express";
import { prisma } from "../db";
import { getGradeAndRemarks } from "../services/results.service";
import { AppError } from "../utils/AppError";

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
    const { grade, remarks } = getGradeAndRemarks(totalScore);

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
    const { grade, remarks } = getGradeAndRemarks(totalScore);

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
  ca_score: number;
  exam_score: number;
};

export const saveBulkScores: RequestHandler = async (req, res, next) => {
  try {
    const { subject_id, term, scores } = req.body as {
      subject_id?: number;
      term?: string;
      scores?: BulkScoreEntry[];
    };

    const subjectId = Number(subject_id);
    if (!subjectId || !term || !Array.isArray(scores) || scores.length === 0) {
      throw new AppError("subject_id, term, and a non-empty scores array are required.");
    }

    const normalizedScores = scores.map((entry) => ({
      studentId: Number(entry.student_id),
      caScore: Number(entry.ca_score),
      examScore: Number(entry.exam_score),
    }));

    for (const entry of normalizedScores) {
      if (!entry.studentId) {
        throw new AppError("Each score entry must contain a valid student_id.");
      }
      if (!Number.isFinite(entry.caScore) || entry.caScore < 0 || entry.caScore > 40) {
        throw new AppError("Every ca_score must be between 0 and 40.");
      }
      if (
        !Number.isFinite(entry.examScore) ||
        entry.examScore < 0 ||
        entry.examScore > 60
      ) {
        throw new AppError("Every exam_score must be between 0 and 60.");
      }
    }

    const uniqueStudentIds = new Set(normalizedScores.map((entry) => entry.studentId));
    if (uniqueStudentIds.size !== normalizedScores.length) {
      throw new AppError("A student cannot appear more than once in the batch.");
    }

    const savedScores = await prisma.$transaction(
      normalizedScores.map((entry) => {
        const totalScore = entry.caScore + entry.examScore;
        const { grade, remarks } = getGradeAndRemarks(totalScore);

        return prisma.assessment.upsert({
          where: {
            student_id_subject_id_term: {
              student_id: entry.studentId,
              subject_id: subjectId,
              term,
            },
          },
          update: {
            ca_score: entry.caScore,
            exam_score: entry.examScore,
            total_score: totalScore,
            grade,
            remarks,
          },
          create: {
            student_id: entry.studentId,
            subject_id: subjectId,
            ca_score: entry.caScore,
            exam_score: entry.examScore,
            total_score: totalScore,
            grade,
            remarks,
            term,
          },
        });
      })
    );

    res.json({
      message: `${savedScores.length} score records saved successfully.`,
      count: savedScores.length,
      scores: savedScores,
    });
  } catch (error) {
    next(error);
  }
};
