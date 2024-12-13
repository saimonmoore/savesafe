import { PGliteProvider } from "@electric-sql/pglite-react";
import { PGliteWithLive } from "@electric-sql/pglite/live";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { DBContext } from "@/hooks/use-db";
import { Pglite } from "@/services/pglite";
import { RuntimeClient } from "@/services/runtimeClient";
import AuthenticatedLayout from "@/components/layouts/Authenticated";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ErrorAlert } from "@/components/view/Error/ErrorAlert";

import { ErrorBoundary } from "@/components/view/Error/ErrorBoundary";
import { Effect } from "effect";

function RootComponent() {
  const { client, orm } = Route.useLoaderData();
  return (
    <PGliteProvider db={client as PGliteWithLive}>
      <DBContext.Provider value={orm}>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <AuthenticatedLayout>
            <ErrorBoundary
              onError={(error, errorInfo) => {
                Effect.runPromise(Effect.gen(function* () {
                  yield* Effect.logError(error);
                  yield* Effect.logError(errorInfo);
                }));
              }}
            >
              <Outlet />
            </ErrorBoundary>
          </AuthenticatedLayout>
        </ThemeProvider>
        <TanStackRouterDevtools />
      </DBContext.Provider>
    </PGliteProvider>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
  loader: () => RuntimeClient.runPromise(Pglite),
  errorComponent: (error) => (
    <ErrorAlert
      error={error.error}
      message="An error loading the database occurred"
    />
  ),
});
