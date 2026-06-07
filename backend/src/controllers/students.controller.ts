import { RequestHandler } from "express";
import { prisma } from "../db";
import { AppError } from "../utils/AppError";

export const createStudent: RequestHandler = async (req, res, next) => {
  try {
    const { admission_number, first_name, last_name, age, stream_id } = req.body;

    if (!admission_number || !first_name || !last_name || !stream_id) {
      throw new AppError(
        "Admission number, first_name, last_name, and stream_id are required."
      );
    }

    const studentAge = age === undefined || age === "" ? undefined : Number(age);
    if (
      studentAge !== undefined &&
      (!Number.isInteger(studentAge) || studentAge < 3 || studentAge > 30)
    ) {
      throw new AppError("Age must be a whole number between 3 and 30.");
    }

    const student = await prisma.student.create({
      data: {
        admission_number,
        first_name,
        last_name,
        age: studentAge,
        stream_id: Number(stream_id),
      },
      include: { stream: true },
    });

    res.status(201).json(student);
  } catch (error) {
    next(error);
  }
};

export const getStudents: RequestHandler = async (_req, res, next) => {
  try {
    const students = await prisma.student.findMany({
      include: { stream: true },
      orderBy: [{ last_name: "asc" }, { first_name: "asc" }],
    });

    res.json(students);
  } catch (error) {
    next(error);
  }
};

export const getStudentsByStream: RequestHandler = async (req, res, next) => {
  try {
    const streamId = Number(req.params.streamId);

    if (Number.isNaN(streamId)) {
      throw new AppError("streamId must be a number.");
    }

    const students = await prisma.student.findMany({
      where: { stream_id: streamId },
      include: { stream: true },
      orderBy: [{ last_name: "asc" }, { first_name: "asc" }],
    });

    res.json(students);
  } catch (error) {
    next(error);
  }
};

export const updateStudent: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { admission_number, first_name, last_name, age, stream_id } = req.body;

    if (Number.isNaN(id)) {
      throw new AppError("Student id must be a number.");
    }

    if (
      !admission_number &&
      !first_name &&
      !last_name &&
      age === undefined &&
      !stream_id
    ) {
      throw new AppError("Provide at least one field to update.");
    }

    const studentAge = age === undefined || age === "" ? undefined : Number(age);
    if (
      studentAge !== undefined &&
      (!Number.isInteger(studentAge) || studentAge < 3 || studentAge > 30)
    ) {
      throw new AppError("Age must be a whole number between 3 and 30.");
    }

    const student = await prisma.student.update({
      where: { id },
      data: {
        admission_number,
        first_name,
        last_name,
        age: studentAge,
        stream_id: stream_id ? Number(stream_id) : undefined,
      },
      include: { stream: true },
    });

    res.json(student);
  } catch (error) {
    next(error);
  }
};

export const deleteStudent: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      throw new AppError("Student id must be a number.");
    }

    await prisma.student.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const getStudentById: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      throw new AppError("Student id must be a number.");
    }

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        stream: true,
        assessments: {
          include: { subject: true },
          orderBy: { id: "desc" },
        },
      },
    });

    if (!student) {
      throw new AppError("Student not found.", 404);
    }

    res.json(student);
  } catch (error) {
    next(error);
  }
};
