import { useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  CheckCircle,
  XCircle,
  Clock,
  Award,
  Target,
  BookOpen,
  ArrowLeft,
  ArrowRight,
  Lightbulb,
  RefreshCcw
} from 'lucide-react'
import { getAttemptDetails } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

const QuizResultsPage = () => {
  const { id: quizId, attemptId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, isStudent } = useAuth()

  const { data: attemptDetails, isLoading, error } = useQuery({
    queryKey: ['attemptDetails', attemptId],
    queryFn: () => getAttemptDetails(attemptId),
    enabled: !!attemptId,
  })

  const results = location.state?.results || attemptDetails?.attempt?.results
  const quizTitle = attemptDetails?.attempt?.quiz_title || 'Quiz Results'

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
    } else if (!isStudent) {
      navigate('/')
    }
  }, [isAuthenticated, isStudent, navigate])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading results...</p>
        </div>
      </div>
    )
  }

  if (error || !results) {
    return (
      <div className="max-w-2xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error?.response?.data?.detail || 'Failed to load quiz results.'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const score = results.score
  const maxScore = results.max_score
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
  const timeTaken = attemptDetails?.attempt?.time_taken || 0

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Award className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Quiz Results</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Review your performance for <span className="font-medium">{quizTitle}</span>.
        </p>
      </div>

      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="text-5xl font-extrabold text-primary">
            {percentage}%
          </CardTitle>
          <CardDescription className="text-lg">
            You scored {score} out of {maxScore} points.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={percentage} className="w-full" />
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <Clock className="w-5 h-5 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Time Taken</p>
              <p className="font-medium">{formatTime(timeTaken)}</p>
            </div>
            <div>
              <RefreshCcw className="w-5 h-5 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Attempt ID</p>
              <p className="font-medium">{attemptId}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Results */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Detailed Breakdown</h2>
        {results.detailed_results.map((qResult, index) => (
          <Card key={index} className={qResult.is_correct ? 'border-green-300' : 'border-red-300'}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">
                Question {index + 1}
              </CardTitle>
              <Badge variant={qResult.is_correct ? 'success' : 'destructive'}>
                {qResult.is_correct ? 'Correct' : 'Incorrect'}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-base leading-relaxed">{qResult.question_text}</p>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Your Answer:</p>
                <p className={qResult.is_correct ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                  {qResult.student_answer || 'No answer provided'}
                </p>
              </div>

              {!qResult.is_correct && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Correct Answer:</p>
                  <p className="text-green-600 font-medium">
                    {qResult.correct_answer}
                  </p>
                </div>
              )}

              {qResult.explanation && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Explanation:</p>
                  <Alert className="bg-blue-50 border-blue-200 text-blue-800">
                    <Lightbulb className="h-4 w-4 text-blue-600" />
                    <AlertDescription>{qResult.explanation}</AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Actions */}
      <div className="flex justify-center gap-4 pt-8">
        <Button variant="outline" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
        <Button onClick={() => navigate('/generate?mode=mistakes')}>
          <Target className="w-4 h-4 mr-2" />
          Practice Mistakes
        </Button>
      </div>
    </div>
  )
}

export default QuizResultsPage
