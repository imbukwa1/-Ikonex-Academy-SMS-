import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, UserPlus, UsersRound, X } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "../components/feedback/EmptyState";
import { TableSkeleton } from "../components/feedback/Skeleton";
import { streamsApi, studentsApi } from "../services/api";

type RegistrationForm = {
  admissionNumber: string;
  fullName: string;
  age: string;
  streamId: string;
};

const emptyForm: RegistrationForm = {
  admissionNumber: "",
  fullName: "",
  age: "",
  streamId: "",
};

export function StudentsPage() {
  const [search, setSearch] = useState("");
  const [streamId, setStreamId] = useState("all");
  const [showRegistration, setShowRegistration] = useState(false);
  const [form, setForm] = useState<RegistrationForm>(emptyForm);
  const queryClient = useQueryClient();
  const studentsQuery = useQuery({ queryKey: ["students"], queryFn: studentsApi.list });
  const streamsQuery = useQuery({ queryKey: ["streams"], queryFn: streamsApi.list });

  const createStudent = useMutation({
    mutationFn: studentsApi.create,
    onSuccess: () => {
      toast.success("Student registered successfully");
      setForm(emptyForm);
      setShowRegistration(false);
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["streams"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (error) => toast.error(error.message),
  });

  const students = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (studentsQuery.data ?? []).filter((student) => {
      const name = `${student.first_name} ${student.last_name}`.toLowerCase();
      const matchesSearch =
        !query ||
        name.includes(query) ||
        student.admission_number.toLowerCase().includes(query);
      const matchesStream = streamId === "all" || student.stream_id === Number(streamId);
      return matchesSearch && matchesStream;
    });
  }, [search, streamId, studentsQuery.data]);

  function updateForm(field: keyof RegistrationForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleRegistration(event: FormEvent) {
    event.preventDefault();
    const nameParts = form.fullName.trim().split(/\s+/).filter(Boolean);

    if (nameParts.length < 2) {
      toast.error("Enter the student's first and last name");
      return;
    }
    if (!form.admissionNumber.trim() || !form.streamId) {
      toast.error("Admission number and stream are required");
      return;
    }

    createStudent.mutate({
      admission_number: form.admissionNumber.trim(),
      first_name: nameParts[0],
      last_name: nameParts.slice(1).join(" "),
      age: form.age ? Number(form.age) : undefined,
      stream_id: Number(form.streamId),
    });
  }

  return (
    <section className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <PageHeader eyebrow="Student Management" title="Students" />
        <button
          type="button"
          onClick={() => setShowRegistration((open) => !open)}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-academy-700 px-4 text-sm font-semibold text-white hover:bg-blue-700"
        >
          {showRegistration ? <X className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
          {showRegistration ? "Close Form" : "Register Student"}
        </button>
      </div>

      {showRegistration ? (
        <form
          onSubmit={handleRegistration}
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft"
        >
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-950">Student Registration</h2>
            <p className="mt-1 text-sm text-slate-500">
              Enter the student details and select the class stream.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Admission Number">
              <input
                value={form.admissionNumber}
                onChange={(event) => updateForm("admissionNumber", event.target.value)}
                placeholder="e.g. IKX121"
                className="input-control"
                required
              />
            </Field>
            <Field label="Full Name">
              <input
                value={form.fullName}
                onChange={(event) => updateForm("fullName", event.target.value)}
                placeholder="First and last name"
                className="input-control"
                required
              />
            </Field>
            <Field label="Age">
              <input
                type="number"
                min={3}
                max={30}
                value={form.age}
                onChange={(event) => updateForm("age", event.target.value)}
                placeholder="Age"
                className="input-control"
              />
            </Field>
            <Field label="Class Stream">
              <select
                value={form.streamId}
                onChange={(event) => updateForm("streamId", event.target.value)}
                className="input-control"
                required
              >
                <option value="">Select stream</option>
                {(streamsQuery.data ?? []).map((stream) => (
                  <option key={stream.id} value={stream.id}>
                    {stream.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="mt-5 flex justify-end">
            <button
              disabled={createStudent.isPending}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-academy-700 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              {createStudent.isPending ? "Registering..." : "Register Student"}
            </button>
          </div>
        </form>
      ) : null}

      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-soft md:flex-row">
        <div className="flex h-11 flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or admission number"
            className="w-full text-sm outline-none"
          />
        </div>
        <select
          value={streamId}
          onChange={(event) => setStreamId(event.target.value)}
          className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none"
        >
          <option value="all">All streams</option>
          {(streamsQuery.data ?? []).map((stream) => (
            <option key={stream.id} value={stream.id}>
              {stream.name}
            </option>
          ))}
        </select>
      </div>

      {studentsQuery.isLoading ? (
        <TableSkeleton columns={5} rows={8} />
      ) : students.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="No students found"
          description="Try another search or stream filter."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-soft">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-slate-50">
              <tr>
                <Th>Admission No.</Th>
                <Th>Name</Th>
                <Th>Age</Th>
                <Th>Stream</Th>
                <Th>Assessments</Th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <Td strong>{student.admission_number}</Td>
                  <Td>
                    {student.first_name} {student.last_name}
                  </Td>
                  <Td>{student.age ?? "-"}</Td>
                  <Td>{student.stream?.name ?? "Unassigned"}</Td>
                  <Td>{student.assessments?.length ?? "-"}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
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
