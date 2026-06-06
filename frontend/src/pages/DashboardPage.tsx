import { useQuery } from "@tanstack/react-query";
import {
  Award,
  BookOpen,
  ClipboardPenLine,
  FileText,
  GraduationCap,
  LucideIcon,
  Plus,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import { useMemo } from "react";
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
import type { ClassPerformanceResults } from "../services/types";
import { getPositionBadgeClass } from "../utils/positionBadges";

type StreamPerformanceDatum = {
  streamId: number;
  stream: string;
  average: number;
  students: number;
  recordedScores: number;
  expectedScores: number;
};

type StreamReport = {
  streamId: number;
  streamName: string;
  report: ClassPerformanceResults | null;
};

export function DashboardPage() {
  const termsQuery = useQuery({
    queryKey: ["terms"],
    queryFn: resultsApi.terms,
  });

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

  const selectedTerm = useMemo(
    () => termsQuery.data?.[0] ?? "",
    [termsQuery.data]
  );

  const performanceQuery = useQuery({
    queryKey: [
      "dashboard-performance",
      selectedTerm,
      statsQuery.data?.streams.map((stream) => stream.id).join(","),
    ],
    enabled: Boolean(selectedTerm && statsQuery.data?.streams.length),
    queryFn: async () => {
      const streams = statsQuery.data?.streams ?? [];

      return Promise.all(
        streams.map(async (stream): Promise<StreamReport> => {
          try {
            const report = await resultsApi.classPerformance(stream.id, selectedTerm);
            return { streamId: stream.id, streamName: stream.name, report };
          } catch {
            return { streamId: stream.id, streamName: stream.name, report: null };
          }
        })
      );
    },
  });

  const streams = statsQuery.data?.streams ?? [];
  const students = statsQuery.data?.students ?? [];
  const subjects = statsQuery.data?.subjects ?? [];
  const streamReports = performanceQuery.data ?? [];

  const performance = useMemo<StreamPerformanceDatum[]>(
    () =>
      streamReports.map(({ streamId, streamName, report }) => {
        const recordedScores =
          report?.rankings.reduce(
            (total, ranking) => total + ranking.subjects_recorded,
            0
          ) ?? 0;
        const expectedScores =
          report && report.expected_subjects > 0
            ? report.expected_subjects * report.summary.students_count
            : 0;

        return {
          streamId,
          stream: streamName,
          average: report?.summary.class_average ?? 0,
          students: report?.summary.students_count ?? 0,
          recordedScores,
          expectedScores,
        };
      }),
    [streamReports]
  );

  const summary = useMemo(() => {
    const recordedScores = performance.reduce(
      (total, item) => total + item.recordedScores,
      0
    );
    const expectedScores = performance.reduce(
      (total, item) => total + item.expectedScores,
      0
    );
    const averages = performance
      .filter((item) => item.students > 0)
      .map((item) => item.average);

    return {
      recordedScores,
      expectedScores,
      completionRate:
        expectedScores > 0 ? Math.round((recordedScores / expectedScores) * 100) : 0,
      meanAverage:
        averages.length > 0
          ? averages.reduce((total, average) => total + average, 0) / averages.length
          : 0,
    };
  }, [performance]);

  const topStudents = useMemo(
    () =>
      streamReports
        .flatMap(({ streamName, report }) =>
          (report?.rankings ?? []).map((ranking) => ({
            ...ranking,
            stream_name: ranking.stream_name ?? streamName,
          }))
        )
        .sort((a, b) => b.total_marks - a.total_marks)
        .slice(0, 10),
    [streamReports]
  );

  const loading = statsQuery.isLoading || termsQuery.isLoading;

  return (
    <section className="mx-auto max-w-7xl space-y-6">
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft">
        <div className="bg-academy-900 px-5 py-6 text-white sm:px-7">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-semibold text-blue-200">Ikonex Overview</p>
              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                Academic Dashboard
              </h2>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="rounded-lg border border-white/10 bg-white/10 px-4 py-2">
                <p className="text-xs text-slate-300">Current term</p>
                <p className="text-sm font-semibold">{selectedTerm || "No scores yet"}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <QuickAction to="/students" icon={Plus} label="Register Student" />
                <QuickAction to="/records" icon={ClipboardPenLine} label="Enter Scores" />
                <QuickAction to="/reports" icon={FileText} label="Reports" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard
                title="Total Students"
                value={students.length.toLocaleString()}
                icon={UsersRound}
                accent="bg-blue-50 text-blue-700"
              />
              <StatCard
                title="Class Streams"
                value={streams.length.toLocaleString()}
                icon={GraduationCap}
                accent="bg-indigo-50 text-indigo-700"
              />
              <StatCard
                title="Subjects"
                value={subjects.length.toLocaleString()}
                icon={BookOpen}
                accent="bg-emerald-50 text-emerald-700"
              />
              <StatCard
                title="Score Coverage"
                value={`${summary.completionRate}%`}
                icon={TrendingUp}
                accent="bg-amber-50 text-amber-700"
              />
            </>
          )}
        </div>
      </div>

      {!selectedTerm && !loading ? (
        <EmptyState
          icon={Award}
          title="No assessment data found"
          description="Once scores are recorded, this dashboard will populate automatically from the database."
        />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <div className="mb-5">
            <h3 className="text-base font-bold text-slate-950">
              Performance by Class Stream
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Average score by stream for {selectedTerm || "the current term"}.
            </p>
          </div>

          {performanceQuery.isLoading ? (
            <div className="h-80 animate-pulse rounded-lg bg-slate-100" />
          ) : performance.length === 0 ? (
            <EmptyState
              icon={Award}
              title="No performance records yet"
              description="Class averages will appear here once assessment results are available."
            />
          ) : (
            <div className="h-80 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={performance}
                  margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
                >
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
                  <Bar
                    dataKey="average"
                    name="Average Score"
                    fill="#1d4ed8"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
            <h3 className="text-base font-bold text-slate-950">Operational Summary</h3>
            <div className="mt-5 space-y-4">
              <MetricRow label="Mean class average" value={summary.meanAverage.toFixed(2)} />
              <MetricRow
                label="Recorded score entries"
                value={summary.recordedScores.toLocaleString()}
              />
              <MetricRow
                label="Expected score entries"
                value={summary.expectedScores.toLocaleString()}
              />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
            <h3 className="text-base font-bold text-slate-950">Stream Standings</h3>
            <p className="mt-1 text-sm text-slate-500">Ranked by class average.</p>
            <div className="mt-5 max-h-80 space-y-3 overflow-y-auto pr-1">
              {performance
                .slice()
                .sort((a, b) => b.average - a.average)
                .map((item, index) => (
                  <div
                    key={item.streamId}
                    className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${getPositionBadgeClass(index + 1)}`}
                      >
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{item.stream}</p>
                        <p className="text-xs text-slate-500">{item.students} students</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-slate-950">
                      {item.average.toFixed(1)}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <h3 className="text-base font-bold text-slate-950">Top Student Rankings</h3>
        <p className="mt-1 text-sm text-slate-500">
          Highest total marks across all class streams.
        </p>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead className="sticky top-0 bg-slate-50">
              <tr>
                <TableHeader label="Position" />
                <TableHeader label="Student" />
                <TableHeader label="Stream" />
                <TableHeader label="Total" align="right" />
                <TableHeader label="Average" align="right" />
                <TableHeader label="Subjects" align="right" />
              </tr>
            </thead>
            <tbody>
              {topStudents.map((student, index) => (
                <tr key={`${student.stream_id}-${student.student_id}`}>
                  <td className="border-b border-slate-100 px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${getPositionBadgeClass(index + 1)}`}
                    >
                      {index + 1}
                    </span>
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3 font-semibold text-slate-950">
                    {student.student_name}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3 text-slate-600">
                    {student.stream_name}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3 text-right font-semibold">
                    {student.total_marks}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3 text-right">
                    {student.average.toFixed(2)}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3 text-right text-slate-600">
                    {student.subjects_recorded}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

type StatCardProps = {
  title: string;
  value: string;
  icon: LucideIcon;
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
  icon: LucideIcon;
  label: string;
};

function QuickAction({ to, icon: Icon, label }: QuickActionProps) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-academy-900 shadow-sm hover:bg-blue-50"
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

type MetricRowProps = {
  label: string;
  value: string;
};

function MetricRow({ label, value }: MetricRowProps) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-bold text-slate-950">{value}</span>
    </div>
  );
}

type TableHeaderProps = {
  label: string;
  align?: "left" | "right";
};

function TableHeader({ label, align = "left" }: TableHeaderProps) {
  return (
    <th
      className={`border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {label}
    </th>
  );
}
