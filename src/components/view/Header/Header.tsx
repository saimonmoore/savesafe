import { SidebarTrigger } from "@/components/ui/sidebar";
import { Bell, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/view/DarkMode/ModeToggle'

export default function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-background border-b">
      <SidebarTrigger />
      <h1 className="text-2xl font-bold">FinanceTracker</h1>
      <div className="flex items-center space-x-4">
        <ModeToggle />
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}