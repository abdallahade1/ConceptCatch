import axios from 'axios'

const API_BASE = 'http://127.0.0.1:8000'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE,
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('conceptcatch_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('conceptcatch_user')
      localStorage.removeItem('conceptcatch_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ================================
// QUIZ GENERATION
// ================================

export const generateQuiz = async (formData) => {
  const response = await api.post('/quiz/generate', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export const getQuiz = async (quizId) => {
  const response = await api.get(`/quiz/${quizId}`)
  return response.data
}

export const updateQuiz = async (quizId, questions) => {
  const response = await api.put(`/quiz/${quizId}`, questions)
  return response.data
}

export const publishQuiz = async (quizId) => {
  const response = await api.post(`/quiz/${quizId}/publish`)
  return response.data
}

// ================================
// QUIZ TAKING & SUBMISSION
// ================================

export const startQuizAttempt = async (quizId) => {
  const response = await api.post(`/quiz/${quizId}/start`)
  return response.data
}

export const submitQuiz = async (quizId, attemptId, responses, timeTaken = 0) => {
  const formData = new FormData()
  formData.append('attempt_id', attemptId)
  formData.append('responses', JSON.stringify(responses))
  formData.append('time_taken', timeTaken)

  const response = await api.post(`/quiz/${quizId}/submit`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export const getQuizAttempts = async (quizId) => {
  const response = await api.get(`/quiz/${quizId}/attempts`)
  return response.data
}

export const getAttemptDetails = async (attemptId) => {
  const response = await api.get(`/attempt/${attemptId}`)
  return response.data
}

// ================================
// QUIZ EXPORT & SHARING
// ================================

export const exportQuiz = async (quizId, format = 'docx', includeAnswers = true) => {
  const formData = new FormData()
  formData.append('format', format)
  formData.append('include_answers', includeAnswers)

  const response = await api.post(`/quiz/${quizId}/export`, formData, {
    responseType: 'blob',
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  
  // Create download link
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `quiz_${quizId}.${format}`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
  
  return response.data
}

export const createQuizShare = async (quizId) => {
  const response = await api.post(`/quiz/${quizId}/share`)
  return response.data
}

// ================================
// TEACHER DASHBOARD
// ================================

export const getTeacherDashboard = async () => {
  const response = await api.get('/teacher/dashboard')
  return response.data
}

export const getTeacherQuizzes = async () => {
  const response = await api.get('/teacher/quizzes')
  return response.data
}

// ================================
// STUDENT ANALYTICS
// ================================

export const getStudentProfile = async (studentId) => {
  const response = await api.get(`/student/${studentId}/profile`)
  return response.data
}

export const getStudentAttempts = async (studentId) => {
  const response = await api.get(`/student/${studentId}/attempts`)
  return response.data
}

// ================================
// DOCUMENT PROCESSING
// ================================

export const summarizeDocument = async (file) => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await api.post('/document/summarize', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

// ================================
// USER MANAGEMENT
// ================================

export const getCurrentUser = async () => {
  const response = await api.get('/users/me')
  return response.data
}

export const login = async (userId) => {
  const formData = new FormData()
  formData.append('user_id', userId)

  const response = await api.post('/users/login', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

// ================================
// HEALTH CHECK
// ================================

export const healthCheck = async () => {
  const response = await api.get('/health')
  return response.data
}

export default api
