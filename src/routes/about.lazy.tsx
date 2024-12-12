import { createLazyFileRoute } from '@tanstack/react-router'
import About from '@/components/pages/About/About'

export const Route = createLazyFileRoute('/about')({
  component: RouteComponent,
  errorComponent: (error) => <pre>{JSON.stringify(error, null, 2)}</pre>,
})

function RouteComponent() {
  return <About />
}
