import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Copy, Eraser, Save, Settings } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "../components/feedback/EmptyState";
import { TableSkeleton } from "../components/feedback/Skeleton";
import {
  gradingApi,
  scoresApi,
  streamsApi,
  studentsApi,
} from "../services/api";
import type { GradingScale } from "../services/types";

const TERMS = ["Term 1", "Term 2", "Term 3"];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, index) => currentYear - 2 + index);

export function AcademicRecordsPage() {
  const [streamId, setStreamId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [term, setTerm] = useState("Term 1");
  const [year, setYear] = useState(String(currentYear));
  const [assessmentType, setAssessmentType] = useState<"CAT" | "EXAM">("CAT");
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [showGrading, setShowGrading] = useState(false);
  const queryClient = useQueryClient();

  const streamsQuery = useQuery({ queryKey: ["streams"], queryFn: streamsApi.list });
  const selectedStreamId = streamId || String(streamsQuery.data?.[0]?.id ?? "");
  const selectedStream = (streamsQuery.data ?? []).find(
    (stream) => stream.id === Number(selectedStreamId)
  );
  const subjects = selectedStream?.subjects ?? [];
  const selectedSubjectId =
    subjectId && subjects.some((subject) => subject.id === Number(subjectId))
      ? subjectId
      : String(subjects[0]?.id ?? "");
  const recordPeriod = `${term} ${year}`;

  const studentsQuery = useQuery({
    queryKey: ["students", "stream", selectedStreamId],
    enabled: Boolean(selectedStreamId),
    queryFn: () => studentsApi.listByStream(Number(selectedStreamId)),
  });
  const entriesQuery = useQuery({
    queryKey: ["score-entries", selectedStreamId, selectedSubjectId, recordPeriod],
    enabled: Boolean(selectedStreamId && selectedSubjectId),
    queryFn: () =>
      scoresApi.entries(
        Number(selectedSubjectId),
        Number(selectedStreamId),
        recordPeriod
      ),
  });

  const existingByStudent = useMemo(
    () => new Map((entriesQuery.data ?? []).map((entry) => [entry.student_id, entry])),
    [entriesQuery.data]
  );

  useEffect(() => {
    setDrafts(
      Object.fromEntries(
        (studentsQuery.data ?? []).map((student) => {
          const entry = existingByStudent.get(student.id);
          const recorded =
            assessmentType === "CAT" ? entry?.ca_recorded : entry?.exam_recorded;
          const value = assessmentType === "CAT" ? entry?.ca_score : entry?.exam_score;
          return [student.id, recorded ? String(value) : ""];
        })
      )
    );
  }, [assessmentType, existingByStudent, studentsQuery.data]);

  const saveScores = useMutation({
    mutationFn: scoresApi.saveBulk,
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["score-entries"] });
      queryClient.invalidateQueries({ queryKey: ["subject-results"] });
      queryClient.invalidateQueries({ queryKey: ["terms"] });
      queryClient.invalidateQueries({ queryKey: ["student-terms"] });
      queryClient.invalidateQueries({ queryKey: ["class-report"] });
    },
    onError: (error) => toast.error(error.message),
  });

  const students = studentsQuery.data ?? [];
  const maximum = assessmentType === "CAT" ? 40 : 60;

  function handleSave() {
    if (!selectedSubjectId || students.length === 0) return;
    const incomplete = students.find((student) => drafts[student.id] === "");
    if (incomplete) {
      toast.error(`Enter a score for ${incomplete.first_name} ${incomplete.last_name}`);
      return;
    }
    const invalid = students.find((student) => {
      const value = Number(drafts[student.id]);
      return !Number.isFinite(value) || value < 0 || value > maximum;
    });
    if (invalid) {
      toast.error(`${assessmentType} scores must be between 0 and ${maximum}`);
      return;
    }
    saveScores.mutate({
      subject_id: Number(selectedSubjectId),
      term: recordPeriod,
      assessment_type: assessmentType,
      scores: students.map((student) => ({
        student_id: student.id,
        score: Number(drafts[student.id]),
      })),
    });
  }

  return (
    <section className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <PageHeader eyebrow="Assessment Records" title="Batch Score Entry" />
        <button
          type="button"
          onClick={() => setShowGrading((value) => !value)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700"
        >
          <Settings className="h-4 w-4" />
          Grading Scale
        </button>
      </div>

      {showGrading ? <GradingScaleEditor /> : null}

      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-soft md:grid-cols-5">
        <Select label="Class Stream" value={selectedStreamId} onChange={(value) => { setStreamId(value); setSubjectId(""); }} options={(streamsQuery.data ?? []).map((item) => ({ label: item.name, value: String(item.id) }))} />
        <Select label="Subject" value={selectedSubjectId} onChange={setSubjectId} options={subjects.map((item) => ({ label: item.name, value: String(item.id) }))} />
        <Select label="Term" value={term} onChange={setTerm} options={TERMS.map((item) => ({ label: item, value: item }))} />
        <Select label="Academic Year" value={year} onChange={setYear} options={YEARS.map((item) => ({ label: String(item), value: String(item) }))} />
        <Select label="Assessment" value={assessmentType} onChange={(value) => setAssessmentType(value as "CAT" | "EXAM")} options={[{ label: "CAT /40", value: "CAT" }, { label: "Exam /60", value: "EXAM" }]} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Entering {assessmentType} for {term}, {year}. CAT /40 and Exam /60 combine to Total /100.
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={() => setDrafts(Object.fromEntries(students.map((student) => [student.id, ""])))} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700">
            <Eraser className="h-4 w-4" /> Clear All
          </button>
          <button type="button" onClick={handleSave} disabled={!students.length || saveScores.isPending} className="inline-flex h-10 items-center gap-2 rounded-lg bg-academy-700 px-4 text-sm font-semibold text-white disabled:opacity-50">
            <Save className="h-4 w-4" /> {saveScores.isPending ? "Saving..." : `Save ${assessmentType} Scores`}
          </button>
        </div>
      </div>

      {studentsQuery.isLoading || entriesQuery.isLoading ? <TableSkeleton columns={6} rows={10} /> : !subjects.length ? (
        <EmptyState icon={ClipboardList} title="No subjects assigned" description="Subjects are automatically assigned when created. Add a subject first." />
      ) : !students.length ? (
        <EmptyState icon={ClipboardList} title="No students in this stream" description="Register students before entering scores." />
      ) : (
        <div className="max-h-[620px] overflow-auto rounded-lg border border-slate-200 bg-white shadow-soft">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50"><tr><Th>#</Th><Th>Admission</Th><Th>Student</Th><Th>{assessmentType} /{maximum}</Th><Th>Current Total</Th><Th>Copy</Th></tr></thead>
            <tbody>{students.map((student, index) => {
              const value = drafts[student.id] ?? "";
              const numeric = Number(value);
              const invalid = value !== "" && (numeric < 0 || numeric > maximum);
              const existing = existingByStudent.get(student.id);
              const other = assessmentType === "CAT" ? existing?.exam_score ?? 0 : existing?.ca_score ?? 0;
              const otherRecorded = assessmentType === "CAT" ? existing?.exam_recorded : existing?.ca_recorded;
              const total = value !== "" && otherRecorded && !invalid ? numeric + other : null;
              return <tr key={student.id}><Td>{index + 1}</Td><Td strong>{student.admission_number}</Td><Td>{student.first_name} {student.last_name}</Td><Td><input type="number" min={0} max={maximum} value={value} onChange={(event) => setDrafts((current) => ({ ...current, [student.id]: event.target.value }))} className={`h-9 w-24 rounded-lg border px-2 ${invalid ? "border-red-400 bg-red-50" : "border-slate-200"}`} /></Td><Td strong>{total ?? "Pending"}</Td><Td><button type="button" disabled={index === 0} onClick={() => setDrafts((current) => ({ ...current, [student.id]: current[students[index - 1].id] ?? "" }))} className="rounded-lg p-2 text-slate-500 disabled:opacity-30"><Copy className="h-4 w-4" /></button></Td></tr>;
            })}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function GradingScaleEditor() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["grading-scale"], queryFn: gradingApi.list });
  const [rows, setRows] = useState<GradingScale[]>([]);
  useEffect(() => { if (query.data) setRows(query.data); }, [query.data]);
  const mutation = useMutation({
    mutationFn: gradingApi.update,
    onSuccess: (data) => { setRows(data); queryClient.setQueryData(["grading-scale"], data); toast.success("Grading scale updated"); },
    onError: (error) => toast.error(error.message),
  });
  return <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft"><h2 className="font-bold">Configurable Grading Scale</h2><div className="mt-3 overflow-x-auto"><table className="min-w-full text-sm"><thead><tr><Th>Grade</Th><Th>Minimum</Th><Th>Maximum</Th><Th>Remarks</Th></tr></thead><tbody>{rows.map((row, index) => <tr key={row.grade}><Td strong>{row.grade}</Td><Td><ScaleInput value={row.min} onChange={(value) => setRows((current) => current.map((item, rowIndex) => rowIndex === index ? { ...item, min: value } : item))} /></Td><Td><ScaleInput value={row.max} onChange={(value) => setRows((current) => current.map((item, rowIndex) => rowIndex === index ? { ...item, max: value } : item))} /></Td><Td><input value={row.remarks} onChange={(event) => setRows((current) => current.map((item, rowIndex) => rowIndex === index ? { ...item, remarks: event.target.value } : item))} className="input-control" /></Td></tr>)}</tbody></table></div><div className="mt-4 flex justify-end"><button type="button" onClick={() => mutation.mutate(rows)} className="rounded-lg bg-academy-700 px-4 py-2 text-sm font-semibold text-white">Save Grading Scale</button></div></div>;
}

function ScaleInput({ value, onChange }: { value: number; onChange: (value: number) => void }) { return <input type="number" min={0} max={100} value={value} onChange={(event) => onChange(Number(event.target.value))} className="h-10 w-24 rounded-lg border border-slate-200 px-2" />; }
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ label: string; value: string }> }) { return <label><span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="input-control">{!options.length ? <option value="">No options available</option> : null}{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>; }
function PageHeader({ eyebrow, title }: { eyebrow: string; title: string }) { return <div><p className="text-sm font-semibold text-academy-700">{eyebrow}</p><h1 className="mt-2 text-2xl font-bold text-slate-950">{title}</h1></div>; }
function Th({ children }: { children: React.ReactNode }) { return <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{children}</th>; }
function Td({ children, strong = false }: { children: React.ReactNode; strong?: boolean }) { return <td className={`border-b border-slate-100 px-4 py-3 ${strong ? "font-semibold text-slate-950" : "text-slate-600"}`}>{children}</td>; }
