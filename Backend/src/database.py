import sqlite3
import json
import os
from datetime import datetime
from typing import Dict, List, Optional, Any


def get_connection(db_path: str):
    """Get database connection with row factory."""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


def init_db(db_path: str):
    """Initialize SQLite database and create required tables."""
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    conn = get_connection(db_path)
    cur = conn.cursor()

    # Create enhanced tables
    cur.executescript("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('student', 'teacher')),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quizzes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        topic TEXT,
        difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
        question_type TEXT CHECK (question_type IN ('MCQ', 'True/False', 'Short Answer', 'Essay')),
        num_questions INTEGER,
        created_by TEXT NOT NULL,
        generation_mode TEXT CHECK (generation_mode IN ('prompt', 'document', 'mistakes')),
        is_published BOOLEAN DEFAULT FALSE,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        data TEXT NOT NULL,
        FOREIGN KEY (created_by) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS quiz_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT NOT NULL,
        quiz_id INTEGER NOT NULL,
        score REAL,
        max_score REAL,
        percentage REAL,
        started_at TEXT DEFAULT CURRENT_TIMESTAMP,
        completed_at TEXT,
        time_taken INTEGER, -- in seconds
        FOREIGN KEY (student_id) REFERENCES users (id),
        FOREIGN KEY (quiz_id) REFERENCES quizzes (id)
    );

    CREATE TABLE IF NOT EXISTS question_responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        attempt_id INTEGER NOT NULL,
        question_id TEXT NOT NULL,
        question_text TEXT NOT NULL,
        student_answer TEXT,
        correct_answer TEXT,
        is_correct BOOLEAN,
        points_earned REAL DEFAULT 0,
        max_points REAL DEFAULT 1,
        response_time INTEGER, -- in seconds
        FOREIGN KEY (attempt_id) REFERENCES quiz_attempts (id)
    );

    CREATE TABLE IF NOT EXISTS student_mistakes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT NOT NULL,
        topic TEXT NOT NULL,
        concept TEXT,
        mistake_type TEXT CHECK (mistake_type IN ('conceptual', 'computational', 'careless')),
        frequency INTEGER DEFAULT 1,
        last_occurred TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS quiz_shares (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quiz_id INTEGER NOT NULL,
        shared_by TEXT NOT NULL,
        share_code TEXT UNIQUE NOT NULL,
        expires_at TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (quiz_id) REFERENCES quizzes (id),
        FOREIGN KEY (shared_by) REFERENCES users (id)
    );

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_quizzes_created_by ON quizzes (created_by);
    CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student ON quiz_attempts (student_id);
    CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON quiz_attempts (quiz_id);
    CREATE INDEX IF NOT EXISTS idx_question_responses_attempt ON question_responses (attempt_id);
    CREATE INDEX IF NOT EXISTS idx_student_mistakes_student ON student_mistakes (student_id);
    """)
    
    conn.commit()
    conn.close()


# ---------------------- USER MANAGEMENT ----------------------
def create_user(db_path: str, user_id: str, name: str, email: str, role: str):
    """Create a new user."""
    conn = get_connection(db_path)
    cur = conn.cursor()
    try:
        cur.execute("""
            INSERT INTO users (id, name, email, role)
            VALUES (?, ?, ?, ?)
        """, (user_id, name, email, role))
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()


def get_user(db_path: str, user_id: str) -> Optional[Dict]:
    """Get user by ID."""
    conn = get_connection(db_path)
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = cur.fetchone()
    conn.close()
    return dict(row) if row else None


# ---------------------- QUIZ MANAGEMENT ----------------------
def insert_quiz(db_path: str, quiz_data: Dict[str, Any], created_by: str) -> int:
    """Insert a new quiz and return its ID."""
    conn = get_connection(db_path)
    cur = conn.cursor()
    
    cur.execute("""
        INSERT INTO quizzes (title, topic, difficulty, question_type, num_questions, 
                           created_by, generation_mode, data)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        quiz_data.get("title", "Untitled Quiz"),
        quiz_data.get("topic", "General"),
        quiz_data.get("difficulty", "Medium"),
        quiz_data.get("question_type", "MCQ"),
        len(quiz_data.get("questions", [])),
        created_by,
        quiz_data.get("generation_mode", "prompt"),
        json.dumps(quiz_data)
    ))
    
    quiz_id = cur.lastrowid
    conn.commit()
    conn.close()
    return quiz_id


def get_quiz_by_id(db_path: str, quiz_id: int, include_answers: bool = True) -> Optional[Dict]:
    """Get quiz by ID, optionally excluding answers for students."""
    conn = get_connection(db_path)
    cur = conn.cursor()
    cur.execute("SELECT * FROM quizzes WHERE id = ?", (quiz_id,))
    row = cur.fetchone()
    conn.close()
    
    if not row:
        return None
    
    quiz_data = json.loads(row["data"])
    quiz_data.update({
        "id": row["id"],
        "title": row["title"],
        "created_by": row["created_by"],
        "created_at": row["created_at"],
        "is_published": row["is_published"]
    })
    
    if not include_answers:
        # Remove answers and explanations for student view
        quiz_data["questions"] = [
            {k: v for k, v in q.items() if k not in ["correct_answer", "explanation"]}
            for q in quiz_data.get("questions", [])
        ]
    
    return quiz_data


def get_quizzes_by_teacher(db_path: str, teacher_id: str) -> List[Dict]:
    """Get all quizzes created by a teacher."""
    conn = get_connection(db_path)
    cur = conn.cursor()
    cur.execute("""
        SELECT id, title, topic, difficulty, num_questions, created_at, is_published
        FROM quizzes WHERE created_by = ?
        ORDER BY created_at DESC
    """, (teacher_id,))
    rows = cur.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def update_quiz(db_path: str, quiz_id: int, updated_data: Dict[str, Any]):
    """Update quiz data."""
    conn = get_connection(db_path)
    cur = conn.cursor()
    cur.execute("""
        UPDATE quizzes 
        SET data = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (json.dumps(updated_data), quiz_id))
    conn.commit()
    conn.close()


def publish_quiz(db_path: str, quiz_id: int):
    """Publish a quiz to make it available to students."""
    conn = get_connection(db_path)
    cur = conn.cursor()
    cur.execute("""
        UPDATE quizzes 
        SET is_published = TRUE, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (quiz_id,))
    conn.commit()
    conn.close()


# ---------------------- QUIZ ATTEMPTS & RESPONSES ----------------------
def start_quiz_attempt(db_path: str, student_id: str, quiz_id: int) -> int:
    """Start a new quiz attempt and return attempt ID."""
    conn = get_connection(db_path)
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO quiz_attempts (student_id, quiz_id)
        VALUES (?, ?)
    """, (student_id, quiz_id))
    attempt_id = cur.lastrowid
    conn.commit()
    conn.close()
    return attempt_id


def submit_quiz_attempt(db_path: str, attempt_id: int, responses: List[Dict], 
                       score: float, max_score: float, time_taken: int):
    """Submit quiz attempt with responses."""
    conn = get_connection(db_path)
    cur = conn.cursor()
    
    # Update attempt
    percentage = (score / max_score * 100) if max_score > 0 else 0
    cur.execute("""
        UPDATE quiz_attempts 
        SET score = ?, max_score = ?, percentage = ?, completed_at = CURRENT_TIMESTAMP, time_taken = ?
        WHERE id = ?
    """, (score, max_score, percentage, time_taken, attempt_id))
    
    # Insert responses
    for response in responses:
        cur.execute("""
            INSERT INTO question_responses 
            (attempt_id, question_id, question_text, student_answer, correct_answer, 
             is_correct, points_earned, max_points, response_time)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            attempt_id,
            response["question_id"],
            response["question_text"],
            response["student_answer"],
            response["correct_answer"],
            response["is_correct"],
            response["points_earned"],
            response["max_points"],
            response.get("response_time", 0)
        ))
    
    conn.commit()
    conn.close()


def get_student_attempts(db_path: str, student_id: str) -> List[Dict]:
    """Get all quiz attempts by a student."""
    conn = get_connection(db_path)
    cur = conn.cursor()
    cur.execute("""
        SELECT qa.*, q.title as quiz_title, q.topic
        FROM quiz_attempts qa
        JOIN quizzes q ON qa.quiz_id = q.id
        WHERE qa.student_id = ?
        ORDER BY qa.started_at DESC
    """, (student_id,))
    rows = cur.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_quiz_attempt_details(db_path: str, attempt_id: int) -> Dict:
    """Get detailed results for a quiz attempt."""
    conn = get_connection(db_path)
    cur = conn.cursor()
    
    # Get attempt info
    cur.execute("""
        SELECT qa.*, q.title as quiz_title, q.topic, u.name as student_name
        FROM quiz_attempts qa
        JOIN quizzes q ON qa.quiz_id = q.id
        JOIN users u ON qa.student_id = u.id
        WHERE qa.id = ?
    """, (attempt_id,))
    attempt = dict(cur.fetchone())
    
    # Get responses
    cur.execute("""
        SELECT * FROM question_responses
        WHERE attempt_id = ?
        ORDER BY question_id
    """, (attempt_id,))
    responses = [dict(row) for row in cur.fetchall()]
    
    conn.close()
    
    attempt["responses"] = responses
    return attempt


# ---------------------- STUDENT ANALYTICS ----------------------
def log_student_mistakes(db_path: str, student_id: str, mistakes: List[Dict]):
    """Log student mistakes from quiz responses."""
    conn = get_connection(db_path)
    cur = conn.cursor()
    
    for mistake in mistakes:
        # Check if mistake already exists
        cur.execute("""
            SELECT id, frequency FROM student_mistakes
            WHERE student_id = ? AND topic = ? AND concept = ?
        """, (student_id, mistake["topic"], mistake["concept"]))
        existing = cur.fetchone()
        
        if existing:
            # Update frequency
            cur.execute("""
                UPDATE student_mistakes 
                SET frequency = frequency + 1, last_occurred = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (existing["id"],))
        else:
            # Insert new mistake
            cur.execute("""
                INSERT INTO student_mistakes (student_id, topic, concept, mistake_type)
                VALUES (?, ?, ?, ?)
            """, (student_id, mistake["topic"], mistake["concept"], mistake["mistake_type"]))
    
    conn.commit()
    conn.close()


def get_student_analytics(db_path: str, student_id: str) -> Dict:
    """Get comprehensive analytics for a student."""
    conn = get_connection(db_path)
    cur = conn.cursor()
    
    # Overall performance
    cur.execute("""
        SELECT 
            COUNT(*) as total_attempts,
            AVG(percentage) as avg_percentage,
            MAX(percentage) as best_score,
            AVG(time_taken) as avg_time
        FROM quiz_attempts 
        WHERE student_id = ? AND completed_at IS NOT NULL
    """, (student_id,))
    overall = dict(cur.fetchone())
    
    # Performance by topic
    cur.execute("""
        SELECT 
            q.topic,
            COUNT(*) as attempts,
            AVG(qa.percentage) as avg_percentage,
            MAX(qa.percentage) as best_score
        FROM quiz_attempts qa
        JOIN quizzes q ON qa.quiz_id = q.id
        WHERE qa.student_id = ? AND qa.completed_at IS NOT NULL
        GROUP BY q.topic
        ORDER BY avg_percentage DESC
    """, (student_id,))
    topic_performance = [dict(row) for row in cur.fetchall()]
    
    # Common mistakes
    cur.execute("""
        SELECT topic, concept, mistake_type, frequency, last_occurred
        FROM student_mistakes
        WHERE student_id = ?
        ORDER BY frequency DESC, last_occurred DESC
        LIMIT 10
    """, (student_id,))
    common_mistakes = [dict(row) for row in cur.fetchall()]
    
    # Recent activity
    cur.execute("""
        SELECT qa.*, q.title as quiz_title, q.topic
        FROM quiz_attempts qa
        JOIN quizzes q ON qa.quiz_id = q.id
        WHERE qa.student_id = ?
        ORDER BY qa.started_at DESC
        LIMIT 5
    """, (student_id,))
    recent_attempts = [dict(row) for row in cur.fetchall()]
    
    conn.close()
    
    return {
        "student_id": student_id,
        "overall_performance": overall,
        "topic_performance": topic_performance,
        "common_mistakes": common_mistakes,
        "recent_attempts": recent_attempts
    }


def get_teacher_analytics(db_path: str, teacher_id: str) -> Dict:
    """Get analytics for a teacher's quizzes."""
    conn = get_connection(db_path)
    cur = conn.cursor()
    
    # Quiz statistics
    cur.execute("""
        SELECT 
            COUNT(*) as total_quizzes,
            COUNT(CASE WHEN is_published = 1 THEN 1 END) as published_quizzes
        FROM quizzes 
        WHERE created_by = ?
    """, (teacher_id,))
    quiz_stats = dict(cur.fetchone())
    
    # Student engagement
    cur.execute("""
        SELECT 
            COUNT(DISTINCT qa.student_id) as unique_students,
            COUNT(*) as total_attempts,
            AVG(qa.percentage) as avg_class_score
        FROM quiz_attempts qa
        JOIN quizzes q ON qa.quiz_id = q.id
        WHERE q.created_by = ? AND qa.completed_at IS NOT NULL
    """, (teacher_id,))
    engagement = dict(cur.fetchone())
    
    # Quiz performance
    cur.execute("""
        SELECT 
            q.id,
            q.title,
            q.topic,
            COUNT(qa.id) as attempts,
            AVG(qa.percentage) as avg_score,
            MIN(qa.percentage) as min_score,
            MAX(qa.percentage) as max_score
        FROM quizzes q
        LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id AND qa.completed_at IS NOT NULL
        WHERE q.created_by = ?
        GROUP BY q.id, q.title, q.topic
        ORDER BY q.created_at DESC
    """, (teacher_id,))
    quiz_performance = [dict(row) for row in cur.fetchall()]
    
    conn.close()
    
    return {
        "teacher_id": teacher_id,
        "quiz_statistics": quiz_stats,
        "student_engagement": engagement,
        "quiz_performance": quiz_performance
    }