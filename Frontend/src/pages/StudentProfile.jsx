import { useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  User,
  BookOpen,
  Target,
  Trophy,
  CalendarDays,
  Hash,
  ArrowRight,
  AlertCircle,
  RefreshCcw
} from 'lucide-react'
import { getStudentProfile, getStudentAttempts } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

const StudentProfile = () => {
  const { id: studentId } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated, isStudent, isTeacher } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
    } else if (isStudent && user?.id !== studentId) {
      navigate(`/student/${user?.id}/profile`)
    } else if (isTeacher && !studentId) {
      navigate('/teacher/dashboard')
    }
  }, [isAuthenticated, isStudent, isTeacher, user, studentId, navigate])

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
          <p className="text-muted-foreground">Loading student profile...</p>
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
            {profileError?.response?.data?.detail ||
              attemptsError?.response?.data?.detail ||
              'Failed to load profile data.'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const studentProfile = profileData?.student || {}
  const analytics = profileData?.analytics || {}
  const attempts = attemptsData?.attempts || []

  const renderStudentName = () => {
    if (!studentProfile?.name) return 'N/A'
    return typeof studentProfile.name === 'object'
      ? `${studentProfile.name.first || ''} ${studentProfile.name.last || ''}`.trim()
      : String(studentProfile.name)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <User className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Student Profile</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Detailed performance and learning insights for{' '}
          <span className="font-medium">{renderStudentName()}</span>.
        </p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">{renderStudentName()}</CardTitle>
          <Badge variant="secondary" className="capitalize">
            {String(studentProfile?.role || 'N/A')}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Student ID</p>
              <p className="font-medium">{String(studentProfile?.id || 'N/A')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{String(studentProfile?.email || 'N/A')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.average_score !== undefined
                ? `${Number(analytics.average_score).toFixed(1)}%`
                : 'N/A'}
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
            <div className="text-2xl font-bold">{Number(analytics?.total_quizzes_taken || 0)}</div>
            <p className="text-xs text-muted-foreground">Total attempts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Common Mistakes</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Array.isArray(analytics?.common_mistakes) ? analytics.common_mistakes.length : 0}
            </div>
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
              Weak Areas
            </CardTitle>
            <CardDescription>
              Topics where {renderStudentName()} frequently makes mistakes. Focus on these for
              improvement.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {Array.isArray(analytics.common_mistakes) && analytics.common_mistakes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300 divide-y divide-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  {analytics.common_mistakes[0] && typeof analytics.common_mistakes[0] === 'object'
                    ? Object.keys(analytics.common_mistakes[0]).map((key) => (
                        <th
                          key={key}
                          className="px-4 py-2 text-left text-sm font-semibold text-gray-700"
                        >
                          {key.replace(/_/g, ' ').toUpperCase()}
                        </th>
                      ))
                    : <th className="px-4 py-2 text-left">Mistake</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {analytics.common_mistakes.map((mistake, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    {typeof mistake === 'object' && mistake !== null
                      ? Object.values(mistake).map((value, j) => (
                          <td key={j} className="px-4 py-2 text-sm text-gray-700">
                            {String(value)}
                          </td>
                        ))
                      : <td className="px-4 py-2 text-sm text-gray-700">{String(mistake)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground">No common mistakes identified yet. Keep up the good work!</p>
        )}
            {isStudent && (
              <Button asChild variant="outline" className="mt-4">
                <Link to="/generate?mode=mistakes">
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  Practice These Topics
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </section>

      {/* All Quiz Attempts */}
      <section className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              All Quiz Attempts
            </CardTitle>
            <CardDescription>
              A complete history of {renderStudentName()}'s quiz attempts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {attempts.length > 0 ? (
              <div className="space-y-4">
                {attempts.map((attempt) => (
                  <Card key={String(attempt.attempt_id)} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-semibold text-lg">{String(attempt.quiz_title)}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CalendarDays className="w-3 h-3" />
                          <span>{attempt.timestamp ? new Date(attempt.timestamp).toLocaleDateString() : 'N/A'}</span>
                          <Hash className="w-3 h-3" />
                          <span>Attempt ID: {String(attempt.attempt_id)}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {Number(attempt.score || 0)}/{Number(attempt.max_score || 0)} points
                        </p>
                      </div>

                      <Button asChild variant="outline" size="sm">
                        <Link to={`/quiz/${String(attempt.quiz_id)}/results/${String(attempt.attempt_id)}`}>
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
                <p className="text-sm">No quizzes taken yet.</p>
                {isStudent && (
                  <Button asChild className="mt-4">
                    <Link to="/generate">Generate Your First Quiz</Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

export default StudentProfile