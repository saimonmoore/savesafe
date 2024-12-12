import Identify from '@/components/pages/LoggedOut/Identify'
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/identify')({
  component: RouteComponent,
  errorComponent: (error) => <pre>{JSON.stringify(error, null, 2)}</pre>,
})

function RouteComponent() {
  return <Identify />
}
