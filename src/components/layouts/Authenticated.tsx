import { Outlet } from "react-router-dom";

import Header from "@/components/view/Header/Header";
import Sidebar from "@/components/view/Sidebar/Sidebar";

export default function AuthenticatedLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-background p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
