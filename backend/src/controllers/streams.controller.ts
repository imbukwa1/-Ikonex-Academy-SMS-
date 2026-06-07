// backend\src\controllers\streams.controller.ts
import { RequestHandler } from "express";
import { prisma } from "../db";
import { AppError } from "../utils/AppError";

export const createStream: RequestHandler = async (req, res, next) => {
  try {
    const { name, subjectIds } = req.body;

    if (!name) {
      throw new AppError("Stream name is required.");
    }

    const stream = await prisma.stream.create({
      data: {
        name,
        subjects: Array.isArray(subjectIds)
          ? { connect: subjectIds.map((id: number) => ({ id })) }
          : undefined,
      },
      include: { subjects: true },
    });

    res.status(201).json(stream);
  } catch (error) {
    next(error);
  }
};

export const getStreams: RequestHandler = async (_req, res, next) => {
  try {
    const streams = await prisma.stream.findMany({
      include: { subjects: true, _count: { select: { students: true } } },
      orderBy: { name: "asc" },
    });

    res.json(streams);
  } catch (error) {
    next(error);
  }
};

export const getStreamById: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      throw new AppError("Stream id must be a number.");
    }

    const stream = await prisma.stream.findUnique({
      where: { id },
      include: {
        subjects: { orderBy: { name: "asc" } },
        students: { orderBy: [{ last_name: "asc" }, { first_name: "asc" }] },
      },
    });

    if (!stream) {
      throw new AppError("Stream not found.", 404);
    }

    res.json(stream);
  } catch (error) {
    next(error);
  }
};

export const assignSubjectsToStream: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { subjectIds } = req.body;

    if (Number.isNaN(id)) {
      throw new AppError("Stream id must be a number.");
    }

    if (!Array.isArray(subjectIds) || subjectIds.length === 0) {
      throw new AppError("subjectIds must be a non-empty array.");
    }

    const stream = await prisma.stream.update({
      where: { id },
      data: {
        subjects: {
          connect: subjectIds.map((subjectId: number) => ({ id: Number(subjectId) })),
        },
      },
      include: { subjects: { orderBy: { name: "asc" } } },
    });

    res.json(stream);
  } catch (error) {
    next(error);
  }
};
