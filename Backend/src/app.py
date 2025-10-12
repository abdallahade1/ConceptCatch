from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, List, Dict, Any
import os
import json
import uuid
from datetime import datetime, timedelta

# Internal imports
from . import database
from .quiz_generation import (
    generate_quiz_from_prompt,
    generate_quiz_from_document,
    generate_quiz_from_mistakes,
    evaluate_quiz_submission,
    update_quiz_questions,
    export_quiz_to_docx,
    export_quiz_to_json,
    create_quiz_share_code
)
from .document_processing import extract_text, validate_file_for_processing
from .document_summarization import summarize_document
from dotenv import load_dotenv
load_dotenv()


# Initialize FastAPI app
app = FastAPI(
    title="ConceptCatch API",
    version="2.0.0",
    description="Intelligent Quiz and Problem Set Generation Platform"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    # allow_origins=["*"],
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer(auto_error=False)

# Configuration
UPLOAD_DIR = os.path.join(os.getcwd(), "data", "uploads")
QUIZ_EXPORT_DIR = os.path.join(os.getcwd(), "data", "quizzes")
DB_PATH = os.path.join(os.getcwd(), "data", "conceptcatch.db")

# Ensure directories exist
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(QUIZ_EXPORT_DIR, exist_ok=True)

# Initialize database
database.init_db(DB_PATH)

# Create default users for demo
def create_demo_users():
    """Create demo users if they don't exist."""
    demo_users = [
        {"user_id": "teacher_001", "name": "Dr. Sarah Johnson", "email": "sarah@conceptcatch.com", "role": "teacher"},
        {"user_id": "student_001", "name": "Alex Chen", "email": "alex@student.com", "role": "student"},
        {"user_id": "student_002", "name": "Maria Garcia", "email": "maria@student.com", "role": "student"},
        {"user_id": "student_003", "name": "John Smith", "email": "john@student.com", "role": "student"},
    ]
    
    for user in demo_users:
        database.create_user(DB_PATH, **user)

create_demo_users()

# Helper functions
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """Get current user from token (simplified for demo)."""
    # In a real application, you would validate the JWT token here
    # For demo purposes, we'll use a simple user ID in the token
    if not credentials:
        # Return default student for demo
        return {"id": "student_001", "role": "student"}
    
    # Simple token parsing (in production, use proper JWT validation)
    try:
        user_id = credentials.credentials
        user = database.get_user(DB_PATH, user_id)
        if user:
            return user
    except:
        pass
    
    # Default fallback
    return {"id": "student_001", "role": "student"}

# ================================
# HEALTH CHECK & INFO
# ================================

@app.get("/")
def home():
    """API health check."""
    return {
        "message": "✅ ConceptCatch API v2.0 is running successfully!",
        "version": "2.0.0",
        "features": [
            "Quiz Generation (Topic, Document, Mistakes)",
            "Quiz Taking & Evaluation",
            "Student Analytics",
            "Teacher Dashboard",
            "Quiz Sharing & Export"
        ]
    }

@app.get("/health")
def health_check():
    """Detailed health check."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "database": "connected",
        "upload_dir": os.path.exists(UPLOAD_DIR),
        "quiz_export_dir": os.path.exists(QUIZ_EXPORT_DIR)
    }

# ================================
# USER MANAGEMENT
# ================================

@app.get("/users/me")
def get_current_user_info(current_user: Dict = Depends(get_current_user)):
    """Get current user information."""
    return {"user": current_user}

@app.post("/users/login")
def login(user_id: str = Form(...)):
    """Simple login for demo (returns user info)."""
    user = database.get_user(DB_PATH, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "message": "Login successful",
        "user": user,
        "token": user_id  # In production, return a proper JWT token
    }

# ================================
# QUIZ GENERATION
# ================================

@app.post("/quiz/generate")
async def api_generate_quiz(
    mode: str = Form(...),
    title: Optional[str] = Form(None),
    topic: Optional[str] = Form(None),
    num_questions: int = Form(5),
    question_type: str = Form("MCQ"),
    difficulty: str = Form("Medium"),
    file: Optional[UploadFile] = File(None),
    student_id: Optional[str] = Form(None),
    current_user: Dict = Depends(get_current_user)
):
    """Generate a quiz based on different modes."""
    
    try:
        quiz_data = None
        
        if mode == "prompt":
            if not topic:
                raise HTTPException(status_code=400, detail="Topic is required for 'prompt' mode.")
            
            quiz_data = generate_quiz_from_prompt(
                topic=topic,
                num_questions=num_questions,
                question_type=question_type,
                difficulty=difficulty,
                title=title
            )
        
        elif mode == "document":
            if not file:
                raise HTTPException(status_code=400, detail="File is required for 'document' mode.")
            
            # Save uploaded file
            file_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")
            with open(file_path, "wb") as f:
                content = await file.read()
                f.write(content)
            
            # Validate file
            is_valid, error_msg = validate_file_for_processing(file_path)
            if not is_valid:
                os.remove(file_path)
                raise HTTPException(status_code=400, detail=error_msg)
            
            quiz_data = generate_quiz_from_document(
                file_path=file_path,
                num_questions=num_questions,
                question_type=question_type,
                difficulty=difficulty,
                title=title
            )
            
            # Clean up uploaded file
            os.remove(file_path)
        
        elif mode == "mistakes":
            if not student_id:
                student_id = current_user["id"]
            
            # Get student's common mistakes
            analytics = database.get_student_analytics(DB_PATH, student_id)
            mistakes = analytics.get("common_mistakes", [])
            
            quiz_data = generate_quiz_from_mistakes(
                student_id=student_id,
                mistakes=mistakes,
                num_questions=num_questions,
                question_type=question_type,
                difficulty=difficulty,
                title=title
            )
        
        else:
            raise HTTPException(status_code=400, detail="Invalid quiz generation mode.")
        
        # Save quiz to database
        quiz_id = database.insert_quiz(DB_PATH, quiz_data, current_user["id"])
        quiz_data["id"] = quiz_id
        
        return {
            "message": "Quiz generated successfully!",
            "quiz": quiz_data
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating quiz: {str(e)}")

@app.get("/quiz/{quiz_id}")
def get_quiz(quiz_id: int, current_user: Dict = Depends(get_current_user)):
    """Get quiz by ID."""
    
    quiz = database.get_quiz_by_id(DB_PATH, quiz_id, include_answers=(current_user["role"] == "teacher"))
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    return {"quiz": quiz}

@app.put("/quiz/{quiz_id}")
def update_quiz(
    quiz_id: int,
    updated_questions: List[Dict[str, Any]],
    current_user: Dict = Depends(get_current_user)
):
    """Update quiz questions (teachers only)."""
    
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can edit quizzes")
    
    quiz = database.get_quiz_by_id(DB_PATH, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    if quiz["created_by"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="You can only edit your own quizzes")
    
    updated_quiz = update_quiz_questions(quiz, updated_questions)
    database.update_quiz(DB_PATH, quiz_id, updated_quiz)
    
    return {"message": "Quiz updated successfully", "quiz": updated_quiz}

@app.post("/quiz/{quiz_id}/publish")
def publish_quiz(quiz_id: int, current_user: Dict = Depends(get_current_user)):
    """Publish a quiz to make it available to students."""
    
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can publish quizzes")
    
    quiz = database.get_quiz_by_id(DB_PATH, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    if quiz["created_by"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="You can only publish your own quizzes")
    
    database.publish_quiz(DB_PATH, quiz_id)
    
    return {"message": "Quiz published successfully"}

# ================================
# QUIZ TAKING & SUBMISSION
# ================================

@app.post("/quiz/{quiz_id}/start")
def start_quiz_attempt(quiz_id: int, current_user: Dict = Depends(get_current_user)):
    """Start a new quiz attempt."""
    
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can take quizzes")
    
    quiz = database.get_quiz_by_id(DB_PATH, quiz_id, include_answers=False)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    attempt_id = database.start_quiz_attempt(DB_PATH, current_user["id"], quiz_id)
    
    return {
        "message": "Quiz attempt started",
        "attempt_id": attempt_id,
        "quiz": quiz
    }

@app.post("/quiz/{quiz_id}/submit")
def submit_quiz(
    quiz_id: int,
    attempt_id: int = Form(...),
    responses: str = Form(...),  # JSON string of responses
    time_taken: int = Form(0),
    current_user: Dict = Depends(get_current_user)
):
    """Submit quiz answers for evaluation."""
    
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can submit quizzes")
    
    try:
        # Parse responses
        student_responses = json.loads(responses)
        
        # Get quiz data with answers for evaluation
        quiz = database.get_quiz_by_id(DB_PATH, quiz_id, include_answers=True)
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")
        
        # Evaluate the submission
        evaluation = evaluate_quiz_submission(quiz, student_responses, time_taken)
        
        # Prepare response data for database
        response_data = []
        for result in evaluation["detailed_results"]:
            response_data.append({
                "question_id": result["question_id"],
                "question_text": result["question_text"],
                "student_answer": result["student_answer"],
                "correct_answer": result["correct_answer"],
                "is_correct": result["is_correct"],
                "points_earned": result["points_earned"],
                "max_points": result["max_points"],
                "response_time": result.get("response_time", 0)
            })
        
        # Save attempt results
        database.submit_quiz_attempt(
            DB_PATH,
            attempt_id,
            response_data,
            evaluation["score"],
            evaluation["max_score"],
            time_taken
        )
        
        # Log mistakes for analytics
        if evaluation["incorrect_responses"]:
            database.log_student_mistakes(DB_PATH, current_user["id"], evaluation["incorrect_responses"])
        
        return {
            "message": "Quiz submitted successfully",
            "results": evaluation
        }
    
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid responses format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error submitting quiz: {str(e)}")

@app.get("/quiz/{quiz_id}/attempts")
def get_quiz_attempts(quiz_id: int, current_user: Dict = Depends(get_current_user)):
    """Get all attempts for a quiz (teachers) or user's attempts (students)."""
    
    quiz = database.get_quiz_by_id(DB_PATH, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    if current_user["role"] == "teacher" and quiz["created_by"] == current_user["id"]:
        # Teachers can see all attempts for their quizzes
        # This would require a new database function
        return {"message": "Teacher quiz attempts view - to be implemented"}
    elif current_user["role"] == "student":
        # Students can see their own attempts
        attempts = database.get_student_attempts(DB_PATH, current_user["id"])
        quiz_attempts = [attempt for attempt in attempts if attempt["quiz_id"] == quiz_id]
        return {"attempts": quiz_attempts}
    else:
        raise HTTPException(status_code=403, detail="Access denied")

# ================================
# QUIZ EXPORT & SHARING
# ================================

@app.post("/quiz/{quiz_id}/export")
def export_quiz(
    quiz_id: int,
    format: str = Form("docx"),
    include_answers: bool = Form(True),
    current_user: Dict = Depends(get_current_user)
):
    """Export quiz to DOCX or JSON format."""
    
    quiz = database.get_quiz_by_id(DB_PATH, quiz_id, include_answers=True)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    # Check permissions
    if current_user["role"] == "student":
        include_answers = False  # Students can't export with answers
    elif current_user["role"] == "teacher" and quiz["created_by"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="You can only export your own quizzes")
    
    try:
        if format.lower() == "docx":
            file_path = export_quiz_to_docx(quiz, include_answers)
        elif format.lower() == "json":
            file_path = export_quiz_to_json(quiz)
        else:
            raise HTTPException(status_code=400, detail="Unsupported export format")
        
        return FileResponse(
            file_path,
            media_type="application/octet-stream",
            filename=os.path.basename(file_path)
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting quiz: {str(e)}")

@app.post("/quiz/{quiz_id}/share")
def create_quiz_share(quiz_id: int, current_user: Dict = Depends(get_current_user)):
    """Create a shareable link for a quiz."""
    
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can share quizzes")
    
    quiz = database.get_quiz_by_id(DB_PATH, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    if quiz["created_by"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="You can only share your own quizzes")
    
    share_code = create_quiz_share_code()
    
    # This would require implementing quiz_shares table operations
    return {
        "message": "Quiz share link created",
        "share_code": share_code,
        "share_url": f"/quiz/shared/{share_code}"
    }

# ================================
# TEACHER DASHBOARD
# ================================

@app.get("/teacher/dashboard")
def get_teacher_dashboard(current_user: Dict = Depends(get_current_user)):
    """Get teacher dashboard data."""
    
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Teacher access required")
    
    # Get teacher's quizzes
    quizzes = database.get_quizzes_by_teacher(DB_PATH, current_user["id"])
    
    # Get teacher analytics
    analytics = database.get_teacher_analytics(DB_PATH, current_user["id"])
    
    return {
        "teacher": current_user,
        "quizzes": quizzes,
        "analytics": analytics
    }

@app.get("/teacher/quizzes")
def get_teacher_quizzes(current_user: Dict = Depends(get_current_user)):
    """Get all quizzes created by the teacher."""
    
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Teacher access required")
    
    quizzes = database.get_quizzes_by_teacher(DB_PATH, current_user["id"])
    return {"quizzes": quizzes}

# ================================
# STUDENT ANALYTICS
# ================================

@app.get("/student/{student_id}/profile")
def get_student_profile(student_id: str, current_user: Dict = Depends(get_current_user)):
    """Get student profile and analytics."""
    
    # Students can only view their own profile, teachers can view any student
    if current_user["role"] == "student" and current_user["id"] != student_id:
        raise HTTPException(status_code=403, detail="You can only view your own profile")
    
    student = database.get_user(DB_PATH, student_id)
    if not student or student["role"] != "student":
        raise HTTPException(status_code=404, detail="Student not found")
    
    analytics = database.get_student_analytics(DB_PATH, student_id)
    
    return {
        "student": student,
        "analytics": analytics
    }

@app.get("/student/{student_id}/attempts")
def get_student_attempts(student_id: str, current_user: Dict = Depends(get_current_user)):
    """Get all quiz attempts by a student."""
    
    # Students can only view their own attempts, teachers can view any student
    if current_user["role"] == "student" and current_user["id"] != student_id:
        raise HTTPException(status_code=403, detail="You can only view your own attempts")
    
    attempts = database.get_student_attempts(DB_PATH, student_id)
    return {"attempts": attempts}

@app.get("/attempt/{attempt_id}")
def get_attempt_details(attempt_id: int, current_user: Dict = Depends(get_current_user)):
    """Get detailed results for a quiz attempt."""
    
    attempt = database.get_quiz_attempt_details(DB_PATH, attempt_id)
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    # Check permissions
    if current_user["role"] == "student" and current_user["id"] != attempt["student_id"]:
        raise HTTPException(status_code=403, detail="You can only view your own attempts")
    
    return {"attempt": attempt}

# ================================
# DOCUMENT PROCESSING
# ================================

@app.post("/document/summarize")
async def api_summarize_document(file: UploadFile = File(...)):
    """Summarize an uploaded document."""
    
    try:
        # Save uploaded file
        file_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Validate file
        is_valid, error_msg = validate_file_for_processing(file_path)
        if not is_valid:
            os.remove(file_path)
            raise HTTPException(status_code=400, detail=error_msg)
        
        # Extract and summarize text
        text_content = extract_text(file_path)
        summary = summarize_document(text_content)
        
        # Clean up
        os.remove(file_path)
        
        return {
            "message": "Document summarized successfully",
            "filename": file.filename,
            "summary": summary
        }
    
    except Exception as e:
        # Clean up on error
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")

# ================================
# ERROR HANDLERS
# ================================

@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={"message": "Resource not found", "detail": str(exc.detail) if hasattr(exc, 'detail') else "Not found"}
    )

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"message": "Internal server error", "detail": "An unexpected error occurred"}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)