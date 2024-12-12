import { createFileRoute } from '@tanstack/react-router'

import Dashboard from '@/components/pages/Dashboard/Dashboard'
import { RuntimeClient } from '@/services/runtimeClient'
import { runMigrations } from '@/services/migrationRunner'

export const Route = createFileRoute('/')({
  component: RouteComponent,
  loader: () => RuntimeClient.runPromise(runMigrations),
  errorComponent: (error) => <pre>{JSON.stringify(error, null, 2)}</pre>,
})

function RouteComponent() {
  return <Dashboard />
}
