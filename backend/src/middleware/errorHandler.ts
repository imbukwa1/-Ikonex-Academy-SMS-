import { Prisma } from "@prisma/client";
import { ErrorRequestHandler } from "express";
import { AppError } from "../utils/AppError";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const fields = Array.isArray(error.meta?.target)
        ? error.meta.target.join(", ")
        : "unique field";

      return res.status(409).json({
        message: `A record with this ${fields} already exists.`,
      });
    }

    if (error.code === "P2025") {
      return res.status(404).json({ message: "Record not found." });
    }

    if (error.code === "P2003") {
      return res.status(409).json({
        message:
          "This record is still in use and cannot be deleted until its related records are removed.",
      });
    }

    if (error.code === "P2021" || error.code === "P2022") {
      console.error("Database schema is out of date:", error);
      return res.status(503).json({
        message: "The database is being updated. Please try again shortly.",
      });
    }
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    console.error("Database connection failed:", error);
    return res.status(503).json({
      message:
        "The database connection is unavailable. Check the server DATABASE_URL.",
    });
  }

  console.error(error);
  return res.status(500).json({ message: "Internal server error." });
};
