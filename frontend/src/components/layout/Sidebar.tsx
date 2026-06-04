import { ChevronRight, Menu, School, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { navigationItems, utilityNavigationItems } from "./navigation";

type SidebarProps = {
  open: boolean;
  onClose: () => void;
  onOpen: () => void;
};

export function Sidebar({ open, onClose, onOpen }: SidebarProps) {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    [
      "group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition",
      isActive
        ? "bg-white text-academy-900 shadow-sm"
        : "text-slate-300 hover:bg-white/10 hover:text-white",
    ].join(" ");

  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        className="fixed left-4 top-4 z-30 rounded-lg bg-white p-2 text-slate-700 shadow-soft ring-1 ring-slate-200 lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div
        className={`fixed inset-0 z-40 bg-slate-950/40 transition-opacity lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 transform flex-col border-r border-slate-800 bg-academy-900 text-white shadow-2xl transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:shadow-none ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-academy-900">
              <School className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide text-blue-100">
                Ikonex Academy
              </p>
              <p className="text-xs text-slate-300">Student Management</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-300 hover:bg-white/10 lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Main Menu
          </p>
          <div className="space-y-1">
          {navigationItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.href}
              onClick={onClose}
              className={linkClass}
            >
              <span className="flex items-center gap-3">
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </span>
              <ChevronRight className="h-4 w-4 opacity-0 transition group-hover:opacity-70" />
            </NavLink>
          ))}
          </div>

          <p className="mb-2 mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Analytics
          </p>
          <div className="space-y-1">
            {utilityNavigationItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.href}
                onClick={onClose}
                className={linkClass}
              >
                <span className="flex items-center gap-3">
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </span>
                <ChevronRight className="h-4 w-4 opacity-0 transition group-hover:opacity-70" />
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="rounded-lg border border-white/10 bg-white/10 p-4">
            <p className="text-sm font-semibold">Production Console</p>
            <p className="mt-1 text-xs leading-5 text-slate-300">
              Analytics, records, rankings, and reports in one workspace.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
