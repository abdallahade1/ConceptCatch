import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Clock,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Target,
  ArrowLeft,
  ArrowRight,
  Send,
  Timer
} from 'lucide-react'
import { getQuiz, startQuizAttempt, submitQuiz } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

const TakeQuiz = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated, isStudent } = useAuth()
  
  // State
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [responses, setResponses] = useState({})
  const [attemptId, setAttemptId] = useState(null)
  const [startTime, setStartTime] = useState(null)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [quizStarted, setQuizStarted] = useState(false)

  // Queries and mutations
  const { data: quizData, isLoading, error } = useQuery({
    queryKey: ['quiz', id],
    queryFn: () => getQuiz(id),
    enabled: !!id
  })

  const startAttemptMutation = useMutation({
    mutationFn: () => startQuizAttempt(id),
    onSuccess: (data) => {
      setAttemptId(data.attempt_id)
      setStartTime(Date.now())
      setQuizStarted(true)
    }
  })

  const submitMutation = useMutation({
    mutationFn: ({ quizId, attemptId, responses, timeTaken }) =>
      submitQuiz(quizId, attemptId, responses, timeTaken),
    onSuccess: (data) => {
      navigate(`/quiz/${id}/results/${attemptId}`, { 
        state: { results: data.results } 
      })
    }
  })

  // Timer effect
  useEffect(() => {
    let interval
    if (startTime && quizStarted) {
      interval = setInterval(() => {
        setTimeElapsed(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [startTime, quizStarted])

  // Redirect if not authenticated student
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
    } else if (!isStudent) {
      navigate('/')
    }
  }, [isAuthenticated, isStudent, navigate])

  const quiz = quizData?.quiz
  const questions = quiz?.questions || []
  const totalQuestions = questions.length

  const handleStartQuiz = () => {
    startAttemptMutation.mutate()
  }

  const handleResponseChange = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  const handleNext = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1)
    }
  }

  const handleSubmit = () => {
    const timeTaken = Math.floor((Date.now() - startTime) / 1000)
    submitMutation.mutate({
      quizId: id,
      attemptId,
      responses,
      timeTaken
    })
    setShowSubmitDialog(false)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getAnsweredCount = () => {
    return Object.keys(responses).length
  }

  const isCurrentQuestionAnswered = () => {
    const currentQ = questions[currentQuestion]
    return currentQ && responses[currentQ.id]
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading quiz...</p>
        </div>
      </div>
    )
  }

  if (error || !quiz) {
    return (
      <div className="max-w-2xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error?.response?.data?.detail || 'Quiz not found or failed to load'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Quiz start screen
  if (!quizStarted) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <BookOpen className="w-6 h-6 text-primary" />
              <CardTitle className="text-2xl">{quiz.title}</CardTitle>
            </div>
            <CardDescription>
              Ready to start your quiz? Review the details below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Quiz Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{totalQuestions}</div>
                <div className="text-sm text-muted-foreground">Questions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{quiz.difficulty}</div>
                <div className="text-sm text-muted-foreground">Difficulty</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{quiz.question_type}</div>
                <div className="text-sm text-muted-foreground">Type</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">~{totalQuestions * 2}</div>
                <div className="text-sm text-muted-foreground">Est. Minutes</div>
              </div>
            </div>

            {/* Topic */}
            {quiz.topic && (
              <div className="text-center">
                <Badge variant="secondary" className="px-4 py-2">
                  <Target className="w-4 h-4 mr-2" />
                  {quiz.topic}
                </Badge>
              </div>
            )}

            {/* Instructions */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Instructions:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Answer all questions to the best of your ability</li>
                  <li>• You can navigate between questions using the Previous/Next buttons</li>
                  <li>• Your progress is automatically saved</li>
                  <li>• Submit when you're ready - you cannot change answers after submission</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Start Button */}
            <div className="text-center">
              <Button 
                onClick={handleStartQuiz} 
                size="lg"
                disabled={startAttemptMutation.isPending}
                className="min-w-[200px]"
              >
                {startAttemptMutation.isPending ? 'Starting...' : 'Start Quiz'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentQ = questions[currentQuestion]
  const progress = ((currentQuestion + 1) / totalQuestions) * 100

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{quiz.title}</h1>
          <p className="text-muted-foreground">
            Question {currentQuestion + 1} of {totalQuestions}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Timer className="w-4 h-4" />
            <span>{formatTime(timeElapsed)}</span>
          </div>
          <Badge variant="outline">
            {getAnsweredCount()}/{totalQuestions} answered
          </Badge>
        </div>
      </div>

      {/* Progress */}
      <Progress value={progress} className="w-full" />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Question */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Question {currentQuestion + 1}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-lg leading-relaxed">
                {currentQ?.question}
              </div>

              {/* Answer Input */}
              <div className="space-y-4">
                {quiz.question_type === 'MCQ' && currentQ?.options && (
                  <RadioGroup
                    value={responses[currentQ.id] || ''}
                    onValueChange={(value) => handleResponseChange(currentQ.id, value)}
                  >
                    {currentQ.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`option-${index}`} />
                        <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {quiz.question_type === 'True/False' && (
                  <RadioGroup
                    value={responses[currentQ.id] || ''}
                    onValueChange={(value) => handleResponseChange(currentQ.id, value)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="True" id="true" />
                      <Label htmlFor="true" className="cursor-pointer">True</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="False" id="false" />
                      <Label htmlFor="false" className="cursor-pointer">False</Label>
                    </div>
                  </RadioGroup>
                )}

                {(quiz.question_type === 'Short Answer' || quiz.question_type === 'Essay') && (
                  <Textarea
                    placeholder="Enter your answer here..."
                    value={responses[currentQ.id] || ''}
                    onChange={(e) => handleResponseChange(currentQ.id, e.target.value)}
                    rows={quiz.question_type === 'Essay' ? 6 : 3}
                  />
                )}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>

                <div className="flex items-center gap-2">
                  {isCurrentQuestionAnswered() && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                </div>

                {currentQuestion < totalQuestions - 1 ? (
                  <Button onClick={handleNext}>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button 
                    onClick={() => setShowSubmitDialog(true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Submit Quiz
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Question Navigator */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, index) => (
                  <Button
                    key={q.id}
                    variant={currentQuestion === index ? "default" : "outline"}
                    size="sm"
                    className={`relative ${responses[q.id] ? 'ring-2 ring-green-500' : ''}`}
                    onClick={() => setCurrentQuestion(index)}
                  >
                    {index + 1}
                    {responses[q.id] && (
                      <CheckCircle className="w-3 h-3 absolute -top-1 -right-1 text-green-500 bg-white rounded-full" />
                    )}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {Math.round(progress)}%
                </div>
                <div className="text-sm text-muted-foreground">Complete</div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Answered:</span>
                  <span className="font-medium">{getAnsweredCount()}/{totalQuestions}</span>
                </div>
                <div className="flex justify-between">
                  <span>Time:</span>
                  <span className="font-medium">{formatTime(timeElapsed)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Quiz?</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit your quiz? You cannot change your answers after submission.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Questions answered:</span>
                <div className="font-medium">{getAnsweredCount()} of {totalQuestions}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Time taken:</span>
                <div className="font-medium">{formatTime(timeElapsed)}</div>
              </div>
            </div>
            
            {getAnsweredCount() < totalQuestions && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You have {totalQuestions - getAnsweredCount()} unanswered questions. 
                  These will be marked as incorrect.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
              Continue Quiz
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? 'Submitting...' : 'Submit Quiz'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default TakeQuiz