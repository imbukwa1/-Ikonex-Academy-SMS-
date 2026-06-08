import { PDFDownloadLink } from "@react-pdf/renderer";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  BookOpen,
  Download,
  FileWarning,
  GraduationCap,
  Pencil,
  Trash2,
  UserRound,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ProfileSkeleton } from "../components/feedback/Skeleton";
import {
  canGenerateStudentReport,
  StudentReportCard,
} from "../reports/StudentReportCard";
import { resultsApi, streamsApi, studentsApi } from "../services/api";

export function StudentProfilePage() {
  const { id } = useParams();
  const studentId = Number(id);
  const [term, setTerm] = useState("");
  const [editing, setEditing] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editAge, setEditAge] = useState("");
  const [editStreamId, setEditStreamId] = useState("");
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const studentQuery = useQuery({
    queryKey: ["student", studentId],
    queryFn: () => studentsApi.getById(studentId),
    enabled: Number.isInteger(studentId) && studentId > 0,
  });
  const termsQuery = useQuery({
    queryKey: ["student-terms", studentId],
    queryFn: () => resultsApi.studentTerms(studentId),
    enabled: Number.isInteger(studentId) && studentId > 0,
  });
  const streamsQuery = useQuery({ queryKey: ["streams"], queryFn: streamsApi.list });

  useEffect(() => {
    if (!term && termsQuery.data?.length) {
      setTerm(termsQuery.data[termsQuery.data.length - 1]);
    }
  }, [term, termsQuery.data]);

  const resultsQuery = useQuery({
    queryKey: ["student-results", studentId, term],
    queryFn: () => resultsApi.student(studentId, term),
    enabled: Boolean(studentId && term),
  });
  const updateStudent = useMutation({
    mutationFn: () => studentsApi.update(studentId, {
      first_name: editFirstName.trim(),
      last_name: editLastName.trim(),
      age: editAge ? Number(editAge) : undefined,
      stream_id: Number(editStreamId),
    }),
    onSuccess: () => {
      toast.success("Student updated");
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["student", studentId] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (error) => toast.error(error.message),
  });
  const deleteStudent = useMutation({
    mutationFn: () => studentsApi.delete(studentId),
    onSuccess: () => {
      toast.success("Student deleted");
      queryClient.invalidateQueries({ queryKey: ["students"] });
      navigate("/students");
    },
    onError: (error) => toast.error(error.message),
  });

  if (studentQuery.isLoading || termsQuery.isLoading) {
    return <ProfileSkeleton />;
  }

  if (studentQuery.isError || !studentQuery.data) {
    return (
      <MessagePanel
        title="Student not found"
        description={studentQuery.error?.message ?? "This student record is unavailable."}
      />
    );
  }

  const student = studentQuery.data;
  const results = resultsQuery.data;
  const reportReady = results ? canGenerateStudentReport(results) : false;
  const fullName = `${student.first_name} ${student.last_name}`;
  const fileName = `${student.admission_number}-${term || "report-card"}.pdf`
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-");

  function beginEditing() {
    setEditFirstName(student.first_name);
    setEditLastName(student.last_name);
    setEditAge(student.age ? String(student.age) : "");
    setEditStreamId(String(student.stream_id));
    setEditing(true);
  }

  return (
    <section className="mx-auto max-w-7xl space-y-6">
      <Link
        to="/students"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-academy-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to students
      </Link>

      <div className="flex flex-col justify-between gap-4 rounded-lg bg-academy-950 p-6 text-white shadow-soft md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-white/10">
            <UserRound className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-200">
              {student.admission_number}
            </p>
            <h1 className="mt-1 text-2xl font-bold">{fullName}</h1>
            <p className="mt-1 text-sm text-slate-300">
              {student.stream?.name ?? "No stream assigned"}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={beginEditing} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/40 bg-white/10 px-4 text-sm font-semibold text-white hover:bg-white/20"><Pencil className="h-4 w-4" />Edit</button>
          <button type="button" onClick={() => { if (confirm(`Delete ${fullName}? This also deletes their scores.`)) deleteStudent.mutate(); }} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-red-300 bg-red-950/40 px-4 text-sm font-semibold text-red-100 hover:bg-red-900/60"><Trash2 className="h-4 w-4" />Delete</button>
          <select
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            className="h-11 rounded-lg border border-white/20 bg-white px-3 text-sm font-medium text-slate-900 outline-none"
            disabled={!termsQuery.data?.length}
          >
            {!termsQuery.data?.length ? (
              <option value="">No terms available</option>
            ) : null}
            {(termsQuery.data ?? []).map((availableTerm) => (
              <option key={availableTerm} value={availableTerm}>
                {availableTerm}
              </option>
            ))}
          </select>

          {results && reportReady ? (
            <PDFDownloadLink
              document={
                <StudentReportCard
                  data={results}
                  academicYear={String(new Date().getFullYear())}
                />
              }
              fileName={fileName}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-500"
            >
              {({ loading }) => (
                <>
                  <Download className="h-4 w-4" />
                  {loading ? "Preparing PDF..." : "Download Report Card"}
                </>
              )}
            </PDFDownloadLink>
          ) : (
            <button
              type="button"
              disabled
              title="All assigned subject marks are required before generating a report."
              className="inline-flex h-11 cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-slate-600 px-4 text-sm font-semibold text-slate-300"
            >
              <Download className="h-4 w-4" />
              Download Report Card
            </button>
          )}
        </div>
      </div>

      {editing ? <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft"><h2 className="font-bold">Edit Student Information</h2><div className="mt-4 grid gap-4 md:grid-cols-4"><input className="input-control" value={editFirstName} onChange={(event) => setEditFirstName(event.target.value)} placeholder="First name" /><input className="input-control" value={editLastName} onChange={(event) => setEditLastName(event.target.value)} placeholder="Last name" /><input type="number" min={3} max={30} className="input-control" value={editAge} onChange={(event) => setEditAge(event.target.value)} placeholder="Age" /><select className="input-control" value={editStreamId} onChange={(event) => setEditStreamId(event.target.value)}>{(streamsQuery.data ?? []).map((stream) => <option key={stream.id} value={stream.id}>{stream.name}</option>)}</select></div><div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => setEditing(false)} className="rounded-lg border px-4 py-2 text-sm font-semibold">Cancel</button><button type="button" onClick={() => updateStudent.mutate()} className="rounded-lg bg-academy-700 px-4 py-2 text-sm font-semibold text-white">Save Changes</button></div></div> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard label="Admission Number" value={student.admission_number} />
        <InfoCard label="Age" value={student.age ? String(student.age) : "Not recorded"} />
        <InfoCard label="Class Stream" value={student.stream?.name ?? "Unassigned"} />
        <InfoCard
          label="Overall Position"
          value={results?.overall_position_label ?? "Pending"}
        />
      </div>

      {!termsQuery.data?.length ? (
        <MessagePanel
          title="No academic records yet"
          description="Enter scores for this student before generating a report card."
        />
      ) : resultsQuery.isLoading ? (
        <ProfileSkeleton />
      ) : resultsQuery.isError || !results ? (
        <MessagePanel
          title="Performance unavailable"
          description={resultsQuery.error?.message ?? "The selected term could not be loaded."}
        />
      ) : (
        <>
          {!reportReady ? (
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
              <FileWarning className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">Report card is not ready</p>
                <p className="mt-1 text-sm">
                  Missing marks for{" "}
                  {results.missing_subjects.map((subject) => subject.name).join(", ") ||
                    "one or more assigned subjects"}.
                </p>
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-3">
            <SummaryCard label="Total Marks" value={results.total_marks.toString()} />
            <SummaryCard label="Average Score" value={results.average.toFixed(2)} />
            <SummaryCard
              label="Subjects Recorded"
              value={`${results.subjects.length} / ${results.expected_subjects}`}
            />
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-soft">
            <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
              <BookOpen className="h-5 w-5 text-academy-700" />
              <div>
                <h2 className="font-bold text-slate-950">Academic Performance</h2>
                <p className="text-sm text-slate-500">{term}</p>
              </div>
            </div>
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <Th>Subject</Th>
                  <Th>CA /40</Th>
                  <Th>Exam /60</Th>
                  <Th>Total /100</Th>
                  <Th>Grade</Th>
                  <Th>Position</Th>
                  <Th>Remarks</Th>
                </tr>
              </thead>
              <tbody>
                {results.subjects.map((subject) => (
                  <tr key={subject.subject_id}>
                    <Td strong>{subject.subject_name}</Td>
                    <Td>{subject.ca_score}</Td>
                    <Td>{subject.exam_score}</Td>
                    <Td strong>{subject.total_score}</Td>
                    <Td>
                      <GradeBadge grade={subject.grade} />
                    </Td>
                    <Td>{subject.subject_position_label ?? "Pending"}</Td>
                    <Td>{subject.remarks}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-950">{value}</p>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-blue-100 bg-blue-50 p-5">
      <div className="flex items-center gap-2 text-blue-700">
        <GraduationCap className="h-4 w-4" />
        <p className="text-sm font-medium">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

function MessagePanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <BookOpen className="mx-auto h-9 w-9 text-slate-400" />
      <h2 className="mt-4 text-lg font-bold text-slate-950">{title}</h2>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function GradeBadge({ grade }: { grade: string }) {
  const colors: Record<string, string> = {
    A: "bg-emerald-100 text-emerald-700",
    B: "bg-blue-100 text-blue-700",
    C: "bg-amber-100 text-amber-700",
    D: "bg-orange-100 text-orange-700",
    E: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`inline-flex min-w-8 justify-center rounded-full px-2 py-1 text-xs font-bold ${
        colors[grade] ?? "bg-slate-100 text-slate-700"
      }`}
    >
      {grade}
    </span>
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
