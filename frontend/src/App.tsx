import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { AcademicRecordsPage } from "./pages/AcademicRecordsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ReportsPage } from "./pages/ReportsPage";
import { StreamsPage } from "./pages/StreamsPage";
import { StudentsPage } from "./pages/StudentsPage";
import { SubjectsPage } from "./pages/SubjectsPage";

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/streams" element={<StreamsPage />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/subjects" element={<SubjectsPage />} />
        <Route path="/records" element={<AcademicRecordsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
      </Route>
    </Routes>
  );
}
