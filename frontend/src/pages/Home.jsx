import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center p-6">
      <h1 className="text-4xl font-bold mb-4 text-blue-700">
        Welcome to ConceptCatch 🎯
      </h1>
      <p className="text-lg text-gray-700 mb-6">
        Generate AI-powered quizzes from topics, documents, or student mistakes.
      </p>
      <div className="space-x-4">
        <Link
          to="/generate"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Generate a Quiz
        </Link>
        <Link
          to="/student/student_001"
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
        >
          View Profile
        </Link>
      </div>
    </div>
  );
}
