import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FileText,
  Upload,
  Target,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Loader2,
  Brain,
  Settings
} from 'lucide-react'
import { generateQuiz } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

const GenerateQuizPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { isAuthenticated, isStudent } = useAuth()
  
  // Form state
  const [mode, setMode] = useState(searchParams.get('mode') || 'prompt')
  const [title, setTitle] = useState('')
  const [topic, setTopic] = useState('')
  const [file, setFile] = useState(null)
  const [numQuestions, setNumQuestions] = useState(5)
  const [questionType, setQuestionType] = useState('MCQ')
  const [difficulty, setDifficulty] = useState('Medium')
  const [generatedQuiz, setGeneratedQuiz] = useState(null)

  // Mutation for quiz generation
  const generateMutation = useMutation({
    mutationFn: generateQuiz,
    onSuccess: (data) => {
      setGeneratedQuiz(data.quiz)
    },
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    const formData = new FormData()
    formData.append('mode', mode)
    formData.append('title', title || '')
    formData.append('num_questions', numQuestions)
    formData.append('question_type', questionType)
    formData.append('difficulty', difficulty)

    if (mode === 'prompt') {
      if (!topic.trim()) {
        return
      }
      formData.append('topic', topic)
    } else if (mode === 'document') {
      if (!file) {
        return
      }
      formData.append('file', file)
    }

    generateMutation.mutate(formData)
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      // Validate file size (10MB limit)
      if (selectedFile.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB')
        return
      }
      
      // Validate file type
      const allowedTypes = ['.pdf', '.docx', '.txt', '.html']
      const fileExtension = '.' + selectedFile.name.split('.').pop().toLowerCase()
      if (!allowedTypes.includes(fileExtension)) {
        alert('Please upload a PDF, DOCX, TXT, or HTML file')
        return
      }
      
      setFile(selectedFile)
    }
  }

  const handleUseQuiz = () => {
    if (generatedQuiz) {
      navigate(`/quiz/${generatedQuiz.id}`)
    }
  }

  const modes = [
    {
      id: 'prompt',
      title: 'Topic-Based',
      description: 'Generate quiz from a topic or subject',
      icon: Sparkles,
      color: 'text-blue-500'
    },
    {
      id: 'document',
      title: 'Document-Based',
      description: 'Upload a document to generate quiz',
      icon: FileText,
      color: 'text-green-500'
    },
    {
      id: 'mistakes',
      title: 'Practice Quiz',
      description: 'Personalized quiz based on your mistakes',
      icon: Target,
      color: 'text-purple-500',
      studentOnly: true
    }
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Brain className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Generate Quiz</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Create intelligent quizzes using AI. Choose from topic-based generation, 
          document upload, or personalized practice quizzes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Generation Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mode Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Quiz Generation Mode</CardTitle>
              <CardDescription>
                Choose how you want to generate your quiz
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {modes
                  .filter(m => !m.studentOnly || isStudent)
                  .map((modeOption) => (
                    <div
                      key={modeOption.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        mode === modeOption.id
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => setMode(modeOption.id)}
                    >
                      <div className="flex flex-col items-center text-center space-y-2">
                        <modeOption.icon className={`w-8 h-8 ${modeOption.color}`} />
                        <h3 className="font-medium">{modeOption.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          {modeOption.description}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Quiz Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Quiz Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Quiz Title (Optional)</Label>
                  <Input
                    id="title"
                    placeholder="Enter a custom title for your quiz"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                {/* Mode-specific inputs */}
                {mode === 'prompt' && (
                  <div className="space-y-2">
                    <Label htmlFor="topic">Topic *</Label>
                    <Textarea
                      id="topic"
                      placeholder="Enter the topic or subject for your quiz (e.g., 'Photosynthesis in plants', 'World War II', 'JavaScript functions')"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      rows={3}
                      required
                    />
                  </div>
                )}

                {mode === 'document' && (
                  <div className="space-y-2">
                    <Label htmlFor="file">Upload Document *</Label>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                      <div className="text-center space-y-2">
                        <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
                        <div>
                          <Label htmlFor="file" className="cursor-pointer text-primary hover:text-primary/80">
                            Click to upload
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            PDF, DOCX, TXT, or HTML files (max 10MB)
                          </p>
                        </div>
                        <Input
                          id="file"
                          type="file"
                          accept=".pdf,.docx,.txt,.html"
                          onChange={handleFileChange}
                          className="hidden"
                          required
                        />
                      </div>
                      {file && (
                        <div className="mt-4 p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            <span className="text-sm font-medium">{file.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {mode === 'mistakes' && (
                  <Alert>
                    <Target className="h-4 w-4" />
                    <AlertDescription>
                      This will generate a personalized quiz based on your previous mistakes 
                      and weak areas to help you improve.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Quiz Parameters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="numQuestions">Number of Questions</Label>
                    <Select value={numQuestions.toString()} onValueChange={(value) => setNumQuestions(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[3, 5, 10, 15, 20].map(num => (
                          <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="questionType">Question Type</Label>
                    <Select value={questionType} onValueChange={setQuestionType}>
                      <SelectTrigger>
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
                    <Label htmlFor="difficulty">Difficulty</Label>
                    <Select value={difficulty} onValueChange={setDifficulty}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Easy">Easy</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={generateMutation.isPending}
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating Quiz...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Quiz
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Error Display */}
          {generateMutation.isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {generateMutation.error?.response?.data?.detail || 'Failed to generate quiz'}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Results Panel */}
        <div className="space-y-6">
          {/* Generation Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Generation Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {generateMutation.isPending && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Generating quiz...</span>
                  </div>
                  <Progress value={75} className="w-full" />
                  <p className="text-xs text-muted-foreground">
                    This may take a few moments depending on the complexity
                  </p>
                </div>
              )}

              {generateMutation.isSuccess && generatedQuiz && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Quiz generated successfully!</span>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">{generatedQuiz.title}</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{generatedQuiz.num_questions} questions</Badge>
                      <Badge variant="secondary">{generatedQuiz.difficulty}</Badge>
                      <Badge variant="secondary">{generatedQuiz.question_type}</Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button onClick={handleUseQuiz} className="w-full">
                      Take Quiz
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate(`/quiz/${generatedQuiz.id}/edit`)}
                    >
                      Edit Quiz
                    </Button>
                  </div>
                </div>
              )}

              {!generateMutation.isPending && !generateMutation.isSuccess && (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Configure your quiz settings and click generate</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tips for Better Quizzes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium">Topic-Based:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Be specific about the topic</li>
                  <li>• Include context or level (e.g., "high school biology")</li>
                  <li>• Mention key concepts to focus on</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Document-Based:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Use well-structured documents</li>
                  <li>• Ensure text is clear and readable</li>
                  <li>• Longer documents may take more time</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default GenerateQuizPage
