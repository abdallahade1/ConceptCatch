import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import './App.css'


// Layout Components
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'

// Pages
import Home from './pages/Home'
import GenerateQuiz from './pages/GenerateQuiz'
import TakeQuiz from './pages/TakeQuiz'
import QuizResultsPage from './pages/QuizResultsPage'
import StudentDashboard from './pages/StudentDashboard'
import TeacherDashboard from './pages/TeacherDashboard'
import QuizEditorPage from './pages/QuizEditorPage'
import StudentProfile from './pages/StudentProfile'
import LogIn from './pages/LogIn'
import FeedbackPage from './pages/FeedbackPage'



// Context
import { AuthProvider } from './contexts/AuthContext'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-background">
            <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
            
            <div className="flex">
              <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
              
              <main className="flex-1 transition-all duration-300 ease-in-out">
                <div className="container mx-auto px-4 py-6">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<LogIn />} />
                    <Route path="/generate" element={<GenerateQuiz />} />
                    <Route path="/quiz/:id" element={<TakeQuiz />} />
                    <Route path="/quiz/:id/edit" element={<QuizEditorPage />} />
                    <Route path="/quiz/:id/results/:attemptId" element={<QuizResultsPage />} />
                    <Route path="/student/dashboard" element={<StudentDashboard />} />
                    <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
                    <Route path="/student/:id/profile" element={<StudentProfile />} />
                    <Route path="/feedback" element={<FeedbackPage />} />
                  </Routes>
                </div>
              </main>
            </div>
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App