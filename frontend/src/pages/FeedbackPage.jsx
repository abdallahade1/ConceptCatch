import { useState } from "react"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Upload, Send } from "lucide-react"

const FeedbackPage = () => {
  const [subject, setSubject] = useState("")
  const [question, setQuestion] = useState("")
  const [studentAnswer, setStudentAnswer] = useState("")
  const [feedback, setFeedback] = useState("")
  const [followup, setFollowup] = useState("")
  const [loading, setLoading] = useState(false)
  const [resource, setResource] = useState(null)

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) setResource(file)
  }

  const handleGetFeedback = async () => {
    if (!question || !studentAnswer) {
      alert("Please enter both question and answer.")
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("subject", subject)
      formData.append("question", question)
      formData.append("student_answer", studentAnswer)
      if (resource) formData.append("resource", resource)

      const response = await fetch("/api/feedback", { method: "POST", body: formData })
      const data = await response.json()
      setFeedback(data.feedback || "No feedback received.")
    } catch (err) {
      console.error(err)
      setFeedback("Error fetching feedback.")
    } finally {
      setLoading(false)
    }
  }

  const handleFollowup = async () => {
    if (!followup.trim()) return
    setLoading(true)
    try {
      const response = await fetch("/api/followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followup_question: followup }),
      })
      const data = await response.json()
      setFeedback((prev) => prev + "\n\nTutor: " + (data.answer || ""))
      setFollowup("")
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-row w-full h-screen p-6 gap-6">
      {/* Left Panel — Inputs */}
      <div className="w-full md:w-1/3 space-y-4">
        <Card className="h-full shadow-md flex flex-col">
          <CardHeader>
            <CardTitle>Submit for Feedback</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 flex-1">
            <div>
              <label className="block text-sm font-medium mb-1">Subject</label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter subject (e.g. Calculus)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Question</label>
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Enter your question..."
                className="min-h-[100px]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Your Answer</label>
              <Textarea
                value={studentAnswer}
                onChange={(e) => setStudentAnswer(e.target.value)}
                placeholder="Enter your answer..."
                className="min-h-[100px]"
              />
            </div>

            {/* Upload Resource */}
            <div className="flex items-center justify-between border rounded-lg p-2">
              <span className="text-sm text-muted-foreground">
                {resource ? resource.name : "No file selected"}
              </span>
              <label
                htmlFor="upload"
                className="cursor-pointer p-2 rounded-md hover:bg-muted transition"
              >
                <Upload className="w-5 h-5 text-muted-foreground" />
                <input
                  id="upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".pdf,.txt,.docx"
                />
              </label>
            </div>

            <Button
              onClick={handleGetFeedback}
              disabled={loading}
              className="w-full mt-auto"
            >
              {loading ? "Generating..." : "Get Feedback"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Right Panel — Feedback Display */}
      <div className="w-full md:w-2/3 flex flex-col">
        <Card className="h-full shadow-md flex flex-col">
          <CardHeader>
            <CardTitle>AI Tutor Feedback</CardTitle>
          </CardHeader>

          {/* Feedback display area */}
          <CardContent className="flex-1 overflow-y-auto bg-muted/20 rounded-md p-4 whitespace-pre-wrap">
            {feedback || "Your feedback will appear here after submission."}
          </CardContent>

          {/* Follow-up input area */}
          <div className="border-t p-4 flex items-center gap-2">
            <Textarea
              value={followup}
              onChange={(e) => setFollowup(e.target.value)}
              placeholder="Ask a follow-up question..."
              className="flex-1 resize-none"
            />
            <Button onClick={handleFollowup} disabled={loading}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default FeedbackPage