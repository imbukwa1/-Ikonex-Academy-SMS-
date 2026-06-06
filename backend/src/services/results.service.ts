import { prisma } from "../db";
import { AppError } from "../utils/AppError";

type GradeBoundary = {
  grade: string;
  min: number;
  max: number;
  remarks: string;
};

type RankedItem<T> = T & {
  position: number;
  position_label: string;
};

type SubjectRankingRow = {
  assessment_id: number;
  student_id: number;
  admission_number: string;
  student_name: string;
  subject_id: number;
  subject_name: string;
  stream_id: number;
  stream_name: string;
  ca_score: number;
  exam_score: number;
  total_score: number;
  grade: string;
  remarks: string;
  term: string;
  subject_position: bigint;
};

type ClassRankingRow = {
  student_id: number;
  admission_number: string;
  student_name: string;
  stream_id: number;
  stream_name: string;
  total_marks: bigint | number;
  average_score: number;
  subjects_recorded: bigint | number;
  overall_position: bigint;
};

export const GRADING_SCALE: GradeBoundary[] = [
  { grade: "A", min: 80, max: 100, remarks: "Exemplary" },
  { grade: "B", min: 70, max: 79, remarks: "Very good" },
  { grade: "C", min: 60, max: 69, remarks: "Satisfactory" },
  { grade: "D", min: 50, max: 59, remarks: "Fair effort" },
  { grade: "E", min: 0, max: 49, remarks: "Needs focused support" },
];

export function getGradeAndRemarks(totalScore: number) {
  const boundary = GRADING_SCALE.find(
    (scale) => totalScore >= scale.min && totalScore <= scale.max
  );

  return boundary ?? GRADING_SCALE[GRADING_SCALE.length - 1];
}

function ordinal(position: number) {
  const remainder10 = position % 10;
  const remainder100 = position % 100;

  if (remainder10 === 1 && remainder100 !== 11) {
    return `${position}st`;
  }

  if (remainder10 === 2 && remainder100 !== 12) {
    return `${position}nd`;
  }

  if (remainder10 === 3 && remainder100 !== 13) {
    return `${position}rd`;
  }

  return `${position}th`;
}

function toNumber(value: bigint | number) {
  return typeof value === "bigint" ? Number(value) : value;
}

function rankByScore<T extends { total_score: number }>(items: T[]): RankedItem<T>[] {
  let previousScore: number | null = null;
  let previousRank = 0;

  return items
    .sort((a, b) => b.total_score - a.total_score)
    .map((item, index) => {
      const rank = item.total_score === previousScore ? previousRank : index + 1;
      previousScore = item.total_score;
      previousRank = rank;

      return {
        ...item,
        position: rank,
        position_label: ordinal(rank),
      };
    });
}

function rankByTotalMarks<T extends { total_marks: number }>(items: T[]): RankedItem<T>[] {
  let previousTotal: number | null = null;
  let previousRank = 0;

  return items
    .sort((a, b) => b.total_marks - a.total_marks)
    .map((item, index) => {
      const rank = item.total_marks === previousTotal ? previousRank : index + 1;
      previousTotal = item.total_marks;
      previousRank = rank;

      return {
        ...item,
        position: rank,
        position_label: ordinal(rank),
      };
    });
}

async function getAssignedSubjectsForStream(streamId: number) {
  const stream = await prisma.stream.findUnique({
    where: { id: streamId },
    include: { subjects: { orderBy: { name: "asc" } } },
  });

  if (!stream) {
    throw new AppError("Stream not found.", 404);
  }

  return stream.subjects;
}

export async function calculateSubjectStreamResults(
  subjectId: number,
  streamId: number,
  term: string
) {
  const rows = await prisma.$queryRaw<SubjectRankingRow[]>`
    SELECT
      ranked.assessment_id,
      ranked.student_id,
      ranked.admission_number,
      ranked.student_name,
      ranked.subject_id,
      ranked.subject_name,
      ranked.stream_id,
      ranked.stream_name,
      ranked.ca_score,
      ranked.exam_score,
      ranked.total_score,
      ranked.grade,
      ranked.remarks,
      ranked.term,
      ranked.subject_position
    FROM (
      SELECT
        a.id AS assessment_id,
        st.id AS student_id,
        st.admission_number,
        CONCAT(st.first_name, ' ', st.last_name) AS student_name,
        su.id AS subject_id,
        su.name AS subject_name,
        s.id AS stream_id,
        s.name AS stream_name,
        a.ca_score,
        a.exam_score,
        a.total_score,
        a.grade,
        a.remarks,
        a.term,
        RANK() OVER (
          PARTITION BY a.subject_id, st.stream_id, a.term
          ORDER BY a.total_score DESC
        ) AS subject_position
      FROM assessments a
      INNER JOIN students st ON st.id = a.student_id
      INNER JOIN streams s ON s.id = st.stream_id
      INNER JOIN subjects su ON su.id = a.subject_id
      WHERE st.stream_id = ${streamId}
        AND a.subject_id = ${subjectId}
        AND a.term = ${term}
    ) ranked
    ORDER BY ranked.subject_position ASC, ranked.student_name ASC
  `;

  return {
    subject_id: subjectId,
    stream_id: streamId,
    term,
    results: rows.map((row) => ({
      ...row,
      subject_position: toNumber(row.subject_position),
      subject_position_label: ordinal(toNumber(row.subject_position)),
      position: toNumber(row.subject_position),
      position_label: ordinal(toNumber(row.subject_position)),
    })),
  };
}

export async function calculateStreamRankings(streamId: number, term: string) {
  const rows = await prisma.$queryRaw<ClassRankingRow[]>`
    SELECT
      ranked.student_id,
      ranked.admission_number,
      ranked.student_name,
      ranked.stream_id,
      ranked.stream_name,
      ranked.total_marks,
      ranked.average_score,
      ranked.subjects_recorded,
      ranked.overall_position
    FROM (
      SELECT
        st.id AS student_id,
        st.admission_number,
        CONCAT(st.first_name, ' ', st.last_name) AS student_name,
        s.id AS stream_id,
        s.name AS stream_name,
        COALESCE(SUM(a.total_score), 0) AS total_marks,
        COALESCE(ROUND(AVG(a.total_score)::numeric, 2), 0) AS average_score,
        COUNT(a.id) AS subjects_recorded,
        RANK() OVER (
          ORDER BY COALESCE(SUM(a.total_score), 0) DESC
        ) AS overall_position
      FROM students st
      INNER JOIN streams s ON s.id = st.stream_id
      LEFT JOIN assessments a ON a.student_id = st.id AND a.term = ${term}
      WHERE st.stream_id = ${streamId}
      GROUP BY st.id, st.admission_number, st.first_name, st.last_name, s.id, s.name
    ) ranked
    ORDER BY ranked.overall_position ASC, ranked.student_name ASC
  `;

  return rows.map((row) => {
    const position = toNumber(row.overall_position);
    const totalMarks = toNumber(row.total_marks);
    const subjectsRecorded = toNumber(row.subjects_recorded);

    return {
      student_id: row.student_id,
      admission_number: row.admission_number,
      student_name: row.student_name,
      stream_id: row.stream_id,
      stream_name: row.stream_name,
      total_marks: totalMarks,
      total_score: totalMarks,
      average: Number(row.average_score),
      subjects_recorded: subjectsRecorded,
      overall_position: position,
      overall_position_label: ordinal(position),
      position,
      position_label: ordinal(position),
    };
  });
}

export async function calculateClassPerformance(streamId: number, term: string) {
  const assignedSubjects = await getAssignedSubjectsForStream(streamId);
  const rankings = await calculateStreamRankings(streamId, term);
  const totals = rankings.map((ranking) => ranking.total_marks);
  const averages = rankings.map((ranking) => ranking.average);

  return {
    stream_id: streamId,
    term,
    expected_subjects: assignedSubjects.length,
    rankings: rankByTotalMarks(rankings),
    summary: {
      highest_score: totals.length > 0 ? Math.max(...totals) : 0,
      lowest_score: totals.length > 0 ? Math.min(...totals) : 0,
      class_average:
        averages.length > 0
          ? Number(
              (averages.reduce((sum, average) => sum + average, 0) / averages.length).toFixed(2)
            )
          : 0,
      students_count: rankings.length,
    },
  };
}

export async function listAssessmentTerms() {
  const terms = await prisma.assessment.findMany({
    distinct: ["term"],
    select: { term: true },
    orderBy: { term: "asc" },
  });

  return terms.map((item) => item.term);
}

export async function calculateStudentResults(studentId: number, term: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      stream: true,
      assessments: {
        where: term ? { term } : undefined,
        include: { subject: true },
        orderBy: { subject_id: "asc" },
      },
    },
  });

  if (!student) {
    throw new AppError("Student not found.", 404);
  }

  const assignedSubjects = await getAssignedSubjectsForStream(student.stream_id);
  const subjectRankings = await prisma.$queryRaw<SubjectRankingRow[]>`
    SELECT
      ranked.assessment_id,
      ranked.student_id,
      ranked.admission_number,
      ranked.student_name,
      ranked.subject_id,
      ranked.subject_name,
      ranked.stream_id,
      ranked.stream_name,
      ranked.ca_score,
      ranked.exam_score,
      ranked.total_score,
      ranked.grade,
      ranked.remarks,
      ranked.term,
      ranked.subject_position
    FROM (
      SELECT
        a.id AS assessment_id,
        st.id AS student_id,
        st.admission_number,
        CONCAT(st.first_name, ' ', st.last_name) AS student_name,
        su.id AS subject_id,
        su.name AS subject_name,
        s.id AS stream_id,
        s.name AS stream_name,
        a.ca_score,
        a.exam_score,
        a.total_score,
        a.grade,
        a.remarks,
        a.term,
        RANK() OVER (
          PARTITION BY a.subject_id, st.stream_id, a.term
          ORDER BY a.total_score DESC
        ) AS subject_position
      FROM assessments a
      INNER JOIN students st ON st.id = a.student_id
      INNER JOIN streams s ON s.id = st.stream_id
      INNER JOIN subjects su ON su.id = a.subject_id
      WHERE st.stream_id = ${student.stream_id}
        AND a.term = ${term}
    ) ranked
    WHERE ranked.student_id = ${student.id}
    ORDER BY ranked.subject_name ASC
  `;
  const classRankings = await calculateStreamRankings(student.stream_id, term);
  const currentStudentRanking = classRankings.find(
    (ranking) => ranking.student_id === student.id
  );
  const recordedSubjectIds = new Set(student.assessments.map((assessment) => assessment.subject_id));
  const missingSubjects = assignedSubjects.filter(
    (subject) => !recordedSubjectIds.has(subject.id)
  );

  const totalMarks = student.assessments.reduce(
    (sum, assessment) => sum + assessment.total_score,
    0
  );
  const average =
    student.assessments.length > 0
      ? Number((totalMarks / student.assessments.length).toFixed(2))
      : 0;

  return {
    student: {
      id: student.id,
      admission_number: student.admission_number,
      first_name: student.first_name,
      last_name: student.last_name,
      stream: student.stream,
    },
    term,
    expected_subjects: assignedSubjects.length,
    report_ready: missingSubjects.length === 0 && student.assessments.length > 0,
    missing_subjects: missingSubjects.map((subject) => ({
      id: subject.id,
      name: subject.name,
      code: subject.code,
    })),
    total_marks: totalMarks,
    average,
    overall_position: currentStudentRanking?.position ?? null,
    overall_position_label: currentStudentRanking?.position_label ?? null,
    subjects: student.assessments.map((assessment) => ({
      subject_id: assessment.subject_id,
      subject_name: assessment.subject.name,
      ca_score: assessment.ca_score,
      exam_score: assessment.exam_score,
      total_score: assessment.total_score,
      grade: assessment.grade,
      remarks: assessment.remarks,
      term: assessment.term,
      subject_position:
        subjectRankings.find((ranking) => ranking.subject_id === assessment.subject_id)
          ? toNumber(
              subjectRankings.find((ranking) => ranking.subject_id === assessment.subject_id)!
                .subject_position
            )
          : null,
      subject_position_label:
        subjectRankings.find((ranking) => ranking.subject_id === assessment.subject_id)
          ? ordinal(
              toNumber(
                subjectRankings.find((ranking) => ranking.subject_id === assessment.subject_id)!
                  .subject_position
              )
            )
          : null,
    })),
    class_rankings: classRankings,
  };
}
