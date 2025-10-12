import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Brain,
  FileText,
  BookOpen,
  Target,
  BarChart3,
  Users,
  Zap,
  CheckCircle,
  ArrowRight,
  Sparkles,
  SearchCheck
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { PlusCircle } from "lucide-react"

const HomePage = () => {
  const { isAuthenticated, isTeacher, isStudent, user } = useAuth()

  const features = [
    {icon: SearchCheck,
    title: 'AI-Powered Feedback',
    description: 'Receive personalized, step-by-step feedback on your answers with AI explanations and reteaching guidance.',
    color: 'text-yellow-500'
    },
    {
      icon: Brain,
      title: 'AI-Powered Quiz Generation',
      description: 'Generate intelligent quizzes using advanced AI that understands your content and creates relevant questions.',
      color: 'text-blue-500'
    },
    {
      icon: FileText,
      title: 'Multiple Input Sources',
      description: 'Create quizzes from topics, uploaded documents, or based on student mistakes for targeted learning.',
      color: 'text-green-500'
    },
    {
      icon: Target,
      title: 'Personalized Learning',
      description: 'Track student performance and generate personalized quizzes to address weak areas.',
      color: 'text-purple-500'
    },
    {
      icon: BarChart3,
      title: 'Detailed Analytics',
      description: 'Get comprehensive insights into student performance with detailed analytics and progress tracking.',
      color: 'text-orange-500'
    }
  ]

  const quickActions = [
    {
      title: 'Get Feedback',
      description: 'Receive detailed feedback and reteaching guidance on your answers',
      icon: SearchCheck,
      href: '/feedback',
      color: 'bg-yellow-500'
    },
    {
      title: 'Generate from Topic',
      description: 'Create a quiz by entering a topic or subject',
      icon: Sparkles,
      href: '/generate?mode=prompt',
      color: 'bg-blue-500'
    },
    {
      title: 'Upload Document',
      description: 'Generate quiz from PDF, DOCX, or text files',
      icon: BookOpen,
      href: '/generate?mode=document',
      color: 'bg-green-500'
    },
    {
      title: 'Practice Quiz',
      description: 'Get personalized quiz based on your mistakes',
      icon: Target,
      href: '/generate?mode=mistakes',
      color: 'bg-purple-500',
      studentOnly: true
    }
  ]

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-6 py-12">
        <div className="space-y-4">
          <Badge variant="secondary" className="px-4 py-2">
            <Zap className="w-4 h-4 mr-2" />
            AI-Powered Quiz Platform
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            Welcome to ConceptCatch
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Generate intelligent quizzes, track student performance, and enhance learning 
            with our AI-powered educational platform.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {isAuthenticated ? (
            <>
              <Button asChild size="lg" className="min-w-[200px]">
                <Link to="/generate">
                  <PlusCircle className="w-5 h-5 mr-2" />
                  Generate Quiz
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="min-w-[200px]">
                <Link to={isTeacher ? "/teacher/dashboard" : "/student/dashboard"}>
                  <BarChart3 className="w-5 h-5 mr-2" />
                  View Dashboard
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild size="lg" className="min-w-[200px]">
                <Link to="/login">
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="min-w-[200px]">
                <Link to="/generate">
                  Try Demo
                </Link>
              </Button>
            </>
          )}
        </div>
      </section>

      {/* Quick Actions */}
      {isAuthenticated && (
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">Quick Actions</h2>
            <p className="text-muted-foreground">
              Get started with these common tasks
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions
              .filter(action => !action.studentOnly || isStudent)
              .map((action, index) => (
                <Card key={index} className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
                  <Link to={action.href}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${action.color} text-white`}>
                          <action.icon className="w-5 h-5" />
                        </div>
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          {action.title}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm">
                        {action.description}
                      </CardDescription>
                    </CardContent>
                  </Link>
                </Card>
              ))}
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">Powerful Features</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need to create, manage, and analyze educational content
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <feature.icon className={`w-8 h-8 ${feature.color}`} />
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* User-specific Dashboard Preview */}
      {isAuthenticated && (
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">
              Welcome back, {user?.name?.split(' ')[0]}!
            </h2>
            <p className="text-muted-foreground">
              {isTeacher 
                ? "Manage your quizzes and track student progress" 
                : "Continue your learning journey and track your progress"
              }
            </p>
          </div>

          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isTeacher ? <Users className="w-5 h-5" /> : <Target className="w-5 h-5" />}
                {isTeacher ? "Teacher Dashboard" : "Student Dashboard"}
              </CardTitle>
              <CardDescription>
                {isTeacher 
                  ? "Access your teaching tools and student analytics"
                  : "View your progress and take new quizzes"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link to={isTeacher ? "/teacher/dashboard" : "/student/dashboard"}>
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Benefits Section */}
      <section className="bg-muted/30 rounded-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">Why Choose ConceptCatch?</h2>
          <p className="text-muted-foreground">
            Join thousands of educators and students improving learning outcomes
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: "Save Time",
              description: "Generate high-quality quizzes in minutes, not hours"
            },
            {
              title: "Improve Learning",
              description: "Personalized content helps students focus on weak areas"
            },
            {
              title: "Track Progress",
              description: "Detailed analytics show learning progress over time"
            }
          ].map((benefit, index) => (
            <div key={index} className="text-center space-y-2">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto" />
              <h3 className="font-semibold text-lg">{benefit.title}</h3>
              <p className="text-muted-foreground text-sm">{benefit.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default HomePage