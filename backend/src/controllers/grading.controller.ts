import { RequestHandler } from "express";
import { prisma } from "../db";
import { AppError } from "../utils/AppError";

export const getGradingScale: RequestHandler = async (_req, res, next) => {
  try {
    res.json(await prisma.gradingScale.findMany({ orderBy: { min: "desc" } }));
  } catch (error) {
    next(error);
  }
};

export const updateGradingScale: RequestHandler = async (req, res, next) => {
  try {
    const scales = req.body?.scales as Array<{
      grade: string;
      min: number;
      max: number;
      remarks: string;
    }>;
    if (!Array.isArray(scales) || scales.length === 0) {
      throw new AppError("A non-empty grading scale is required.");
    }
    const normalized = scales.map((scale) => ({
      grade: String(scale.grade).trim().toUpperCase(),
      min: Number(scale.min),
      max: Number(scale.max),
      remarks: String(scale.remarks).trim(),
    }));
    if (
      normalized.some(
        (scale) =>
          !scale.grade ||
          !scale.remarks ||
          !Number.isInteger(scale.min) ||
          !Number.isInteger(scale.max) ||
          scale.min < 0 ||
          scale.max > 100 ||
          scale.min > scale.max
      )
    ) {
      throw new AppError("Each grade requires valid 0-100 boundaries and remarks.");
    }
    const ordered = [...normalized].sort((a, b) => a.min - b.min);
    const coversFullRange =
      ordered[0].min === 0 &&
      ordered[ordered.length - 1].max === 100 &&
      ordered.every(
        (scale, index) =>
          index === 0 || scale.min === ordered[index - 1].max + 1
      );
    if (!coversFullRange) {
      throw new AppError(
        "Grading boundaries must cover 0 through 100 without gaps or overlaps."
      );
    }

    await prisma.$transaction([
      prisma.gradingScale.deleteMany(),
      prisma.gradingScale.createMany({ data: normalized }),
    ]);
    res.json(await prisma.gradingScale.findMany({ orderBy: { min: "desc" } }));
  } catch (error) {
    next(error);
  }
};
