import { useEffect, useState } from 'react'
import { useTheme } from "@/components/providers/theme-provider"
import { cn } from "@/lib/utils"
import { CheckIcon } from 'lucide-react'

interface AnimatedProgressIconProps {
    progress?: number
    icon?: React.ReactNode
    className?: string
}

export function AnimatedProgressIcon({ progress = 0, icon = <CheckIcon className="h-4 w-4" />, className }: AnimatedProgressIconProps) {
    const [percentComplete, setPercentComplete] = useState(0)
    const { theme } = useTheme()

    const foregroundColor = theme === 'dark' ? 'hsl(var(--background))' : 'hsl(var(--background))'
    const backgroundColor = theme === 'dark' ? 'hsl(var(--primary))' : 'hsl(var(--primary))'

    useEffect(() => {
        const interval = setInterval(() => {
            setPercentComplete(prev => {
                if (prev < progress) {
                    return prev + 1
                }
                clearInterval(interval)
                return prev
            })
        }, 20)

        return () => clearInterval(interval)
    }, [progress])

    return (
        <div className= { cn("relative w-5 h-5", className) } >
        <div className="absolute inset-0 flex items-center justify-center" >
            <div
          className="w-full h-full rounded-full transition-all duration-300 ease-out"
    style = {{
        background: `conic-gradient(${backgroundColor} ${percentComplete * 3.6}deg, ${foregroundColor} 0deg)`,
            opacity: percentComplete === 100 ? 0 : 1,
          }
}
        />
    </div>
    < div
className = "absolute inset-0 flex items-center justify-center transition-opacity duration-300 ease-out"
style = {{ opacity: percentComplete === 100 ? 1 : 0 }}
      >
    { icon }
    </div>
    </div>
  )
}

