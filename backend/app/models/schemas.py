from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class UserRegisterReq(BaseModel):
    username: str
    password: str
    display_name: Optional[str] = None
    init_data: Optional[str] = None

class UserLoginReq(BaseModel):
    username: str
    password: str

class TelegramAuthReq(BaseModel):
    id: int
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None
    language_code: Optional[str] = None
    auth_date: Optional[int] = None
    hash: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    username: str
    display_name: str
    avatar_url: str = ""
    access_level: str = "S2"
    grade: Optional[str] = ""
    is_onboarded: Optional[bool] = False
    is_superuser: Optional[bool] = False
    telegram_user_id: Optional[int] = None

class CourseCompleteReq(BaseModel):
    course_id: str
    part_id: str
    title: str
    topic_code: Optional[str] = None
    total_slides: int
    correct_count: int
    wrong_count: int
    score_percentage: float
    details_payload: Optional[str] = None

class CourseSummary(BaseModel):
    id: str
    title: str
    topic_code: str = ""
    subject: str = ""
    grade: str = ""
    description: str = ""
    parts_count: int = 1
    slides_count: int = 0
    type: str = "builtin"
    is_review: bool = False
    is_development: bool = False

class PartReviewRecord(BaseModel):
    id: int
    course_id: str
    part_id: str
    title: str
    topic_code: str
    review_step: int
    last_reviewed_at: Optional[str] = None
    next_due_at: Optional[str] = None
    is_delayed: int = 0
    manual_review_date: Optional[str] = None
    created_at: Optional[str] = None
    course_title: Optional[str] = None
    part_title: Optional[str] = None
    is_due: bool = False

class ReviewSessionSubmitReq(BaseModel):
    course_id: str
    part_id: str
    included_results: Dict[str, str] # eu_id -> 'correct' | 'incorrect' | 'null'
    absent_eu_ids: Optional[List[str]] = None
    summary: Dict[str, Any]

class CourseImportReq(BaseModel):
    title: str
    topic_code: Optional[str] = "CUSTOM"
    description: Optional[str] = ""
    parts: Optional[List[Dict[str, Any]]] = None
    eus: Optional[List[Dict[str, Any]]] = None

class EULogItem(BaseModel):
    course_id: str
    part_id: str
    eu_id: str
    status: str  # 'correct' | 'incorrect' | 'null'
    user_answer: Optional[str] = None
    shamsi_date: str  # e.g. '1405-08-12'

class EULogBatchReq(BaseModel):
    items: List[EULogItem]

class UserRoutineItem(BaseModel):
    shamsi_date: str
    course_id: str
    course_title: str
    part_id: str
    part_title: str
    slide_count: int = 0
    completed: bool = False
    order_idx: int = 0

class UserRoutinesSyncReq(BaseModel):
    routines: List[UserRoutineItem]
    cleared_dates: List[str] = []
