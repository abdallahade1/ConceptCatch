import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import {
  Home,
  PlusCircle,
  BookOpen,
  BarChart3,
  Users,
  Settings,
  FileText,
  Trophy,
  Target,
  X
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation()
  const { user, isAuthenticated, isTeacher, isStudent } = useAuth()

  const navigation = [
    {
      name: 'Home',
      href: '/',
      icon: Home,
      show: true
    },
    {
      name: 'Generate Quiz',
      href: '/generate',
      icon: PlusCircle,
      show: isAuthenticated
    },
    {
      name: 'Student Dashboard',
      href: '/student/dashboard',
      icon: BarChart3,
      show: isStudent
    },
    {
      name: 'Teacher Dashboard',
      href: '/teacher/dashboard',
      icon: Users,
      show: isTeacher
    },
    {
      name: 'My Profile',
      href: `/student/${user?.id}/profile`,
      icon: Target,
      show: isStudent
    }
  ]

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <h2 className="text-lg font-semibold">Navigation</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="md:hidden"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-2 py-4">
          {navigation
            .filter(item => item.show)
            .map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}
        </div>

        {/* Quick Actions */}
        {isAuthenticated && (
          <div className="border-t pt-4 mt-4">
            <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Link
                to="/generate?mode=prompt"
                onClick={onClose}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <FileText className="h-4 w-4" />
                Topic Quiz
              </Link>
              <Link
                to="/generate?mode=document"
                onClick={onClose}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <BookOpen className="h-4 w-4" />
                Document Quiz
              </Link>
              {isStudent && (
                <Link
                  to="/generate?mode=mistakes"
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Trophy className="h-4 w-4" />
                  Practice Quiz
                </Link>
              )}
            </div>
          </div>
        )}

        {/* User Info */}
        {isAuthenticated && (
          <div className="border-t pt-4 mt-4">
            <div className="px-3 py-2">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:top-16">
        <div className="flex flex-col flex-grow border-r bg-background overflow-y-auto">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  )
}

export default Sidebar