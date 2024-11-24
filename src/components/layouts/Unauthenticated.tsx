import { Outlet } from "react-router-dom";

export default function UnauthenticatedLayout() {
  return (
    <main className="flex-1 overflow-y-auto bg-background p-4">
      <Outlet />
    </main>
  );
}
