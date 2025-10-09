import { useState } from "react";
import { generateQuiz } from "../api/api";

export default function GenerateQuiz() {
  const [mode, setMode] = useState("prompt");
  const [topic, setTopic] = useState("");
  const [file, setFile] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append("mode", mode);
    if (mode === "prompt") formData.append("topic", topic);
    if (mode === "document" && file) formData.append("file", file);
    formData.append("num_questions", 5);
    formData.append("q_type", "MCQ");
    formData.append("difficulty", "Medium");

    try {
      const data = await generateQuiz(formData);
      setQuiz(data.quiz);
    } catch (err) {
      alert("Error generating quiz: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-semibold mb-4">Generate a Quiz</h2>

      <form onSubmit={handleGenerate} className="space-y-4">
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="prompt">From Topic</option>
          <option value="document">From Document</option>
        </select>

        {mode === "prompt" && (
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter topic"
            className="border p-2 w-full rounded"
          />
        )}

        {mode === "document" && (
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            className="border p-2 w-full rounded"
          />
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Generating..." : "Generate Quiz"}
        </button>
      </form>

      {quiz && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-2">Generated Quiz:</h3>
          <pre className="bg-gray-100 p-3 rounded">{JSON.stringify(quiz, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
