import { RequestHandler } from "express";
import { prisma } from "../db";
import { AppError } from "../utils/AppError";

export const createSubject: RequestHandler = async (req, res, next) => {
  try {
    const { name, code } = req.body;

    if (!name || !code) {
      throw new AppError("Subject name and code are required.");
    }

    const subject = await prisma.subject.create({
      data: {
        name,
        code,
        streams: {
          connect: (await prisma.stream.findMany({ select: { id: true } })).map(
            (stream) => ({ id: stream.id })
          ),
        },
      },
      include: { streams: true },
    });

    res.status(201).json(subject);
  } catch (error) {
    next(error);
  }
};

export const getSubjects: RequestHandler = async (_req, res, next) => {
  try {
    const subjects = await prisma.subject.findMany({
      include: { streams: true },
      orderBy: { name: "asc" },
    });

    res.json(subjects);
  } catch (error) {
    next(error);
  }
};

export const updateSubject: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { name, code } = req.body;

    if (Number.isNaN(id)) {
      throw new AppError("Subject id must be a number.");
    }

    if (!name && !code) {
      throw new AppError("Provide name or code to update.");
    }

    const subject = await prisma.subject.update({
      where: { id },
      data: { name, code },
      include: { streams: true },
    });

    res.json(subject);
  } catch (error) {
    next(error);
  }
};

export const deleteSubject: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      throw new AppError("Subject id must be a number.");
    }

    await prisma.subject.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
