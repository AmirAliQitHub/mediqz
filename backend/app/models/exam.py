from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field

class ExamSection(BaseModel):
    subject: str
    start_q: int
    end_q: int
    total_questions: int
    prefix: Optional[str] = None

class ExamSummary(BaseModel):
    id: str
    title: str
    provider: str
    grade: str
    major: str
    held_date: str
    total_questions: int
    sections: List[ExamSection]

class ExamQuestionModel(BaseModel):
    id: Optional[int] = None
    utid: str
    exam_id: str
    q_num: int
    subject: str
    correct_opt: int
    topic_id: str
    topic_title: Optional[str] = ""
    time_taking_profile: str = "Standard"
    question_type: str = "Mafhoomi"
    difficulty: str = "متوسط"
    question_text: Optional[str] = ""
    options_json: Optional[str] = "[]"
    page_number: Optional[int] = None
    explanation_summary: Optional[str] = None

class ExamDetail(ExamSummary):
    questions: List[ExamQuestionModel]

Exam = ExamSummary
ExamQuestion = ExamQuestionModel

# Keypad answer submission
class KeypadSubmission(BaseModel):
    answers: Dict[str, Any]  # Maps q_num (str) to option (1-4, 0) or status ("correct"/"wrong"/"blank") or dict

Phase1Submission = KeypadSubmission

# Secondary detailed question journaling
class QuestionJournalEntry(BaseModel):
    # For correct questions:
    solve_faster_note: Optional[str] = ""
    personal_journal: Optional[str] = ""
    
    # For wrong / blank questions:
    # وضعیت حل خارج از شرایط آزمون: solved_correctly_no_time | needed_answer_sheet | unsolved
    outside_status: Optional[str] = None
    # علت اصلی خطا: بی‌دقتی | دام آموزشی | کمبود زمان | ضعف علمی | استرس
    error_reason: Optional[str] = None
    subchapter_bug_note: Optional[str] = ""

class JournalSubmission(BaseModel):
    entries: Dict[str, QuestionJournalEntry] = Field(default_factory=dict)
    # Support backward-compatibility with older payload name if needed
    resolves: Optional[Dict[str, Any]] = None

Phase2Submission = JournalSubmission
