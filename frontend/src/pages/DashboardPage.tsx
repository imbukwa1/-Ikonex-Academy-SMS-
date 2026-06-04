import { useQuery } from "@tanstack/react-query";
import {
  Award,
  BookOpen,
  ClipboardPenLine,
  FileText,
  GraduationCap,
  Plus,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState } from "../components/feedback/EmptyState";
import { StatCardSkeleton } from "../components/feedback/Skeleton";
import { resultsApi, streamsApi, studentsApi, subjectsApi } from "../services/api";
import { getPositionBadgeClass } from "../utils/positionBadges";

const DEFAULT_TERM = "Term 1";

type StreamPerformanceDatum = {
  streamId: number;
  stream: string;
  average: number;
  students: number;
};

export function DashboardPage() {
  const statsQuery = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [streams, students, subjects] = await Promise.all([
        streamsApi.list(),
        studentsApi.list(),
        subjectsApi.list(),
      ]);

      return { streams, students, subjects };
    },
  });

  const performanceQuery = useQuery({
    queryKey: ["stream-performance", DEFAULT_TERM, statsQuery.data?.streams.map((stream) => stream.id)],
    enabled: Boolean(statsQuery.data?.streams.length),
    queryFn: async () => {
      const streams = statsQuery.data?.streams ?? [];
      const classReports = await Promise.all(
        streams.map((stream) =>
          resultsApi
            .classPerformance(stream.id, DEFAULT_TERM)
            .then((report) => ({ stream, report }))
            .catch(() => ({ stream, report: null }))
        )
      );

      return classReports.map<StreamPerformanceDatum>(({ stream, report }) => ({
        streamId: stream.id,
        stream: stream.name,
        average: report?.summary.class_average ?? 0,
        students: report?.summary.students_count ?? stream._count?.students ?? 0,
      }));
    },
  });

  const isLoading = statsQuery.isLoading;
  const streams = statsQuery.data?.streams ?? [];
  const students = statsQuery.data?.students ?? [];
  const subjects = statsQuery.data?.subjects ?? [];
  const performance = performanceQuery.data ?? [];

  const topStream = performance.reduce<StreamPerformanceDatum | null>(
    (currentTop, item) =>
      !currentTop || item.average > currentTop.average ? item : currentTop,
    null
  );

  return (
    <section className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold text-academy-700">Ikonex Overview</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            Academic operations at a glance
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Track enrolment, subject coverage, class stream performance, and daily
            academic actions from one production dashboard.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <QuickAction to="/students" icon={Plus} label="Register Student" />
          <QuickAction to="/records" icon={ClipboardPenLine} label="Enter Scores" />
          <QuickAction to="/reports" icon={FileText} label="Generate Reports" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Total Students"
              value={students.length}
              icon={UsersRound}
              accent="bg-blue-50 text-blue-700"
            />
            <StatCard
              title="Class Streams"
              value={streams.length}
              icon={GraduationCap}
              accent="bg-indigo-50 text-indigo-700"
            />
            <StatCard
              title="Subjects"
              value={subjects.length}
              icon={BookOpen}
              accent="bg-emerald-50 text-emerald-700"
            />
          </>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-950">
                Performance by Class Stream
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Average score by stream for {DEFAULT_TERM}
              </p>
            </div>
            {topStream ? (
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
                Top: {topStream.stream}
              </span>
            ) : null}
          </div>

          {performanceQuery.isLoading ? (
            <div className="h-80 animate-pulse rounded-lg bg-slate-100" />
          ) : performance.length === 0 ? (
            <EmptyState
              icon={Award}
              title="No performance data yet"
              description="Enter scores for at least one class stream to generate analytics."
            />
          ) : (
            <div className="h-80 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performance} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="stream" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis domain={[0, 100]} tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip
                    cursor={{ fill: "#eff6ff" }}
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
                    }}
                  />
                  <Bar dataKey="average" name="Average Score" fill="#1d4ed8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <h3 className="text-base font-bold text-slate-950">Stream Standings</h3>
          <p className="mt-1 text-sm text-slate-500">Ranked by class average.</p>

          <div className="mt-5 space-y-3">
            {performance
              .slice()
              .sort((a, b) => b.average - a.average)
              .map((item, index) => {
                const position = index + 1;
                return (
                  <div
                    key={item.streamId}
                    className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${getPositionBadgeClass(position)}`}
                      >
                        {position}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{item.stream}</p>
                        <p className="text-xs text-slate-500">{item.students} students</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-slate-950">{item.average.toFixed(1)}</p>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </section>
  );
}

type StatCardProps = {
  title: string;
  value: number;
  icon: typeof UsersRound;
  accent: string;
};

function StatCard({ title, value, icon: Icon, accent }: StatCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${accent}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

type QuickActionProps = {
  to: string;
  icon: typeof Plus;
  label: string;
};

function QuickAction({ to, icon: Icon, label }: QuickActionProps) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 rounded-lg bg-academy-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}
