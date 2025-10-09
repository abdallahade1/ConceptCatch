export default function QuizCard({ quiz }) {
  return (
    <div className="p-4 border rounded shadow hover:shadow-md transition">
      <h3 className="text-lg font-semibold">{quiz.title}</h3>
      <p>Difficulty: {quiz.difficulty}</p>
      <p>Questions: {quiz.questions?.length || 0}</p>
    </div>
  );
}
