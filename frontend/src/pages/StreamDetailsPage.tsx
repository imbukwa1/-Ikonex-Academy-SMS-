import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, UsersRound } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { ProfileSkeleton } from "../components/feedback/Skeleton";
import { streamsApi } from "../services/api";

export function StreamDetailsPage() {
  const id = Number(useParams().id);
  const query = useQuery({
    queryKey: ["stream", id],
    queryFn: () => streamsApi.getById(id),
    enabled: Number.isInteger(id) && id > 0,
  });
  if (query.isLoading) return <ProfileSkeleton />;
  if (!query.data) return <p className="text-red-600">Stream not found.</p>;
  const stream = query.data;
  return <section className="mx-auto max-w-7xl space-y-6">
    <Link to="/streams" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600"><ArrowLeft className="h-4 w-4" />Back to streams</Link>
    <div className="rounded-lg bg-academy-950 p-6 text-white"><p className="text-sm text-blue-200">Class Stream</p><h1 className="mt-1 text-3xl font-bold">{stream.name}</h1><p className="mt-2 text-sm text-slate-300">All school subjects are assigned automatically.</p></div>
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-lg border border-slate-200 bg-white shadow-soft"><header className="flex items-center gap-2 border-b p-4 font-bold"><BookOpen className="h-5 w-5 text-academy-700" />Subjects ({stream.subjects?.length ?? 0})</header><div className="divide-y">{(stream.subjects ?? []).map((subject) => <div key={subject.id} className="flex justify-between p-4"><span>{subject.name}</span><span className="text-slate-500">{subject.code}</span></div>)}</div></section>
      <section className="rounded-lg border border-slate-200 bg-white shadow-soft"><header className="flex items-center gap-2 border-b p-4 font-bold"><UsersRound className="h-5 w-5 text-academy-700" />Students ({stream.students?.length ?? 0})</header><div className="divide-y">{(stream.students ?? []).map((student) => <Link key={student.id} to={`/students/${student.id}`} className="flex justify-between p-4 hover:bg-slate-50"><span>{student.first_name} {student.last_name}</span><span className="text-slate-500">{student.admission_number}</span></Link>)}</div></section>
    </div>
  </section>;
}
