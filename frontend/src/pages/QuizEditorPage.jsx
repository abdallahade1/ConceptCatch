import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Edit,
  Save,
  PlusCircle,
  Trash2,
  AlertCircle,
  Loader2,
  CheckCircle,
  BookOpen,
  ArrowLeft
} from 'lucide-react'
import { getQuiz, updateQuiz, publishQuiz } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

const QuizEditorPage = () => {
  const { id: quizId } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated, isTeacher } = useAuth()

  const [quizTitle, setQuizTitle] = useState('')
  const [questions, setQuestions] = useState([])
  const [isPublished, setIsPublished] = useState(false)

  // Fetch quiz data
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['quiz', quizId],
    queryFn: () => getQuiz(quizId),
    enabled: !!quizId && isAuthenticated && isTeacher,
  })

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
    } else if (!isTeacher) {
      navigate('/')
    }
  }, [isAuthenticated, isTeacher, navigate])

  useEffect(() => {
    if (data?.quiz) {
      setQuizTitle(data.quiz.title)
      setQuestions(data.quiz.questions)
      setIsPublished(data.quiz.is_published)
    }
  }, [data])

  // Update quiz mutation
  const updateQuizMutation = useMutation({
    mutationFn: (updatedQuestions) => updateQuiz(quizId, updatedQuestions),
    onSuccess: () => {
      alert('Quiz updated successfully!')
      refetch()
    },
    onError: (err) => {
      alert(`Error updating quiz: ${err.response?.data?.detail || err.message}`)
    }
  })

  // Publish quiz mutation
  const publishQuizMutation = useMutation({
    mutationFn: () => publishQuiz(quizId),
    onSuccess: () => {
      alert('Quiz published successfully!')
      setIsPublished(true)
      refetch()
    },
    onError: (err) => {
      alert(`Error publishing quiz: ${err.response?.data?.detail || err.message}`)
    }
  })

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...questions]
    newQuestions[index][field] = value
    setQuestions(newQuestions)
  }

  const handleOptionChange = (qIndex, oIndex, value) => {
    const newQuestions = [...questions]
    newQuestions[qIndex].options[oIndex] = value
    setQuestions(newQuestions)
  }

  const handleAddOption = (qIndex) => {
    const newQuestions = [...questions]
    newQuestions[qIndex].options.push('')
    setQuestions(newQuestions)
  }

  const handleRemoveOption = (qIndex, oIndex) => {
    const newQuestions = [...questions]
    newQuestions[qIndex].options.splice(oIndex, 1)
    setQuestions(newQuestions)
  }

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: `new-${questions.length + 1}`,
        question: '',
        question_type: 'MCQ',
        options: ['', ''],
        correct_answer: '',
        explanation: ''
      }
    ])
  }

  const handleRemoveQuestion = (index) => {
    const newQuestions = questions.filter((_, i) => i !== index)
    setQuestions(newQuestions)
  }

  const handleSaveQuiz = () => {
    updateQuizMutation.mutate({ questions: questions })
  }

  const handlePublish = () => {
    publishQuizMutation.mutate()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading quiz for editing...</p>
        </div>
      </div>
    )
  }

  if (error || !data?.quiz) {
    return (
      <div className="max-w-2xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error?.response?.data?.detail || 'Quiz not found or you do not have permission to edit it.'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Edit className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Edit Quiz</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Make changes to your quiz questions, answers, and explanations.
        </p>
      </div>

      {/* Quiz Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Quiz: {quizTitle}
            </div>
            <Badge variant={isPublished ? 'success' : 'outline'}>
              {isPublished ? 'Published' : 'Draft'}
            </Badge>
          </CardTitle>
          <CardDescription>
            You can edit the quiz details and questions below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quizTitle">Quiz Title</Label>
            <Input
              id="quizTitle"
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
              placeholder="Enter quiz title"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/teacher/dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <Button
              onClick={handleSaveQuiz}
              disabled={updateQuizMutation.isPending}
            >
              {updateQuizMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
            {!isPublished && (
              <Button
                onClick={handlePublish}
                disabled={publishQuizMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {publishQuizMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Publish Quiz
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Questions Editor */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Questions</h2>
        {questions.map((q, qIndex) => (
          <Card key={q.id || qIndex}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Question {qIndex + 1}</CardTitle>
              <Button variant="destructive" size="sm" onClick={() => handleRemoveQuestion(qIndex)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`question-${qIndex}`}>Question Text</Label>
                <Textarea
                  id={`question-${qIndex}`}
                  value={q.question}
                  onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`qType-${qIndex}`}>Question Type</Label>
                  <Select
                    value={q.question_type}
                    onValueChange={(value) => handleQuestionChange(qIndex, 'question_type', value)}
                  >
                    <SelectTrigger id={`qType-${qIndex}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MCQ">Multiple Choice</SelectItem>
                      <SelectItem value="True/False">True/False</SelectItem>
                      <SelectItem value="Short Answer">Short Answer</SelectItem>
                      <SelectItem value="Essay">Essay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`correctAnswer-${qIndex}`}>Correct Answer</Label>
                  <Input
                    id={`correctAnswer-${qIndex}`}
                    value={q.correct_answer}
                    onChange={(e) => handleQuestionChange(qIndex, 'correct_answer', e.target.value)}
                    placeholder="Enter the correct answer"
                  />
                </div>
              </div>

              {(q.question_type === 'MCQ' || q.question_type === 'True/False') && (
                <div className="space-y-2">
                  <Label>Options</Label>
                  {q.options.map((option, oIndex) => (
                    <div key={oIndex} className="flex items-center gap-2">
                      <Input
                        value={option}
                        onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                        placeholder={`Option ${oIndex + 1}`}
                      />
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveOption(qIndex, oIndex)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => handleAddOption(qIndex)}>
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Add Option
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor={`explanation-${qIndex}`}>Explanation (Optional)</Label>
                <Textarea
                  id={`explanation-${qIndex}`}
                  value={q.explanation}
                  onChange={(e) => handleQuestionChange(qIndex, 'explanation', e.target.value)}
                  rows={3}
                  placeholder="Provide an explanation for the correct answer"
                />
              </div>
            </CardContent>
          </Card>
        ))}
        <Button onClick={handleAddQuestion} className="w-full">
          <PlusCircle className="w-4 h-4 mr-2" />
          Add New Question
        </Button>
      </section>
    </div>
  )
}

export default QuizEditorPage
