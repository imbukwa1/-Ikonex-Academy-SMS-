import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { EmptyState } from "../components/feedback/EmptyState";
import { TableSkeleton } from "../components/feedback/Skeleton";
import { resultsApi, streamsApi } from "../services/api";
import { useState } from "react";

export function ReportsPage() {
  const [streamId, setStreamId] = useState("");
  const [term, setTerm] = useState("");
  const streamsQuery = useQuery({ queryKey: ["streams"], queryFn: streamsApi.list });
  const termsQuery = useQuery({ queryKey: ["terms"], queryFn: resultsApi.terms });
  const selectedStreamId = streamId || String(streamsQuery.data?.[0]?.id ?? "");
  const selectedTerm = term || termsQuery.data?.[0] || "";
  const reportQuery = useQuery({
    queryKey: ["class-report", selectedStreamId, selectedTerm],
    enabled: Boolean(selectedStreamId && selectedTerm),
    queryFn: () => resultsApi.classPerformance(Number(selectedStreamId), selectedTerm),
  });

  const rows = reportQuery.data?.rankings ?? [];
  const summary = reportQuery.data?.summary;

  return (
    <section className="mx-auto max-w-7xl space-y-6">
      <PageHeader eyebrow="Reports" title="Class Performance Reports" />
      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-soft md:grid-cols-2">
        <select value={selectedStreamId} onChange={(event) => setStreamId(event.target.value)} className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none">
          {(streamsQuery.data ?? []).map((stream) => <option key={stream.id} value={stream.id}>{stream.name}</option>)}
        </select>
        <select value={selectedTerm} onChange={(event) => setTerm(event.target.value)} className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none">
          {(termsQuery.data ?? []).map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
      {summary ? <div className="grid gap-4 md:grid-cols-4"><Summary label="Highest" value={summary.highest_score} /><Summary label="Lowest" value={summary.lowest_score} /><Summary label="Class Average" value={summary.class_average} /><Summary label="Students" value={summary.students_count} /></div> : null}
      {reportQuery.isLoading ? <TableSkeleton columns={6} /> : rows.length === 0 ? (
        <EmptyState icon={FileText} title="No report data found" description="Select a stream and term with completed assessments." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-soft">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-slate-50"><tr><Th>Position</Th><Th>Student</Th><Th>Admission</Th><Th>Total</Th><Th>Average</Th><Th>Subjects</Th></tr></thead>
            <tbody>{rows.map((row) => <tr key={row.student_id}><Td strong>{row.position_label}</Td><Td>{row.student_name}</Td><Td>{row.admission_number}</Td><Td strong>{row.total_marks}</Td><Td>{row.average.toFixed(2)}</Td><Td>{row.subjects_recorded}</Td></tr>)}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Summary({ label, value }: { label: string; value: number }) { return <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft"><p className="text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-slate-950">{value}</p></div>; }
function PageHeader({ eyebrow, title }: { eyebrow: string; title: string }) { return <div><p className="text-sm font-semibold text-academy-700">{eyebrow}</p><h1 className="mt-2 text-2xl font-bold text-slate-950">{title}</h1></div>; }
function Th({ children }: { children: React.ReactNode }) { return <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{children}</th>; }
function Td({ children, strong = false }: { children: React.ReactNode; strong?: boolean }) { return <td className={`border-b border-slate-100 px-4 py-3 ${strong ? "font-semibold text-slate-950" : "text-slate-600"}`}>{children}</td>; }
