import ExcelJS from "exceljs";
import dotenv from "dotenv";
import { prisma } from "../src/db";
import { getGradeAndRemarks } from "../src/services/results.service";

dotenv.config();

type RowData = {
  admissionNumber: string;
  firstName: string;
  lastName: string;
  streamName: string;
  subjectName: string;
  caScore: number;
  examScore: number;
  term: string;
};

type ImportSummary = {
  streams: Set<string>;
  subjects: Set<string>;
  students: Set<string>;
  assessmentsCreated: number;
  assessmentsUpdated: number;
  skippedRows: number;
};

const REQUIRED_HEADERS = [
  "Admission No",
  "Student Name",
  "Form",
  "Stream",
  "Subject",
  "CAT 1 (/30)",
  "CAT 2 (/20)",
  "Exam (/50)",
];

function normalizeHeader(value: unknown) {
  return String(value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

function text(value: unknown) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function removeHeadcountSuffix(value: string) {
  return value.replace(/\s+\d+$/, "").trim();
}

function splitStudentName(fullName: string) {
  const cleanedName = removeHeadcountSuffix(fullName);
  const parts = cleanedName.split(" ").filter(Boolean);

  if (parts.length === 0) {
    return { firstName: "Unknown", lastName: "Student" };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function normalizeStreamName(form: string, stream: string) {
  const normalizedForm = text(form);
  const normalizedStream = text(stream);

  if (!normalizedForm) {
    return removeHeadcountSuffix(normalizedStream);
  }

  if (!normalizedStream) {
    return removeHeadcountSuffix(normalizedForm);
  }

  const streamWithoutHeadcount = removeHeadcountSuffix(normalizedStream);
  const formMatch = normalizedForm.match(/^(.*?)(\d+)$/);

  if (formMatch && streamWithoutHeadcount.startsWith(formMatch[2])) {
    return `${formMatch[1].trim()} ${streamWithoutHeadcount}`;
  }

  if (streamWithoutHeadcount.toLowerCase().startsWith(normalizedForm.toLowerCase())) {
    return streamWithoutHeadcount;
  }

  return `${normalizedForm} ${streamWithoutHeadcount}`;
}

function subjectCode(subjectName: string) {
  const words = subjectName
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .split(" ")
    .filter(Boolean);

  const base =
    words.length === 1
      ? words[0].slice(0, 4)
      : words.map((word) => word[0]).join("").slice(0, 6);

  return base.toUpperCase();
}

function scaleScore(score: number, sourceMax: number, targetMax: number) {
  return Math.min(targetMax, Math.max(0, Math.round((score / sourceMax) * targetMax)));
}

function getHeaders(worksheet: ExcelJS.Worksheet) {
  const headerRow = worksheet.getRow(1);
  const headers = new Map<string, number>();

  headerRow.eachCell((cell, columnNumber) => {
    headers.set(normalizeHeader(cell.value), columnNumber);
  });

  const missingHeaders = REQUIRED_HEADERS.filter(
    (header) => !headers.has(normalizeHeader(header))
  );

  if (missingHeaders.length > 0) {
    throw new Error(`Missing required headers: ${missingHeaders.join(", ")}`);
  }

  return headers;
}

function getCell(row: ExcelJS.Row, headers: Map<string, number>, header: string) {
  return row.getCell(headers.get(normalizeHeader(header))!).value;
}

function parseRow(row: ExcelJS.Row, headers: Map<string, number>, term: string): RowData | null {
  const admissionNumber = text(getCell(row, headers, "Admission No"));
  const rawStudentName = text(getCell(row, headers, "Student Name"));
  const form = text(getCell(row, headers, "Form"));
  const stream = text(getCell(row, headers, "Stream"));
  const subjectName = text(getCell(row, headers, "Subject"));

  if (!admissionNumber || !rawStudentName || !subjectName) {
    return null;
  }

  const cat1 = numberValue(getCell(row, headers, "CAT 1 (/30)"));
  const cat2 = numberValue(getCell(row, headers, "CAT 2 (/20)"));
  const exam = numberValue(getCell(row, headers, "Exam (/50)"));
  const { firstName, lastName } = splitStudentName(rawStudentName);

  return {
    admissionNumber,
    firstName,
    lastName,
    streamName: normalizeStreamName(form, stream),
    subjectName,
    caScore: scaleScore(cat1 + cat2, 50, 40),
    examScore: scaleScore(exam, 50, 60),
    term,
  };
}

async function importRows(rows: RowData[]) {
  const summary: ImportSummary = {
    streams: new Set(),
    subjects: new Set(),
    students: new Set(),
    assessmentsCreated: 0,
    assessmentsUpdated: 0,
    skippedRows: 0,
  };

  for (const row of rows) {
    const stream = await prisma.stream.upsert({
      where: { name: row.streamName },
      update: {},
      create: { name: row.streamName },
    });
    summary.streams.add(stream.name);

    const subject = await prisma.subject.upsert({
      where: { code: subjectCode(row.subjectName) },
      update: { name: row.subjectName },
      create: { name: row.subjectName, code: subjectCode(row.subjectName) },
    });
    summary.subjects.add(subject.name);

    await prisma.stream.update({
      where: { id: stream.id },
      data: { subjects: { connect: { id: subject.id } } },
    });

    const student = await prisma.student.upsert({
      where: { admission_number: row.admissionNumber },
      update: {
        first_name: row.firstName,
        last_name: row.lastName,
        stream_id: stream.id,
      },
      create: {
        admission_number: row.admissionNumber,
        first_name: row.firstName,
        last_name: row.lastName,
        stream_id: stream.id,
      },
    });
    summary.students.add(student.admission_number);

    const totalScore = row.caScore + row.examScore;
    const { grade, remarks } = getGradeAndRemarks(totalScore);
    const existingAssessment = await prisma.assessment.findUnique({
      where: {
        student_id_subject_id_term: {
          student_id: student.id,
          subject_id: subject.id,
          term: row.term,
        },
      },
    });

    await prisma.assessment.upsert({
      where: {
        student_id_subject_id_term: {
          student_id: student.id,
          subject_id: subject.id,
          term: row.term,
        },
      },
      update: {
        ca_score: row.caScore,
        exam_score: row.examScore,
        total_score: totalScore,
        grade,
        remarks,
      },
      create: {
        student_id: student.id,
        subject_id: subject.id,
        ca_score: row.caScore,
        exam_score: row.examScore,
        total_score: totalScore,
        grade,
        remarks,
        term: row.term,
      },
    });

    if (existingAssessment) {
      summary.assessmentsUpdated += 1;
    } else {
      summary.assessmentsCreated += 1;
    }
  }

  return summary;
}

async function main() {
  const workbookPath = process.argv[2];
  const term = process.argv[3] ?? "Term 1";

  if (!workbookPath) {
    throw new Error("Usage: npm run import:workbook -- <workbook-path> [term]");
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(workbookPath);
  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    throw new Error("Workbook does not contain any worksheets.");
  }

  const headers = getHeaders(worksheet);
  const rows: RowData[] = [];
  let skippedRows = 0;

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }

    const parsedRow = parseRow(row, headers, term);
    if (parsedRow) {
      rows.push(parsedRow);
    } else {
      skippedRows += 1;
    }
  });

  const summary = await importRows(rows);
  summary.skippedRows = skippedRows;

  console.log("Workbook import complete");
  console.log({
    streams: summary.streams.size,
    subjects: summary.subjects.size,
    students: summary.students.size,
    assessmentsCreated: summary.assessmentsCreated,
    assessmentsUpdated: summary.assessmentsUpdated,
    skippedRows: summary.skippedRows,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
