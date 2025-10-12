import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  BarChart3,
  Target,
  BookOpen,
  Trophy,
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Hash,
  RefreshCcw
} from 'lucide-react'
import { getStudentProfile, getStudentAttempts } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

const StudentDashboard = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated, isStudent } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) navigate('/login')
    else if (!isStudent) navigate('/')
  }, [isAuthenticated, isStudent, navigate])

  const studentId = user?.id

  const { data: profileData, isLoading: isLoadingProfile, error: profileError } = useQuery({
    queryKey: ['studentProfile', studentId],
    queryFn: () => getStudentProfile(studentId),
    enabled: !!studentId,
  })

  const { data: attemptsData, isLoading: isLoadingAttempts, error: attemptsError } = useQuery({
    queryKey: ['studentAttempts', studentId],
    queryFn: () => getStudentAttempts(studentId),
    enabled: !!studentId,
  })

  if (isLoadingProfile || isLoadingAttempts) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading student dashboard...</p>
        </div>
      </div>
    )
  }

  if (profileError || attemptsError) {
    return (
      <div className="max-w-2xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {profileError?.response?.data?.detail || attemptsError?.response?.data?.detail || 'Failed to load dashboard data.'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const studentProfile = profileData?.student || {}
  const analytics = profileData?.analytics || {}
  const attempts = attemptsData?.attempts || []

  const renderStudentName = () => {
    if (!studentProfile?.name) return 'Student'
    return typeof studentProfile.name === 'object'
      ? `${studentProfile.name.first || ''} ${studentProfile.name.last || ''}`.trim()
      : String(studentProfile.name)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <BarChart3 className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Student Dashboard</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Welcome back, <span className="font-medium">{renderStudentName()}</span>! 
          Here's an overview of your learning progress.
        </p>
      </div>

      {/* Key Metrics */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {typeof analytics.average_score === 'number' ? analytics.average_score.toFixed(1) : 'N/A'}%
            </div>
            <p className="text-xs text-muted-foreground">Across all quizzes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quizzes Taken</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Number(analytics.total_quizzes_taken || 0)}</div>
            <p className="text-xs text-muted-foreground">Total attempts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Common Mistakes</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Array.isArray(analytics.common_mistakes) ? analytics.common_mistakes.length : 0}</div>
            <p className="text-xs text-muted-foreground">Topics to review</p>
          </CardContent>
        </Card>
      </section>

      {/* Weak Areas */}
      <section className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Your Weak Areas
            </CardTitle>
            <CardDescription>
              Topics where you frequently make mistakes. Focus on these for improvement.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {Array.isArray(analytics.common_mistakes) && analytics.common_mistakes.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {analytics.common_mistakes.map((mistake, i) => (
                  <Badge key={i} variant="destructive" className="text-sm px-3 py-1">
                    {typeof mistake === 'object' ? JSON.stringify(mistake) : String(mistake)}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No common mistakes identified yet. Keep up the good work!</p>
            )}
            <Button asChild variant="outline" className="mt-4">
              <Link to="/generate?mode=mistakes">
                <RefreshCcw className="w-4 h-4 mr-2" />
                Practice These Topics
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Recent Attempts */}
      <section className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Recent Quiz Attempts
            </CardTitle>
            <CardDescription>Your latest quiz results and performance.</CardDescription>
          </CardHeader>
          <CardContent>
            {attempts.length > 0 ? (
              <div className="space-y-4">
                {attempts.slice(0, 5).map((a) => (
                  <Card key={String(a.attempt_id)} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{typeof a.quiz_title === 'object' ? JSON.stringify(a.quiz_title) : String(a.quiz_title || 'Untitled Quiz')}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CalendarDays className="w-3 h-3" />
                          <span>{a.timestamp ? new Date(a.timestamp).toLocaleDateString() : 'N/A'}</span>
                          <Hash className="w-3 h-3" />
                          <span>Attempt ID: {String(a.attempt_id)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={a.score_percentage >= 70 ? 'success' : 'destructive'}>
                          {typeof a.score_percentage === 'number' ? a.score_percentage.toFixed(1) : 'N/A'}%
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          {Number(a.score || 0)}/{Number(a.max_score || 0)} points
                        </p>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/quiz/${String(a.quiz_id)}/results/${String(a.attempt_id)}`}>
                          View Details
                          <ArrowRight className="w-3 h-3 ml-2" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No quizzes taken yet. Start generating one!</p>
                <Button asChild className="mt-4">
                  <Link to="/generate">Generate Your First Quiz</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <div className="text-center pt-4">
        <Button asChild variant="link">
          <Link to={`/student/${studentId}/profile`}>
            Go to Full Profile
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

export default StudentDashboard