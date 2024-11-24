import { Home, PieChart, FileText, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Sidebar() {
  return (
    <aside className="w-64 bg-background border-r h-screen">
      <nav className="p-4 space-y-2">
        <Button variant="ghost" className="w-full justify-start">
          <Home className="mr-2 h-4 w-4" />
          Dashboard
        </Button>
        <Button variant="ghost" className="w-full justify-start">
          <FileText className="mr-2 h-4 w-4" />
          Transactions
        </Button>
        <Button variant="ghost" className="w-full justify-start">
          <PieChart className="mr-2 h-4 w-4" />
          Categories
        </Button>
        <Button variant="ghost" className="w-full justify-start">
          <TrendingUp className="mr-2 h-4 w-4" />
          Insights
        </Button>
      </nav>
    </aside>
  )
}
