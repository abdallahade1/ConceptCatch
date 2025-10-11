import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Users,
  BookOpen,
  BarChart3,
  PlusCircle,
  Edit,
  Share2,
  Download,
  AlertCircle,
  ArrowRight,
  CheckCircle
} from 'lucide-react'
import { getTeacherDashboard, exportQuiz, publishQuiz } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

const TeacherDashboard = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated, isTeacher } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
    } else if (!isTeacher) {
      navigate('/')
    }
  }, [isAuthenticated, isTeacher, navigate])

  const teacherId = user?.id

  const { data: dashboardData, isLoading, error, refetch } = useQuery({
    queryKey: ['teacherDashboard', teacherId],
    queryFn: () => getTeacherDashboard(),
    enabled: !!teacherId,
  })

  const handleExport = async (quizId, format) => {
    try {
      await exportQuiz(quizId, format)
      alert(`Quiz exported as ${format} successfully!`)
    } catch (err) {
      alert(`Error exporting quiz: ${err.response?.data?.detail || err.message}`)
    }
  }

  const handlePublish = async (quizId) => {
    try {
      await publishQuiz(quizId)
      alert('Quiz published successfully!')
      refetch() // Refresh dashboard data
    } catch (err) {
      alert(`Error publishing quiz: ${err.response?.data?.detail || err.message}`)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading teacher dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error?.response?.data?.detail || 'Failed to load dashboard data.'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const teacherQuizzes = dashboardData?.quizzes || []
  const analytics = dashboardData?.analytics

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Users className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Welcome, <span className="font-medium">{user?.name}</span>! 
          Manage your quizzes and monitor student performance.
        </p>
      </div>

      {/* Key Metrics */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quizzes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teacherQuizzes.length}</div>
            <p className="text-xs text-muted-foreground">Created by you</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Student Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.average_student_score?.toFixed(1) || 'N/A'}%</div>
            <p className="text-xs text-muted-foreground">Across your quizzes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.active_students || 0}</div>
            <p className="text-xs text-muted-foreground">Took your quizzes</p>
          </CardContent>
        </Card>
      </section>

      {/* Your Quizzes */}
      <section className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Your Quizzes
              </div>
              <Button asChild size="sm">
                <Link to="/generate">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Create New Quiz
                </Link>
              </Button>
            </CardTitle>
            <CardDescription>
              Manage quizzes you have created.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {teacherQuizzes.length > 0 ? (
              <div className="space-y-4">
                {teacherQuizzes.map((quiz) => (
                  <Card key={quiz.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-semibold text-lg">{quiz.title}</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Badge variant="secondary">{quiz.num_questions} Questions</Badge>
                          <Badge variant="secondary">{quiz.difficulty}</Badge>
                          <Badge variant="secondary">{quiz.question_type}</Badge>
                          {quiz.is_published ? (
                            <Badge className="bg-green-500 hover:bg-green-600">Published</Badge>
                          ) : (
                            <Badge variant="outline">Draft</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link to={`/quiz/${quiz.id}/edit`}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Link>
                        </Button>
                        {!quiz.is_published && (
                          <Button size="sm" onClick={() => handlePublish(quiz.id)}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Publish
                          </Button>
                        )}
                        <Button variant="secondary" size="sm" onClick={() => handleExport(quiz.id, 'docx')}>
                          <Download className="w-4 h-4 mr-2" />
                          Export DOCX
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => handleExport(quiz.id, 'json')}>
                          <Download className="w-4 h-4 mr-2" />
                          Export JSON
                        </Button>
                        {/* <Button variant="ghost" size="sm" onClick={() => handleShare(quiz.id)}>
                          <Share2 className="w-4 h-4 mr-2" />
                          Share
                        </Button> */}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">You haven't created any quizzes yet.</p>
                <Button asChild className="mt-4">
                  <Link to="/generate">Create Your First Quiz</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Student Performance Overview (Placeholder) */}
      <section className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Student Performance Overview
            </CardTitle>
            <CardDescription>
              View overall performance of students across your quizzes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Detailed student performance analytics coming soon!</p>
              <Button asChild variant="link" className="mt-4">
                <Link to="/student/student_001/profile">View Sample Student Profile</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

export default TeacherDashboard

