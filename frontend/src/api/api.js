import axios from "axios";

const API_BASE = "http://127.0.0.1:8000";

export const api = axios.create({
  baseURL: API_BASE,
});

// Generate quiz
export const generateQuiz = async (formData) => {
  const res = await api.post("/quiz/generate", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// Get quiz by ID
export const getQuiz = async (quizId) => {
  const res = await api.get(`/quiz/${quizId}`);
  return res.data;
};

// Submit quiz answers
export const submitQuiz = async (data) => {
  const res = await api.post("/quiz/submit", data);
  return res.data;
};

// Student profile
export const getStudentProfile = async (studentId) => {
  const res = await api.get(`/student/${studentId}/profile`);
  return res.data;
};

export async function getStudentProfile(studentId) {
  const res = await fetch(`/api/students/${studentId}`);
  if (!res.ok) throw new Error("Failed to fetch student profile");
  return res.json();
}