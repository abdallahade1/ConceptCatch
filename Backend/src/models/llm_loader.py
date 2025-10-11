import os
import json
import regex as re
from typing import Dict, List, Any, Optional
from openai import AzureOpenAI
from dotenv import load_dotenv
load_dotenv()

class LLMModel:
    """LLM model wrapper configured for Azure OpenAI GPT-5-mini."""

    def __init__(self, model_name: str = "gpt-5-mini"):
        self.model_name = model_name
        self.endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
        self.api_key = os.getenv("AZURE_OPENAI_API_KEY")
        self.deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT", model_name)

        if not self.endpoint or not self.api_key:
            raise ValueError(
                "Azure OpenAI credentials are missing. Please set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY."
            )

        # Initialize Azure OpenAI client
        self.client = AzureOpenAI(
            api_key=self.api_key,
            azure_endpoint=self.endpoint,
            api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-12-01-preview")
        )

    def generate_response(self, prompt: str, max_tokens: int = 1000, temperature: float = 0.7) -> str:
        """Generate a standard response using Azure OpenAI."""
        try:
            response = self.client.chat.completions.create(
                model=self.deployment,
                messages=[{"role": "user", "content": prompt}],
                max_completion_tokens=max_tokens,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"[Azure LLM Error] {e}")
            return "Error generating response"

    def generate_structured_response(self, prompt: str, response_format: Dict,
                                 max_tokens: int = 1500) -> Dict:
        """Generate a structured JSON response using Azure OpenAI."""
        structured_prompt = f"""
    {prompt}

    Please respond ONLY with a valid JSON object that matches this format:
    {json.dumps(response_format, indent=2)}

    If you cannot follow the structure exactly, still respond with the best possible JSON that fits the format.
    """

        try:
            print(f"[INFO] Sending request to Azure LLM model: {self.deployment}")
            response = self.client.chat.completions.create(
                model=self.deployment,
                messages=[{"role": "user", "content": structured_prompt}],
                max_completion_tokens=max_tokens,
                temperature=1  # required default for Azure
            )

            if not response.choices or not response.choices[0].message:
                print("[Warning] Azure returned an empty choices list.")
                return {"error": "No content returned"}

            content = response.choices[0].message.content
            if not content:
                print("[Warning] Empty content received from Azure LLM.")
                print(f"[DEBUG] Full Azure response: {response}")
                return {"error": "Empty response from model"}

            print(f"[DEBUG] Raw LLM output:\n{content}\n")

            # Try to parse JSON robustly
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                print("[Warning] Could not extract JSON object. Attempting regex extraction...")
                match = re.search(r'\{.*\}', content, re.DOTALL)
                if match:
                    try:
                        return json.loads(match.group(0))
                    except Exception:
                        pass
                return {"raw_text": content.strip()}

        except Exception as e:
            print(f"[Azure LLM Error] {e}")
            return {"error": str(e)}

class QuizGenerator:
    """Enhanced quiz generator with improved prompting."""
    
    def __init__(self, model_name: str = "gpt-5-mini"):
        self.llm = LLMModel(model_name)
    
    def generate_quiz_from_topic(self, topic: str, num_questions: int, 
                               question_type: str, difficulty: str) -> Dict[str, Any]:
        """Generate quiz from a topic with enhanced prompting."""
        
        # Define the expected response format
        response_format = {
            "title": "Quiz title",
            "topic": "Topic name",
            "difficulty": "Easy/Medium/Hard",
            "questions": [
                {
                    "id": "1",
                    "question": "Question text",
                    "options": ["A", "B", "C", "D"] if question_type == "MCQ" else None,
                    "correct_answer": "Correct answer",
                    "explanation": "Detailed explanation",
                    "points": 1
                }
            ]
        }
        
        # Create enhanced prompt
        prompt = self._create_topic_prompt(topic, num_questions, question_type, difficulty)
        
        # Generate structured response
        quiz_data = self.llm.generate_structured_response(prompt, response_format)
        
        # Add metadata
        quiz_data.update({
            "generation_mode": "prompt",
            "question_type": question_type,
            "num_questions": num_questions
        })
        
        return quiz_data
    
    def generate_quiz_from_document(self, content: str, num_questions: int,
                                  question_type: str, difficulty: str) -> Dict[str, Any]:
        """Generate quiz from document content."""
        
        # First, summarize the document if it's too long
        if len(content) > 3000:
            summary_prompt = f"""
Summarize the following document content, focusing on the key concepts, 
facts, and important information that would be suitable for creating quiz questions:

{content[:3000]}...

Provide a comprehensive summary that captures the main learning objectives.
"""
            content = self.llm.generate_response(summary_prompt, max_tokens=800)
        
        response_format = {
            "title": "Document-based Quiz",
            "topic": "Extracted from document",
            "difficulty": difficulty,
            "questions": [
                {
                    "id": "1",
                    "question": "Question text",
                    "options": ["A", "B", "C", "D"] if question_type == "MCQ" else None,
                    "correct_answer": "Correct answer",
                    "explanation": "Detailed explanation",
                    "points": 1
                }
            ]
        }
        
        prompt = self._create_document_prompt(content, num_questions, question_type, difficulty)
        quiz_data = self.llm.generate_structured_response(prompt, response_format)
        
        quiz_data.update({
            "generation_mode": "document",
            "question_type": question_type,
            "num_questions": num_questions
        })
        
        return quiz_data
    
    def generate_quiz_from_mistakes(self, mistakes: List[Dict], num_questions: int,
                                  question_type: str, difficulty: str) -> Dict[str, Any]:
        """Generate quiz targeting student's common mistakes."""
        
        mistakes_text = "\n".join([
            f"- Topic: {m['topic']}, Concept: {m['concept']}, Type: {m['mistake_type']}"
            for m in mistakes
        ])
        
        response_format = {
            "title": "Personalized Practice Quiz",
            "topic": "Mistake Remediation",
            "difficulty": difficulty,
            "questions": [
                {
                    "id": "1",
                    "question": "Question text",
                    "options": ["A", "B", "C", "D"] if question_type == "MCQ" else None,
                    "correct_answer": "Correct answer",
                    "explanation": "Detailed explanation focusing on common mistakes",
                    "points": 1,
                    "targets_mistake": "Which mistake this question addresses"
                }
            ]
        }
        
        prompt = self._create_mistakes_prompt(mistakes_text, num_questions, question_type, difficulty)
        quiz_data = self.llm.generate_structured_response(prompt, response_format)
        
        quiz_data.update({
            "generation_mode": "mistakes",
            "question_type": question_type,
            "num_questions": num_questions
        })
        
        return quiz_data
    
    def _create_topic_prompt(self, topic: str, num_questions: int, 
                           question_type: str, difficulty: str) -> str:
        """Create enhanced prompt for topic-based quiz generation."""
        
        difficulty_guidelines = {
            "Easy": "Focus on basic concepts, definitions, and simple applications. Avoid complex problem-solving.",
            "Medium": "Include moderate complexity with some application and analysis. Mix conceptual and practical questions.",
            "Hard": "Emphasize critical thinking, complex applications, and synthesis of multiple concepts."
        }
        
        question_type_guidelines = {
            "MCQ": "Create 4 plausible options (A, B, C, D) with only one correct answer. Make distractors realistic but clearly incorrect.",
            "True/False": "Create statements that test understanding of key concepts. Avoid trick questions.",
            "Short Answer": "Ask for brief, specific responses (1-3 sentences). Focus on key facts or simple explanations.",
            "Essay": "Require detailed explanations, analysis, or arguments. Provide clear evaluation criteria."
        }
        
        return f"""
You are an expert educator creating a high-quality quiz on the topic: "{topic}"

Requirements:
- Generate exactly {num_questions} questions
- Question type: {question_type}
- Difficulty level: {difficulty}
- {difficulty_guidelines.get(difficulty, "")}
- {question_type_guidelines.get(question_type, "")}

Guidelines for high-quality questions:
1. Ensure questions test understanding, not just memorization
2. Use clear, unambiguous language
3. Avoid cultural bias or assumptions
4. Make questions relevant and practical when possible
5. Provide detailed explanations that help learning
6. Ensure correct answers are definitively correct
7. For MCQ, make all options plausible but only one correct

Create a comprehensive quiz that effectively assesses student knowledge of {topic}.
"""
    
    def _create_document_prompt(self, content: str, num_questions: int,
                              question_type: str, difficulty: str) -> str:
        """Create prompt for document-based quiz generation."""
        
        return f"""
You are an expert educator creating a quiz based on the following document content:

{content}

Requirements:
- Generate exactly {num_questions} questions based ONLY on the provided content
- Question type: {question_type}
- Difficulty level: {difficulty}
- Questions must be answerable from the given content
- Focus on the most important concepts and information
- Ensure questions test comprehension and application of the material

Guidelines:
1. Extract key learning objectives from the content
2. Create questions that test different levels of understanding
3. Ensure all answers can be found in or derived from the provided content
4. Provide explanations that reference the source material
5. Avoid questions that require external knowledge not in the document

Create a quiz that effectively assesses understanding of this specific content.
"""
    
    def _create_mistakes_prompt(self, mistakes_text: str, num_questions: int,
                              question_type: str, difficulty: str) -> str:
        """Create prompt for mistake-based quiz generation."""
        
        return f"""
You are an expert educator creating a personalized practice quiz to help a student improve in areas where they commonly make mistakes.

Student's Common Mistakes:
{mistakes_text}

Requirements:
- Generate exactly {num_questions} questions targeting these specific mistake areas
- Question type: {question_type}
- Difficulty level: {difficulty}
- Each question should help the student practice and overcome their mistakes
- Focus on the underlying concepts behind the mistakes

Guidelines:
1. Create questions that directly address the mistake patterns
2. Provide detailed explanations that clarify common misconceptions
3. Include tips and strategies to avoid similar mistakes in the future
4. Make questions progressively help build confidence and understanding
5. Address both the conceptual understanding and practical application

Create a targeted practice quiz that will help this student improve their weak areas.
"""


class QuizEvaluator:
    """Enhanced quiz evaluator using LLM for intelligent grading."""
    
    def __init__(self, model_name: str = "gpt-5-mini"):
        self.llm = LLMModel(model_name)
    
    def evaluate_response(self, question: Dict, student_answer: str, 
                         question_type: str) -> Dict[str, Any]:
        """Evaluate a single student response using LLM."""
        
        if question_type == "MCQ":
            return self._evaluate_mcq(question, student_answer)
        elif question_type == "True/False":
            return self._evaluate_true_false(question, student_answer)
        elif question_type in ["Short Answer", "Essay"]:
            return self._evaluate_open_ended(question, student_answer, question_type)
        else:
            return {"is_correct": False, "points_earned": 0, "feedback": "Unknown question type"}
    
    def _evaluate_mcq(self, question: Dict, student_answer: str) -> Dict[str, Any]:
        """Evaluate multiple choice question."""
        correct_answer = question.get("correct_answer", "").strip().upper()
        student_answer = student_answer.strip().upper()
        
        is_correct = student_answer == correct_answer
        points_earned = question.get("points", 1) if is_correct else 0
        
        return {
            "is_correct": is_correct,
            "points_earned": points_earned,
            "max_points": question.get("points", 1),
            "feedback": question.get("explanation", "") if is_correct else 
                       f"Incorrect. The correct answer is {correct_answer}. {question.get('explanation', '')}"
        }
    
    def _evaluate_true_false(self, question: Dict, student_answer: str) -> Dict[str, Any]:
        """Evaluate true/false question."""
        correct_answer = question.get("correct_answer", "").strip().lower()
        student_answer = student_answer.strip().lower()
        
        # Normalize answers
        true_variants = ["true", "t", "yes", "y", "1"]
        false_variants = ["false", "f", "no", "n", "0"]
        
        if student_answer in true_variants:
            student_answer = "true"
        elif student_answer in false_variants:
            student_answer = "false"
        
        if correct_answer in true_variants:
            correct_answer = "true"
        elif correct_answer in false_variants:
            correct_answer = "false"
        
        is_correct = student_answer == correct_answer
        points_earned = question.get("points", 1) if is_correct else 0
        
        return {
            "is_correct": is_correct,
            "points_earned": points_earned,
            "max_points": question.get("points", 1),
            "feedback": question.get("explanation", "") if is_correct else 
                       f"Incorrect. The correct answer is {correct_answer.title()}. {question.get('explanation', '')}"
        }
    
    def _evaluate_open_ended(self, question: Dict, student_answer: str, 
                           question_type: str) -> Dict[str, Any]:
        """Evaluate open-ended questions using LLM."""
        
        evaluation_prompt = f"""
You are an expert educator evaluating a student's response to a {question_type.lower()} question.

Question: {question.get('question', '')}
Correct/Expected Answer: {question.get('correct_answer', '')}
Student's Answer: {student_answer}

Please evaluate the student's response and provide:
1. A score from 0 to {question.get('points', 1)} (can be partial credit)
2. Whether the answer demonstrates understanding of key concepts
3. Specific feedback for improvement
4. Recognition of what the student did well

Respond in this JSON format:
{{
    "points_earned": <score>,
    "is_correct": <true if score >= 70% of max points>,
    "feedback": "<detailed feedback>",
    "strengths": "<what student did well>",
    "areas_for_improvement": "<specific suggestions>"
}}
"""
        
        try:
            import json
            evaluation = self.llm.generate_response(evaluation_prompt, max_tokens=500)
            result = json.loads(evaluation)
            
            result["max_points"] = question.get("points", 1)
            return result
            
        except Exception as e:
            print(f"Error in LLM evaluation: {e}")
            # Fallback to simple keyword matching
            correct_answer = question.get("correct_answer", "").lower()
            student_lower = student_answer.lower()
            
            # Simple keyword-based scoring
            keywords = correct_answer.split()
            matches = sum(1 for keyword in keywords if keyword in student_lower)
            score_ratio = matches / len(keywords) if keywords else 0
            
            points_earned = score_ratio * question.get("points", 1)
            is_correct = score_ratio >= 0.7
            
            return {
                "is_correct": is_correct,
                "points_earned": points_earned,
                "max_points": question.get("points", 1),
                "feedback": f"Score: {points_earned:.1f}/{question.get('points', 1)}. " +
                           ("Good work!" if is_correct else "Please review the correct answer and try to include more key concepts.")
            }


# Factory functions for backward compatibility
def load_question_generation_model():
    """Load question generation model."""
    return QuizGenerator()

def load_answer_generation_model():
    """Load answer generation model (same as quiz generator)."""
    return QuizGenerator()

def load_summarizer():
    """Load document summarizer."""
    return LLMModel()

def load_evaluator():
    """Load quiz evaluator."""
    return QuizEvaluator()