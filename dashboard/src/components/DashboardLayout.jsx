import { Outlet } from "react-router-dom";
import Sidebar from "@/components/SideBar";

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-x-hidden scrollbar-thin">
        <Outlet />
      </main>
    </div>
  );
}