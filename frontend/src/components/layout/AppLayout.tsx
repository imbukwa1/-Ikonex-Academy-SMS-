import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-academy-50">
      <div className="flex min-h-screen">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onOpen={() => setSidebarOpen(true)}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <TopNav />
          <main className="flex-1 px-4 py-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
