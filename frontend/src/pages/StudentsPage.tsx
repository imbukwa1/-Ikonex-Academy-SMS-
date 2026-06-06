import { useQuery } from "@tanstack/react-query";
import { Search, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "../components/feedback/EmptyState";
import { TableSkeleton } from "../components/feedback/Skeleton";
import { streamsApi, studentsApi } from "../services/api";

export function StudentsPage() {
  const [search, setSearch] = useState("");
  const [streamId, setStreamId] = useState("all");
  const studentsQuery = useQuery({ queryKey: ["students"], queryFn: studentsApi.list });
  const streamsQuery = useQuery({ queryKey: ["streams"], queryFn: streamsApi.list });

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

  return (
    <section className="mx-auto max-w-7xl space-y-6">
      <PageHeader eyebrow="Student Management" title="Students" />
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-soft md:flex-row">
        <div className="flex h-11 flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3">
          <Search className="h-4 w-4 text-slate-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or admission number" className="w-full text-sm outline-none" />
        </div>
        <select value={streamId} onChange={(event) => setStreamId(event.target.value)} className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none">
          <option value="all">All streams</option>
          {(streamsQuery.data ?? []).map((stream) => (
            <option key={stream.id} value={stream.id}>{stream.name}</option>
          ))}
        </select>
      </div>

      {studentsQuery.isLoading ? (
        <TableSkeleton columns={4} rows={8} />
      ) : students.length === 0 ? (
        <EmptyState icon={UsersRound} title="No students found" description="Try another search or stream filter." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-soft">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-slate-50">
              <tr>
                <Th>Admission No.</Th>
                <Th>Name</Th>
                <Th>Stream</Th>
                <Th>Assessments</Th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <Td strong>{student.admission_number}</Td>
                  <Td>{student.first_name} {student.last_name}</Td>
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
  return <div><p className="text-sm font-semibold text-academy-700">{eyebrow}</p><h1 className="mt-2 text-2xl font-bold text-slate-950">{title}</h1></div>;
}
function Th({ children }: { children: React.ReactNode }) {
  return <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{children}</th>;
}
function Td({ children, strong = false }: { children: React.ReactNode; strong?: boolean }) {
  return <td className={`border-b border-slate-100 px-4 py-3 ${strong ? "font-semibold text-slate-950" : "text-slate-600"}`}>{children}</td>;
}
