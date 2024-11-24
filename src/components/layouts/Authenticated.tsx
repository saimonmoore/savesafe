import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/view/Sidebar/Sidebar";

import Header from "@/components/view/Header/Header";
import { Root } from "@/components/view/Root/Root";

export default function AuthenticatedLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-background p-4">
          <Root/>
        </main>
      </div>
    </SidebarProvider>
  );
}
