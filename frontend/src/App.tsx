import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/streams" element={<PlaceholderPage title="Class Streams" />} />
        <Route path="/students" element={<PlaceholderPage title="Students" />} />
        <Route path="/subjects" element={<PlaceholderPage title="Subjects" />} />
        <Route path="/records" element={<PlaceholderPage title="Academic Records" />} />
        <Route path="/reports" element={<PlaceholderPage title="Reports" />} />
      </Route>
    </Routes>
  );
}
