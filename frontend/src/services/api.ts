import axios from "axios";
import type {
  Assessment,
  ClassPerformanceResults,
  CreateStreamInput,
  CreateStudentInput,
  CreateSubjectInput,
  ScoreInput,
  Stream,
  Student,
  StudentResults,
  Subject,
  SubjectStreamResults,
} from "./types";

export const apiClient = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ??
    import.meta.env.VITE_API_BASE_URL ??
    "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ?? "Something went wrong. Please try again.";

    return Promise.reject(new Error(message));
  }
);

export const streamsApi = {
  list: async () => {
    const { data } = await apiClient.get<Stream[]>("/streams");
    return data;
  },
  getById: async (id: number) => {
    const { data } = await apiClient.get<Stream>(`/streams/${id}`);
    return data;
  },
  create: async (payload: CreateStreamInput) => {
    const { data } = await apiClient.post<Stream>("/streams", payload);
    return data;
  },
  assignSubjects: async (streamId: number, subjectIds: number[]) => {
    const { data } = await apiClient.post<Stream>(`/streams/${streamId}/subjects`, {
      subjectIds,
    });
    return data;
  },
};

export const subjectsApi = {
  list: async () => {
    const { data } = await apiClient.get<Subject[]>("/subjects");
    return data;
  },
  create: async (payload: CreateSubjectInput) => {
    const { data } = await apiClient.post<Subject>("/subjects", payload);
    return data;
  },
  update: async (id: number, payload: Partial<CreateSubjectInput>) => {
    const { data } = await apiClient.patch<Subject>(`/subjects/${id}`, payload);
    return data;
  },
  delete: async (id: number) => {
    await apiClient.delete(`/subjects/${id}`);
  },
};

export const studentsApi = {
  list: async () => {
    const { data } = await apiClient.get<Student[]>("/students");
    return data;
  },
  getById: async (id: number) => {
    const { data } = await apiClient.get<Student>(`/students/${id}`);
    return data;
  },
  listByStream: async (streamId: number) => {
    const { data } = await apiClient.get<Student[]>(`/students/stream/${streamId}`);
    return data;
  },
  create: async (payload: CreateStudentInput) => {
    const { data } = await apiClient.post<Student>("/students", payload);
    return data;
  },
  update: async (id: number, payload: Partial<CreateStudentInput>) => {
    const { data } = await apiClient.patch<Student>(`/students/${id}`, payload);
    return data;
  },
  delete: async (id: number) => {
    await apiClient.delete(`/students/${id}`);
  },
};

export const scoresApi = {
  create: async (payload: ScoreInput) => {
    const { data } = await apiClient.post<Assessment>("/scores", payload);
    return data;
  },
  update: async (id: number, payload: Partial<Omit<ScoreInput, "student_id" | "subject_id">>) => {
    const { data } = await apiClient.patch<Assessment>(`/scores/${id}`, payload);
    return data;
  },
  bulkCreate: async (payloads: ScoreInput[]) => {
    return Promise.all(payloads.map((payload) => scoresApi.create(payload)));
  },
};

export const resultsApi = {
  subjectStream: async (subjectId: number, streamId: number, term?: string) => {
    const { data } = await apiClient.get<SubjectStreamResults>(
      `/results/subject/${subjectId}/stream/${streamId}`,
      { params: { term } }
    );
    return data;
  },
  student: async (studentId: number, term?: string) => {
    const { data } = await apiClient.get<StudentResults>(
      `/results/student/${studentId}`,
      { params: { term } }
    );
    return data;
  },
  classPerformance: async (streamId: number, term?: string) => {
    const { data } = await apiClient.get<ClassPerformanceResults>(
      `/results/class/${streamId}`,
      { params: { term } }
    );
    return data;
  },
};
