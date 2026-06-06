import { useQuery } from "@tanstack/react-query";
import { ClipboardList } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "../components/feedback/EmptyState";
import { TableSkeleton } from "../components/feedback/Skeleton";
import { resultsApi, streamsApi, subjectsApi } from "../services/api";

export function AcademicRecordsPage() {
  const [streamId, setStreamId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [term, setTerm] = useState("");
  const streamsQuery = useQuery({ queryKey: ["streams"], queryFn: streamsApi.list });
  const subjectsQuery = useQuery({ queryKey: ["subjects"], queryFn: subjectsApi.list });
  const termsQuery = useQuery({ queryKey: ["terms"], queryFn: resultsApi.terms });

  const selectedTerm = term || termsQuery.data?.[0] || "";
  const selectedStreamId = streamId || String(streamsQuery.data?.[0]?.id ?? "");
  const selectedSubjectId = subjectId || String(subjectsQuery.data?.[0]?.id ?? "");

  const recordsQuery = useQuery({
    queryKey: ["subject-results", selectedStreamId, selectedSubjectId, selectedTerm],
    enabled: Boolean(selectedStreamId && selectedSubjectId && selectedTerm),
    queryFn: () => resultsApi.subjectStream(Number(selectedSubjectId), Number(selectedStreamId), selectedTerm),
  });

  const rows = recordsQuery.data?.results ?? [];
  const terms = useMemo(() => termsQuery.data ?? [], [termsQuery.data]);

  return (
    <section className="mx-auto max-w-7xl space-y-6">
      <PageHeader eyebrow="Assessment Records" title="Academic Records" />
      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-soft md:grid-cols-3">
        <Select value={selectedStreamId} onChange={setStreamId} options={(streamsQuery.data ?? []).map((stream) => ({ label: stream.name, value: String(stream.id) }))} />
        <Select value={selectedSubjectId} onChange={setSubjectId} options={(subjectsQuery.data ?? []).map((subject) => ({ label: subject.name, value: String(subject.id) }))} />
        <Select value={selectedTerm} onChange={setTerm} options={terms.map((item) => ({ label: item, value: item }))} />
      </div>
      {recordsQuery.isLoading ? <TableSkeleton columns={7} /> : rows.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No records found" description="Choose a stream, subject, and term with recorded marks." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-soft">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-slate-50"><tr><Th>Position</Th><Th>Student</Th><Th>CA</Th><Th>Exam</Th><Th>Total</Th><Th>Grade</Th><Th>Remarks</Th></tr></thead>
            <tbody>{rows.map((row) => <tr key={row.assessment_id}><Td strong>{row.position_label}</Td><Td>{row.student_name}</Td><Td>{row.ca_score}</Td><Td>{row.exam_score}</Td><Td strong>{row.total_score}</Td><Td>{row.grade}</Td><Td>{row.remarks}</Td></tr>)}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: Array<{ label: string; value: string }> }) {
  return <select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none">{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>;
}
function PageHeader({ eyebrow, title }: { eyebrow: string; title: string }) { return <div><p className="text-sm font-semibold text-academy-700">{eyebrow}</p><h1 className="mt-2 text-2xl font-bold text-slate-950">{title}</h1></div>; }
function Th({ children }: { children: React.ReactNode }) { return <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{children}</th>; }
function Td({ children, strong = false }: { children: React.ReactNode; strong?: boolean }) { return <td className={`border-b border-slate-100 px-4 py-3 ${strong ? "font-semibold text-slate-950" : "text-slate-600"}`}>{children}</td>; }
