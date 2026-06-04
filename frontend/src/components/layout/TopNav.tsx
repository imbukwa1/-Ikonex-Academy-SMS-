import { Bell, Search, UserRound } from "lucide-react";
import { useLocation } from "react-router-dom";

const routeTitles: Record<string, string> = {
  "/dashboard": "Dashboard Overview",
  "/streams": "Class Streams",
  "/students": "Student Directory",
  "/subjects": "Subject Management",
  "/records": "Academic Records",
  "/reports": "Reports",
};

export function TopNav() {
  const location = useLocation();
  const title = routeTitles[location.pathname] ?? "Ikonex Dashboard";

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:px-8">
      <div className="flex items-center justify-between gap-4 pl-12 lg:pl-0">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Ikonex Academy
          </p>
          <h1 className="truncate text-lg font-bold text-slate-950">{title}</h1>
        </div>

        <div className="hidden min-w-0 flex-1 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500 lg:flex">
          <Search className="h-4 w-4" />
          <input
            type="search"
            placeholder="Search records..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </div>

        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-academy-100 text-academy-700">
              <UserRound className="h-5 w-5" />
            </div>
            <div className="hidden text-sm sm:block">
              <p className="font-semibold text-slate-900">Academic Admin</p>
              <p className="text-xs text-slate-500">Ikonex Academy</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
