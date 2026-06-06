import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, GraduationCap, Plus, UsersRound } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "../components/feedback/EmptyState";
import { TableSkeleton } from "../components/feedback/Skeleton";
import { streamsApi } from "../services/api";

export function StreamsPage() {
  const [name, setName] = useState("");
  const queryClient = useQueryClient();
  const streamsQuery = useQuery({ queryKey: ["streams"], queryFn: streamsApi.list });
  const createStream = useMutation({
    mutationFn: streamsApi.create,
    onSuccess: () => {
      toast.success("Class stream created");
      setName("");
      queryClient.invalidateQueries({ queryKey: ["streams"] });
    },
    onError: (error) => toast.error(error.message),
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    createStream.mutate({ name: name.trim() });
  }

  const streams = streamsQuery.data ?? [];

  return (
    <section className="mx-auto max-w-7xl space-y-6">
      <PageHeader eyebrow="Class Stream Management" title="Class Streams" />

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-soft sm:flex-row">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Enter stream name, e.g. Form 1A"
          className="h-11 flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-academy-700"
        />
        <button className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-academy-700 px-4 text-sm font-semibold text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" />
          Add Stream
        </button>
      </form>

      {streamsQuery.isLoading ? (
        <TableSkeleton columns={4} />
      ) : streams.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No streams found" description="Create a stream to begin organizing students." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {streams.map((stream) => (
            <div key={stream.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Class Stream</p>
                  <h3 className="mt-1 text-xl font-bold text-slate-950">{stream.name}</h3>
                </div>
                <div className="rounded-lg bg-blue-50 p-2 text-blue-700">
                  <GraduationCap className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <StatPill icon={UsersRound} label="Students" value={stream._count?.students ?? stream.students?.length ?? 0} />
                <StatPill icon={BookOpen} label="Subjects" value={stream.subjects?.length ?? 0} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {(stream.subjects ?? []).slice(0, 5).map((subject) => (
                  <span key={subject.id} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{subject.name}</span>
                ))}
              </div>
            </div>
          ))}
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

function StatPill({ icon: Icon, label, value }: { icon: typeof UsersRound; label: string; value: number }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon className="h-4 w-4" />
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-1 text-lg font-bold text-slate-950">{value}</p>
    </div>
  );
}
