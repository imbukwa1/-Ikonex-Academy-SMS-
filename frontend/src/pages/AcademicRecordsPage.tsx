import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Copy, Eraser, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "../components/feedback/EmptyState";
import { TableSkeleton } from "../components/feedback/Skeleton";
import {
  resultsApi,
  scoresApi,
  streamsApi,
  studentsApi,
} from "../services/api";

type ScoreDraft = {
  ca: string;
  exam: string;
};

export function AcademicRecordsPage() {
  const [streamId, setStreamId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [term, setTerm] = useState("");
  const [drafts, setDrafts] = useState<Record<number, ScoreDraft>>({});
  const queryClient = useQueryClient();

  const streamsQuery = useQuery({ queryKey: ["streams"], queryFn: streamsApi.list });
  const termsQuery = useQuery({ queryKey: ["terms"], queryFn: resultsApi.terms });

  const selectedStreamId = streamId || String(streamsQuery.data?.[0]?.id ?? "");
  const selectedStream = (streamsQuery.data ?? []).find(
    (stream) => stream.id === Number(selectedStreamId)
  );
  const availableSubjects = selectedStream?.subjects ?? [];
  const selectedSubjectId =
    subjectId && availableSubjects.some((subject) => subject.id === Number(subjectId))
      ? subjectId
      : String(availableSubjects[0]?.id ?? "");
  const selectedTerm = term || termsQuery.data?.[0] || "";

  const studentsQuery = useQuery({
    queryKey: ["students", "stream", selectedStreamId],
    enabled: Boolean(selectedStreamId),
    queryFn: () => studentsApi.listByStream(Number(selectedStreamId)),
  });

  const recordsQuery = useQuery({
    queryKey: ["subject-results", selectedStreamId, selectedSubjectId, selectedTerm],
    enabled: Boolean(selectedStreamId && selectedSubjectId && selectedTerm),
    queryFn: () =>
      resultsApi.subjectStream(
        Number(selectedSubjectId),
        Number(selectedStreamId),
        selectedTerm
      ),
  });

  const existingScores = useMemo(
    () =>
      new Map(
        (recordsQuery.data?.results ?? []).map((result) => [
          result.student_id,
          { ca: String(result.ca_score), exam: String(result.exam_score) },
        ])
      ),
    [recordsQuery.data]
  );

  useEffect(() => {
    const nextDrafts: Record<number, ScoreDraft> = {};
    for (const student of studentsQuery.data ?? []) {
      nextDrafts[student.id] = existingScores.get(student.id) ?? { ca: "", exam: "" };
    }
    setDrafts(nextDrafts);
  }, [existingScores, studentsQuery.data]);

  const saveScores = useMutation({
    mutationFn: scoresApi.saveBulk,
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({
        queryKey: ["subject-results", selectedStreamId, selectedSubjectId, selectedTerm],
      });
      queryClient.invalidateQueries({ queryKey: ["dashboard-performance"] });
      queryClient.invalidateQueries({ queryKey: ["class-report"] });
    },
    onError: (error) => toast.error(error.message),
  });

  const students = studentsQuery.data ?? [];

  function updateDraft(studentId: number, field: keyof ScoreDraft, value: string) {
    setDrafts((current) => ({
      ...current,
      [studentId]: { ...current[studentId], [field]: value },
    }));
  }

  function clearAll() {
    setDrafts(
      Object.fromEntries(students.map((student) => [student.id, { ca: "", exam: "" }]))
    );
  }

  function copyPrevious(index: number) {
    if (index === 0) return;
    const previous = drafts[students[index - 1].id];
    if (!previous) return;
    setDrafts((current) => ({
      ...current,
      [students[index].id]: { ...previous },
    }));
  }

  function handleSave() {
    if (!selectedSubjectId || !selectedTerm) {
      toast.error("Select a stream, subject, and term");
      return;
    }

    const incomplete = students.find((student) => {
      const score = drafts[student.id];
      return !score || score.ca === "" || score.exam === "";
    });
    if (incomplete) {
      toast.error(
        `Enter both scores for ${incomplete.first_name} ${incomplete.last_name}`
      );
      return;
    }

    const invalid = students.find((student) => {
      const score = drafts[student.id];
      const ca = Number(score.ca);
      const exam = Number(score.exam);
      return ca < 0 || ca > 40 || exam < 0 || exam > 60;
    });
    if (invalid) {
      toast.error(
        `Check the score limits for ${invalid.first_name} ${invalid.last_name}`
      );
      return;
    }

    saveScores.mutate({
      subject_id: Number(selectedSubjectId),
      term: selectedTerm,
      scores: students.map((student) => ({
        student_id: student.id,
        ca_score: Number(drafts[student.id].ca),
        exam_score: Number(drafts[student.id].exam),
      })),
    });
  }

  return (
    <section className="mx-auto max-w-7xl space-y-6">
      <PageHeader eyebrow="Assessment Records" title="Batch Score Entry" />

      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-soft md:grid-cols-3">
        <Select
          label="Class Stream"
          value={selectedStreamId}
          onChange={(value) => {
            setStreamId(value);
            setSubjectId("");
          }}
          options={(streamsQuery.data ?? []).map((stream) => ({
            label: stream.name,
            value: String(stream.id),
          }))}
        />
        <Select
          label="Subject"
          value={selectedSubjectId}
          onChange={setSubjectId}
          options={availableSubjects.map((subject) => ({
            label: subject.name,
            value: String(subject.id),
          }))}
        />
        <Select
          label="Term"
          value={selectedTerm}
          onChange={setTerm}
          options={(termsQuery.data ?? []).map((item) => ({
            label: item,
            value: item,
          }))}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          CA is marked out of 40 and Exam is marked out of 60.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={clearAll}
            disabled={students.length === 0}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <Eraser className="h-4 w-4" />
            Clear All
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={students.length === 0 || saveScores.isPending}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-academy-700 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saveScores.isPending ? "Saving..." : "Save Class Scores"}
          </button>
        </div>
      </div>

      {studentsQuery.isLoading || recordsQuery.isLoading ? (
        <TableSkeleton columns={6} rows={10} />
      ) : students.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No students in this stream"
          description="Register students in the selected stream before entering scores."
        />
      ) : availableSubjects.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No subjects assigned"
          description="Assign subjects to this class stream before entering scores."
        />
      ) : (
        <div className="max-h-[620px] overflow-auto rounded-lg border border-slate-200 bg-white shadow-soft">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50">
              <tr>
                <Th>#</Th>
                <Th>Admission</Th>
                <Th>Student</Th>
                <Th>CA /40</Th>
                <Th>Exam /60</Th>
                <Th>Total /100</Th>
                <Th>Copy</Th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => {
                const draft = drafts[student.id] ?? { ca: "", exam: "" };
                const ca = Number(draft.ca);
                const exam = Number(draft.exam);
                const caInvalid = draft.ca !== "" && (ca < 0 || ca > 40);
                const examInvalid = draft.exam !== "" && (exam < 0 || exam > 60);
                const total =
                  draft.ca !== "" && draft.exam !== "" && !caInvalid && !examInvalid
                    ? ca + exam
                    : null;

                return (
                  <tr key={student.id}>
                    <Td>{index + 1}</Td>
                    <Td strong>{student.admission_number}</Td>
                    <Td>
                      {student.first_name} {student.last_name}
                    </Td>
                    <Td>
                      <ScoreInput
                        value={draft.ca}
                        max={40}
                        invalid={caInvalid}
                        onChange={(value) => updateDraft(student.id, "ca", value)}
                      />
                    </Td>
                    <Td>
                      <ScoreInput
                        value={draft.exam}
                        max={60}
                        invalid={examInvalid}
                        onChange={(value) => updateDraft(student.id, "exam", value)}
                      />
                    </Td>
                    <Td strong>{total ?? "-"}</Td>
                    <Td>
                      <button
                        type="button"
                        onClick={() => copyPrevious(index)}
                        disabled={index === 0}
                        title="Copy scores from previous student"
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ScoreInput({
  value,
  max,
  invalid,
  onChange,
}: {
  value: string;
  max: number;
  invalid: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <input
      type="number"
      min={0}
      max={max}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`h-9 w-24 rounded-lg border px-2 text-sm outline-none ${
        invalid
          ? "border-red-400 bg-red-50 text-red-700"
          : "border-slate-200 focus:border-academy-700"
      }`}
    />
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <label>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none"
      >
        {options.length === 0 ? <option value="">No options available</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function PageHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-academy-700">{eyebrow}</p>
      <h1 className="mt-2 text-2xl font-bold text-slate-950">{title}</h1>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}

function Td({
  children,
  strong = false,
}: {
  children: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <td
      className={`border-b border-slate-100 px-4 py-3 ${
        strong ? "font-semibold text-slate-950" : "text-slate-600"
      }`}
    >
      {children}
    </td>
  );
}
