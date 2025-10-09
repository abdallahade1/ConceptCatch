import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getQuiz, submitQuiz } from "../api/api";

export default function TakeQuiz() {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchQuiz() {
      try {
        const data = await getQuiz(id);
        setQuiz(data.quiz);
      } catch (err) {
        alert("Error loading quiz: " + err.message);
      }
    }
    fetchQuiz();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await submitQuiz({
        quiz_id: id,
        student_id: "student_001", // can be dynamic later
        submitted_answers: JSON.stringify(answers),
      });
      setResult(data.evaluation);
    } catch (err) {
      alert("Error submitting quiz: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!quiz) return <p className="p-6">Loading quiz...</p>;

  return (
    <div className="p-8">
      <h2 className="text-2xl font-semibold mb-4">{quiz.title || "Quiz"}</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {quiz.questions?.map((q, idx) => (
          <div key={idx} className="border p-4 rounded shadow-sm">
            <p className="font-medium mb-2">
              {idx + 1}. {q.question}
            </p>

            {q.options ? (
              q.options.map((opt, j) => (
                <label key={j} className="block">
                  <input
                    type="radio"
                    name={`q_${idx}`}
                    value={opt}
                    checked={answers[q.id] === opt}
                    onChange={() =>
                      setAnswers({ ...answers, [q.id]: opt })
                    }
                  />
                  <span className="ml-2">{opt}</span>
                </label>
              ))
            ) : (
              <input
                type="text"
                placeholder="Your answer"
                className="border p-2 w-full rounded"
                value={answers[q.id] || ""}
                onChange={(e) =>
                  setAnswers({ ...answers, [q.id]: e.target.value })
                }
              />
            )}
          </div>
        ))}

        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          {loading ? "Submitting..." : "Submit Quiz"}
        </button>
      </form>

      {result && (
        <div className="mt-8 bg-gray-100 p-4 rounded shadow">
          <h3 className="text-xl font-semibold mb-2">Results</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
