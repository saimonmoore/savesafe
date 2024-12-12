export default function UnauthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 overflow-y-auto bg-background p-4">
      {children}
    </main>
  );
}
