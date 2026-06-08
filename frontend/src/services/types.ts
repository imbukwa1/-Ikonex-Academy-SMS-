export type Stream = {
  id: number;
  name: string;
  subjects?: Subject[];
  students?: Student[];
  _count?: {
    students: number;
  };
};

export type Subject = {
  id: number;
  name: string;
  code: string;
  streams?: Stream[];
};

export type Student = {
  id: number;
  admission_number: string;
  first_name: string;
  last_name: string;
  age?: number | null;
  stream_id: number;
  stream?: Stream;
  assessments?: Assessment[];
};

export type Assessment = {
  id: number;
  student_id: number;
  subject_id: number;
  ca_score: number;
  exam_score: number;
  total_score: number;
  grade: string;
  remarks: string;
  term: string;
  student?: Student;
  subject?: Subject;
};

export type ClassRanking = {
  student_id: number;
  admission_number: string;
  student_name: string;
  stream_id?: number;
  stream_name?: string;
  total_marks: number;
  total_score: number;
  average: number;
  subjects_recorded: number;
  overall_position?: number;
  overall_position_label?: string;
  position: number;
  position_label: string;
};

export type StudentResults = {
  student: Student;
  term: string;
  expected_subjects: number;
  report_ready: boolean;
  missing_subjects: Subject[];
  total_marks: number;
  average: number;
  overall_position: number | null;
  overall_position_label: string | null;
  subjects: Array<{
    subject_id: number;
    subject_name: string;
    ca_score: number;
    exam_score: number;
    total_score: number;
    grade: string;
    remarks: string;
    term: string;
    subject_position: number | null;
    subject_position_label: string | null;
  }>;
  class_rankings: ClassRanking[];
};

export type SubjectStreamResults = {
  subject_id: number;
  stream_id: number;
  term: string;
  results: Array<{
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
    subject_position: number;
    subject_position_label: string;
    position: number;
    position_label: string;
  }>;
};

export type ClassPerformanceResults = {
  stream_id: number;
  term: string;
  expected_subjects: number;
  rankings: ClassRanking[];
  summary: {
    highest_score: number;
    lowest_score: number;
    class_average: number;
    students_count: number;
  };
};

export type CreateStreamInput = {
  name: string;
  subjectIds?: number[];
};

export type CreateSubjectInput = {
  name: string;
  code: string;
  streamIds?: number[];
};

export type CreateStudentInput = {
  first_name: string;
  last_name: string;
  age?: number;
  stream_id: number;
};

export type ScoreInput = {
  student_id: number;
  subject_id: number;
  ca_score: number;
  exam_score: number;
  term: string;
};

export type BulkScoreInput = {
  subject_id: number;
  term: string;
  scores: Array<{
    student_id: number;
    ca_score: number;
    exam_score: number;
  }>;
};
