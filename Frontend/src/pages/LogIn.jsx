import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Brain, User, GraduationCap, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const LogIn = () => {
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!userId.trim()) {
      setError('Please enter a user ID')
      return
    }

    setLoading(true)
    setError('')

    try {
      await login(userId.trim())
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const demoUsers = [
    {
      id: 'teacher_001',
      name: 'Dr. Sarah Johnson',
      role: 'Teacher',
      icon: GraduationCap,
      description: 'Access teacher dashboard, create and manage quizzes'
    },
    {
      id: 'student_001',
      name: 'Alex Chen',
      role: 'Student',
      icon: User,
      description: 'Take quizzes, view progress, and get personalized recommendations'
    },
    {
      id: 'student_002',
      name: 'Maria Garcia',
      role: 'Student',
      icon: User,
      description: 'Student with some quiz history and performance data'
    }
  ]

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className="flex items-center justify-center w-12 h-12 bg-primary rounded-xl">
              <Brain className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              ConceptCatch
            </h1>
          </div>
          <p className="text-muted-foreground">
            Sign in to access your personalized learning dashboard
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Login Form */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>
                Enter your user ID to access your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="userId">User ID</Label>
                  <Input
                    id="userId"
                    type="text"
                    placeholder="Enter your user ID"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    disabled={loading}
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Demo Users */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Demo Accounts
                <Badge variant="secondary">Try Now</Badge>
              </CardTitle>
              <CardDescription>
                Use these demo accounts to explore the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {demoUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => setUserId(user.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                      <user.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.role}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {user.id}
                  </Badge>
                </div>
              ))}
              
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  Click on any demo account to auto-fill the user ID, then click "Sign In"
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8">
          <div className="text-center space-y-2">
            <GraduationCap className="w-8 h-8 text-primary mx-auto" />
            <h3 className="font-semibold">For Teachers</h3>
            <p className="text-sm text-muted-foreground">
              Create quizzes, manage students, and track class performance with detailed analytics
            </p>
          </div>
          <div className="text-center space-y-2">
            <User className="w-8 h-8 text-primary mx-auto" />
            <h3 className="font-semibold">For Students</h3>
            <p className="text-sm text-muted-foreground">
              Take personalized quizzes, track your progress, and improve in your weak areas
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LogIn