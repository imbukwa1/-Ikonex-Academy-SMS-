import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Plus, Search } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "../components/feedback/EmptyState";
import { TableSkeleton } from "../components/feedback/Skeleton";
import { subjectsApi } from "../services/api";

export function SubjectsPage() {
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const queryClient = useQueryClient();
  const subjectsQuery = useQuery({ queryKey: ["subjects"], queryFn: subjectsApi.list });
  const createSubject = useMutation({
    mutationFn: subjectsApi.create,
    onSuccess: () => {
      toast.success("Subject created");
      setName("");
      setCode("");
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
    onError: (error) => toast.error(error.message),
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !code.trim()) return;
    createSubject.mutate({ name: name.trim(), code: code.trim().toUpperCase() });
  }

  const subjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (subjectsQuery.data ?? []).filter(
      (subject) =>
        !query ||
        subject.name.toLowerCase().includes(query) ||
        subject.code.toLowerCase().includes(query)
    );
  }, [search, subjectsQuery.data]);

  return (
    <section className="mx-auto max-w-7xl space-y-6">
      <PageHeader eyebrow="Subject Management" title="Subjects" />
      <form onSubmit={handleSubmit} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-soft md:grid-cols-[1fr_180px_auto]">
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Subject name" className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none" />
        <input value={code} onChange={(event) => setCode(event.target.value)} placeholder="Code" className="h-11 rounded-lg border border-slate-200 px-3 text-sm uppercase outline-none" />
        <button className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-academy-700 px-4 text-sm font-semibold text-white hover:bg-blue-700"><Plus className="h-4 w-4" />Add Subject</button>
      </form>
      <div className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 shadow-soft">
        <Search className="h-4 w-4 text-slate-400" />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search subjects" className="w-full text-sm outline-none" />
      </div>
      {subjectsQuery.isLoading ? <TableSkeleton columns={4} /> : subjects.length === 0 ? (
        <EmptyState icon={BookOpen} title="No subjects found" description="Create subjects offered by the school." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-soft">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-slate-50"><tr><Th>Name</Th><Th>Code</Th><Th>Assigned Streams</Th></tr></thead>
            <tbody>{subjects.map((subject) => <tr key={subject.id}><Td strong>{subject.name}</Td><Td>{subject.code}</Td><Td>{subject.streams?.length ?? 0}</Td></tr>)}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function PageHeader({ eyebrow, title }: { eyebrow: string; title: string }) { return <div><p className="text-sm font-semibold text-academy-700">{eyebrow}</p><h1 className="mt-2 text-2xl font-bold text-slate-950">{title}</h1></div>; }
function Th({ children }: { children: React.ReactNode }) { return <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{children}</th>; }
function Td({ children, strong = false }: { children: React.ReactNode; strong?: boolean }) { return <td className={`border-b border-slate-100 px-4 py-3 ${strong ? "font-semibold text-slate-950" : "text-slate-600"}`}>{children}</td>; }
