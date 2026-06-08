import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { prisma } from "./db";
import { errorHandler } from "./middleware/errorHandler";
import gradingRoutes from "./routes/grading.routes";
import resultsRoutes from "./routes/results.routes";
import scoresRoutes from "./routes/scores.routes";
import streamsRoutes from "./routes/streams.routes";
import studentsRoutes from "./routes/students.routes";
import subjectsRoutes from "./routes/subjects.routes";

dotenv.config();

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    name: "Ikonex Academy SMS API",
    status: "running",
  });
});

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: "ok",
      database: "connected",
    });
  } catch (error) {
    console.error("Database health check failed:", error);
    res.status(503).json({
      status: "error",
      database: "disconnected",
      message: "The API cannot connect to PostgreSQL.",
    });
  }
});

app.use("/streams", streamsRoutes);
app.use("/subjects", subjectsRoutes);
app.use("/students", studentsRoutes);
app.use("/scores", scoresRoutes);
app.use("/results", resultsRoutes);
app.use("/grading-scales", gradingRoutes);

app.use(errorHandler);

const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
  console.log(`Ikonex SMS API running on port ${port}`);
});
