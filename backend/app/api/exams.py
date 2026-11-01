import json
from datetime import datetime
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import get_current_user, get_optional_user
from app.core.config import ASSETS_DIR
from app.core.database import get_user_db
from app.core.exams_db import get_exams_db, init_exams_db
from app.models.exam import KeypadSubmission, JournalSubmission, Phase1Submission, Phase2Submission

router = APIRouter(prefix="/exams", tags=["exams"])

QUESTION_TYPE_FA = {
    "Mafhoomi": "مفهومی",
    "Mohasebati": "محاسباتی",
    "Tarkibi": "ترکیبی",
    "Nokat Shekl": "نکات شکل",
    "Hefzi": "حفظی",
    "Nemoodari": "نموداری",
}

TIME_PROFILE_FA = {
    "Fast": "سریع",
    "Standard": "استاندارد",
    "Long af": "وقت‌گیر",
}

def load_topic_names() -> Dict[str, str]:
    """Loads taxonomy codes to Persian titles from topics.txt."""
    topics_file = ASSETS_DIR / "topics.txt"
    mapping = {}
    if topics_file.exists():
        with open(topics_file, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line.startswith("#") or not line:
                    continue
                if ":" in line:
                    parts = line.split(":", 1)
                    code = parts[0].strip()
                    title = parts[1].strip()
                    mapping[code] = title
    return mapping

def calculate_score_pct(correct: int, wrong: int, total: int) -> float:
    """Calculates standard Konkur percentage with 1/3 negative marking penalty."""
    if total <= 0:
        return 0.0
    raw = (3 * correct - wrong) / (3 * total) * 100.0
    return round(max(-33.33, min(100.0, raw)), 2)

@router.get("")
def get_exams_catalog(current_user: Optional[Dict] = Depends(get_optional_user)):
    """Returns list of all available exams with student analysis status."""
    init_exams_db()
    with get_exams_db() as conn:
        c = conn.cursor()
        rows = c.execute("SELECT * FROM exams ORDER BY held_date DESC").fetchall()
        
        user_statuses = {}
        if current_user:
            with get_user_db() as uconn:
                uc = uconn.cursor()
                u_rows = uc.execute(
                    "SELECT exam_id, status, exam_score_pct, potential_score_pct, anxiety_tax_pct FROM student_exam_analyses WHERE user_id = ?",
                    (current_user["id"],)
                ).fetchall()
                for ur in u_rows:
                    user_statuses[ur["exam_id"]] = {
                        "status": ur["status"],
                        "exam_score_pct": ur["exam_score_pct"],
                        "potential_score_pct": ur["potential_score_pct"],
                        "anxiety_tax_pct": ur["anxiety_tax_pct"]
                    }

        result = []
        for r in rows:
            sections = json.loads(r["sections_json"]) if r["sections_json"] else []
            exam_data = {
                "id": r["id"],
                "title": r["title"],
                "provider": r["provider"],
                "grade": r["grade"],
                "major": r["major"],
                "held_date": r["held_date"],
                "total_questions": r["total_questions"],
                "sections": sections,
                "analysis_status": user_statuses.get(r["id"], {"status": "not_started"})
            }
            result.append(exam_data)
        return result

@router.get("/{exam_id}")
def get_exam_details(exam_id: str):
    """Returns full metadata and all questions enriched with topic titles."""
    init_exams_db()
    topic_names = load_topic_names()
    with get_exams_db() as conn:
        c = conn.cursor()
        exam_row = c.execute("SELECT * FROM exams WHERE id = ?", (exam_id,)).fetchone()
        if not exam_row:
            raise HTTPException(status_code=404, detail="آزمون مورد نظر یافت نشد.")
        
        q_rows = c.execute(
            "SELECT * FROM exam_questions WHERE exam_id = ? ORDER BY q_num ASC", (exam_id,)
        ).fetchall()

        sections = json.loads(exam_row["sections_json"]) if exam_row["sections_json"] else []
        questions = []
        for q in q_rows:
            qd = dict(q)
            topic_id = qd.get("topic_id", "")
            qd["topic_title"] = topic_names.get(topic_id, "")
            qd["question_type_fa"] = QUESTION_TYPE_FA.get(qd.get("question_type", ""), qd.get("question_type", ""))
            qd["time_profile_fa"] = TIME_PROFILE_FA.get(qd.get("time_taking_profile", ""), qd.get("time_taking_profile", ""))
            questions.append(qd)

        return {
            "id": exam_row["id"],
            "title": exam_row["title"],
            "provider": exam_row["provider"],
            "grade": exam_row["grade"],
            "major": exam_row["major"],
            "held_date": exam_row["held_date"],
            "total_questions": exam_row["total_questions"],
            "sections": sections,
            "questions": questions
        }

@router.get("/{exam_id}/analysis")
def get_user_exam_analysis(exam_id: str, current_user: Dict = Depends(get_current_user)):
    """Returns the current user's session analysis for an exam."""
    with get_user_db() as conn:
        c = conn.cursor()
        row = c.execute(
            "SELECT * FROM student_exam_analyses WHERE user_id = ? AND exam_id = ?",
            (current_user["id"], exam_id)
        ).fetchone()

        if not row:
            return {
                "user_id": current_user["id"],
                "exam_id": exam_id,
                "status": "not_started",
                "exam_score_pct": 0.0,
                "potential_score_pct": 0.0,
                "anxiety_tax_pct": 0.0,
                "phase1_answers": {},
                "phase2_resolves": {},
                "metrics_summary": {}
            }

        return {
            "user_id": row["user_id"],
            "exam_id": row["exam_id"],
            "status": row["status"],
            "exam_score_pct": row["exam_score_pct"],
            "potential_score_pct": row["potential_score_pct"],
            "anxiety_tax_pct": row["anxiety_tax_pct"],
            "phase1_answers": json.loads(row["phase1_answers_json"] or "{}"),
            "phase2_resolves": json.loads(row["phase2_resolves_json"] or "{}"),
            "metrics_summary": json.loads(row["metrics_summary_json"] or "{}"),
            "created_at": row["created_at"],
            "updated_at": row["updated_at"]
        }

@router.post("/{exam_id}/analysis/keypad")
@router.post("/{exam_id}/analysis/phase1")
def submit_keypad(exam_id: str, payload: KeypadSubmission, current_user: Dict = Depends(get_current_user)):
    """Saves rapid keypad answer responses and computes in-exam raw score."""
    init_exams_db()
    with get_exams_db() as econn:
        ec = econn.cursor()
        exam_row = ec.execute("SELECT total_questions FROM exams WHERE id = ?", (exam_id,)).fetchone()
        if not exam_row:
            raise HTTPException(status_code=404, detail="آزمون مورد نظر یافت نشد.")
        total_q = exam_row["total_questions"]
        q_rows = ec.execute("SELECT q_num, correct_opt FROM exam_questions WHERE exam_id = ?", (exam_id,)).fetchall()
        keys_map = {r["q_num"]: r["correct_opt"] for r in q_rows}

    # Normalize answers: support option number (1-4, 0), dict {option, status}, or raw status string
    normalized_answers = {}
    correct_count = 0
    wrong_count = 0
    blank_count = 0

    for q_num, correct_opt in keys_map.items():
        q_str = str(q_num)
        ans = payload.answers.get(q_str)
        user_opt = None
        status_val = "blank"

        if isinstance(ans, dict):
            user_opt = ans.get("option")
            status_val = ans.get("status", "blank")
            if user_opt is not None:
                if user_opt == 0:
                    status_val = "blank"
                elif user_opt == correct_opt:
                    status_val = "correct"
                else:
                    status_val = "wrong"
        elif isinstance(ans, int):
            user_opt = ans
            if user_opt == 0:
                status_val = "blank"
            elif user_opt == correct_opt:
                status_val = "correct"
            else:
                status_val = "wrong"
        elif isinstance(ans, str):
            if ans.isdigit():
                user_opt = int(ans)
                if user_opt == 0:
                    status_val = "blank"
                elif user_opt == correct_opt:
                    status_val = "correct"
                else:
                    status_val = "wrong"
            elif ans in ["correct", "wrong", "blank"]:
                status_val = ans
            else:
                status_val = "blank"
        else:
            status_val = "blank"

        normalized_answers[q_str] = {
            "option": user_opt,
            "status": status_val
        }

        if status_val == "correct":
            correct_count += 1
        elif status_val == "wrong":
            wrong_count += 1
        else:
            blank_count += 1

    exam_score_pct = calculate_score_pct(correct_count, wrong_count, total_q)
    now_iso = datetime.now().isoformat()

    with get_user_db() as uconn:
        uc = uconn.cursor()
        existing = uc.execute(
            "SELECT id FROM student_exam_analyses WHERE user_id = ? AND exam_id = ?",
            (current_user["id"], exam_id)
        ).fetchone()

        if existing:
            uc.execute("""
                UPDATE student_exam_analyses
                SET status = 'journaling',
                    exam_score_pct = ?,
                    phase1_answers_json = ?,
                    updated_at = ?
                WHERE user_id = ? AND exam_id = ?
            """, (exam_score_pct, json.dumps(normalized_answers, ensure_ascii=False), now_iso, current_user["id"], exam_id))
        else:
            uc.execute("""
                INSERT INTO student_exam_analyses (
                    user_id, exam_id, status, exam_score_pct, potential_score_pct, anxiety_tax_pct,
                    phase1_answers_json, phase2_resolves_json, metrics_summary_json, created_at, updated_at
                )
                VALUES (?, ?, 'journaling', ?, 0.0, 0.0, ?, '{}', '{}', ?, ?)
            """, (current_user["id"], exam_id, exam_score_pct, json.dumps(normalized_answers, ensure_ascii=False), now_iso, now_iso))
        uconn.commit()

    return {
        "status": "journaling",
        "exam_score_pct": exam_score_pct,
        "correct_count": correct_count,
        "wrong_count": wrong_count,
        "blank_count": blank_count,
        "total_questions": total_q,
        "normalized_answers": normalized_answers
    }

@router.post("/{exam_id}/analysis/journal")
@router.post("/{exam_id}/analysis/phase2")
def submit_journal(exam_id: str, payload: JournalSubmission, current_user: Dict = Depends(get_current_user)):
    """Saves question journaling entries for all 90 questions."""
    with get_user_db() as uconn:
        uc = uconn.cursor()
        row = uc.execute(
            "SELECT * FROM student_exam_analyses WHERE user_id = ? AND exam_id = ?",
            (current_user["id"], exam_id)
        ).fetchone()

        if not row:
            raise HTTPException(status_code=400, detail="ابتدا پاسخ‌برگ آزمون را ثبت کنید.")

        phase1_answers = json.loads(row["phase1_answers_json"] or "{}")

    init_exams_db()
    with get_exams_db() as econn:
        ec = econn.cursor()
        exam_row = ec.execute("SELECT total_questions FROM exams WHERE id = ?", (exam_id,)).fetchone()
        total_q = exam_row["total_questions"] if exam_row else 90

    # Normalize entries
    entries_dict = {}
    if payload.entries:
        for k, v in payload.entries.items():
            entries_dict[str(k)] = v.model_dump()
    elif payload.resolves:
        for k, v in payload.resolves.items():
            if hasattr(v, "model_dump"):
                entries_dict[str(k)] = v.model_dump()
            elif isinstance(v, dict):
                entries_dict[str(k)] = v

    # Calculate outside-exam score
    # Count in-exam correct vs outside-exam correct
    outside_correct = 0
    outside_wrong = 0
    outside_blank = 0

    for q_num in range(1, total_q + 1):
        q_str = str(q_num)
        ans_item = phase1_answers.get(q_str)
        in_exam_status = ans_item.get("status") if isinstance(ans_item, dict) else (ans_item or "blank")
        j_entry = entries_dict.get(q_str, {})
        outside_status = j_entry.get("outside_status")

        if in_exam_status == "correct":
            outside_correct += 1
        elif outside_status == "solved_correctly_no_time":
            outside_correct += 1
        elif in_exam_status == "wrong":
            outside_wrong += 1
        else:
            outside_blank += 1

    potential_score_pct = calculate_score_pct(outside_correct, outside_wrong, total_q)
    exam_score_pct = float(row["exam_score_pct"])
    anxiety_tax_pct = round(max(0.0, potential_score_pct - exam_score_pct), 2)
    now_iso = datetime.now().isoformat()

    with get_user_db() as uconn:
        uc = uconn.cursor()
        uc.execute("""
            UPDATE student_exam_analyses
            SET status = 'completed',
                potential_score_pct = ?,
                anxiety_tax_pct = ?,
                phase2_resolves_json = ?,
                updated_at = ?,
                completed_at = ?
            WHERE user_id = ? AND exam_id = ?
        """, (
            potential_score_pct,
            anxiety_tax_pct,
            json.dumps(entries_dict, ensure_ascii=False),
            now_iso,
            now_iso,
            current_user["id"],
            exam_id
        ))
        uconn.commit()

    return {
        "status": "completed",
        "exam_score_pct": exam_score_pct,
        "potential_score_pct": potential_score_pct,
        "anxiety_tax_pct": anxiety_tax_pct,
        "outside_correct_count": outside_correct,
        "total_questions": total_q
    }

@router.get("/{exam_id}/analysis/metrics")
@router.get("/{exam_id}/analysis/report")
def get_exam_metrics(exam_id: str, current_user: Dict = Depends(get_current_user)):
    """
    Returns pure statistical metrics and distributions for both:
    1. in_exam (شرایط آزمون)
    2. outside_exam (خارج از شرایط آزمون)
    No qualitative diagnosis or counselor prescriptions.
    """
    with get_user_db() as uconn:
        uc = uconn.cursor()
        row = uc.execute(
            "SELECT * FROM student_exam_analyses WHERE user_id = ? AND exam_id = ?",
            (current_user["id"], exam_id)
        ).fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="تحلیلی برای این آزمون ثبت نشده است.")

    init_exams_db()
    topic_names = load_topic_names()

    with get_exams_db() as econn:
        ec = econn.cursor()
        exam_row = ec.execute("SELECT * FROM exams WHERE id = ?", (exam_id,)).fetchone()
        if not exam_row:
            raise HTTPException(status_code=404, detail="آزمون یافت نشد.")
        q_rows = ec.execute("SELECT * FROM exam_questions WHERE exam_id = ? ORDER BY q_num ASC", (exam_id,)).fetchall()

    questions = [dict(q) for q in q_rows]
    total_q = len(questions)

    phase1_answers = json.loads(row["phase1_answers_json"] or "{}")
    journal_entries = json.loads(row["phase2_resolves_json"] or "{}")

    # Helper function to compute breakdown for an evaluation dataset
    def compute_dataset_metrics(eval_map: Dict[int, str]):
        # Overall
        c_count = sum(1 for s in eval_map.values() if s == "correct")
        w_count = sum(1 for s in eval_map.values() if s == "wrong")
        b_count = sum(1 for s in eval_map.values() if s == "blank")
        score_pct = calculate_score_pct(c_count, w_count, total_q)

        # 1. Subjects Breakdown
        subj_map = {}
        for q in questions:
            subj = q["subject"]
            if subj not in subj_map:
                subj_map[subj] = {"subject": subj, "total": 0, "correct": 0, "wrong": 0, "blank": 0}
            s = eval_map.get(q["q_num"], "blank")
            subj_map[subj]["total"] += 1
            if s == "correct":
                subj_map[subj]["correct"] += 1
            elif s == "wrong":
                subj_map[subj]["wrong"] += 1
            else:
                subj_map[subj]["blank"] += 1

        subjects = []
        for s_name, data in subj_map.items():
            sc = calculate_score_pct(data["correct"], data["wrong"], data["total"])
            c_pct = round(data["correct"] / data["total"] * 100, 1) if data["total"] > 0 else 0
            subjects.append({
                "subject": s_name,
                "total": data["total"],
                "correct": data["correct"],
                "wrong": data["wrong"],
                "blank": data["blank"],
                "score_pct": sc,
                "correct_pct": c_pct
            })

        # 2. Difficulties Breakdown (آسان, متوسط, دشوار)
        diff_order = ["آسان", "متوسط", "دشوار"]
        diff_map = {d: {"difficulty": d, "total": 0, "correct": 0, "wrong": 0, "blank": 0} for d in diff_order}
        for q in questions:
            d = q.get("difficulty") or "متوسط"
            if d not in diff_map:
                diff_map[d] = {"difficulty": d, "total": 0, "correct": 0, "wrong": 0, "blank": 0}
            s = eval_map.get(q["q_num"], "blank")
            diff_map[d]["total"] += 1
            if s == "correct":
                diff_map[d]["correct"] += 1
            elif s == "wrong":
                diff_map[d]["wrong"] += 1
            else:
                diff_map[d]["blank"] += 1

        difficulties = []
        for d in diff_order:
            if d in diff_map and diff_map[d]["total"] > 0:
                data = diff_map[d]
                sc = calculate_score_pct(data["correct"], data["wrong"], data["total"])
                c_pct = round(data["correct"] / data["total"] * 100, 1) if data["total"] > 0 else 0
                difficulties.append({
                    "difficulty": d,
                    "total": data["total"],
                    "correct": data["correct"],
                    "wrong": data["wrong"],
                    "blank": data["blank"],
                    "score_pct": sc,
                    "correct_pct": c_pct
                })

        # 3. Question Types Breakdown
        type_map = {}
        for q in questions:
            t = q.get("question_type") or "Mafhoomi"
            if t not in type_map:
                type_map[t] = {
                    "type": t,
                    "type_fa": QUESTION_TYPE_FA.get(t, t),
                    "total": 0,
                    "correct": 0,
                    "wrong": 0,
                    "blank": 0
                }
            s = eval_map.get(q["q_num"], "blank")
            type_map[t]["total"] += 1
            if s == "correct":
                type_map[t]["correct"] += 1
            elif s == "wrong":
                type_map[t]["wrong"] += 1
            else:
                type_map[t]["blank"] += 1

        question_types = []
        for t_name, data in type_map.items():
            sc = calculate_score_pct(data["correct"], data["wrong"], data["total"])
            c_pct = round(data["correct"] / data["total"] * 100, 1) if data["total"] > 0 else 0
            question_types.append({
                "type": data["type"],
                "type_fa": data["type_fa"],
                "total": data["total"],
                "correct": data["correct"],
                "wrong": data["wrong"],
                "blank": data["blank"],
                "score_pct": sc,
                "correct_pct": c_pct
            })
        question_types.sort(key=lambda x: x["total"], reverse=True)

        # 4. Time Profiles Breakdown (Fast, Standard, Long af)
        time_order = ["Fast", "Standard", "Long af"]
        time_map = {tp: {
            "profile": tp,
            "profile_fa": TIME_PROFILE_FA.get(tp, tp),
            "total": 0,
            "correct": 0,
            "wrong": 0,
            "blank": 0
        } for tp in time_order}

        for q in questions:
            tp = q.get("time_taking_profile") or "Standard"
            if tp not in time_map:
                time_map[tp] = {
                    "profile": tp,
                    "profile_fa": TIME_PROFILE_FA.get(tp, tp),
                    "total": 0,
                    "correct": 0,
                    "wrong": 0,
                    "blank": 0
                }
            s = eval_map.get(q["q_num"], "blank")
            time_map[tp]["total"] += 1
            if s == "correct":
                time_map[tp]["correct"] += 1
            elif s == "wrong":
                time_map[tp]["wrong"] += 1
            else:
                time_map[tp]["blank"] += 1

        time_profiles = []
        for tp in time_order:
            if tp in time_map and time_map[tp]["total"] > 0:
                data = time_map[tp]
                sc = calculate_score_pct(data["correct"], data["wrong"], data["total"])
                c_pct = round(data["correct"] / data["total"] * 100, 1) if data["total"] > 0 else 0
                time_profiles.append({
                    "profile": data["profile"],
                    "profile_fa": data["profile_fa"],
                    "total": data["total"],
                    "correct": data["correct"],
                    "wrong": data["wrong"],
                    "blank": data["blank"],
                    "score_pct": sc,
                    "correct_pct": c_pct
                })

        # 5. Topics Breakdown (by topic_id)
        topic_map = {}
        for q in questions:
            tid = q.get("topic_id") or "UNKNOWN"
            if tid not in topic_map:
                topic_map[tid] = {
                    "topic_id": tid,
                    "topic_title": topic_names.get(tid, tid),
                    "subject": q["subject"],
                    "total": 0,
                    "correct": 0,
                    "wrong": 0,
                    "blank": 0
                }
            s = eval_map.get(q["q_num"], "blank")
            topic_map[tid]["total"] += 1
            if s == "correct":
                topic_map[tid]["correct"] += 1
            elif s == "wrong":
                topic_map[tid]["wrong"] += 1
            else:
                topic_map[tid]["blank"] += 1

        topics = []
        for tid, data in topic_map.items():
            sc = calculate_score_pct(data["correct"], data["wrong"], data["total"])
            c_pct = round(data["correct"] / data["total"] * 100, 1) if data["total"] > 0 else 0
            topics.append({
                "topic_id": data["topic_id"],
                "topic_title": data["topic_title"],
                "subject": data["subject"],
                "total": data["total"],
                "correct": data["correct"],
                "wrong": data["wrong"],
                "blank": data["blank"],
                "score_pct": sc,
                "correct_pct": c_pct
            })
        topics.sort(key=lambda x: (x["subject"], x["topic_id"]))

        return {
            "score_pct": score_pct,
            "correct_count": c_count,
            "wrong_count": w_count,
            "blank_count": b_count,
            "total_questions": total_q,
            "subjects": subjects,
            "difficulties": difficulties,
            "question_types": question_types,
            "time_profiles": time_profiles,
            "topics": topics
        }

    # Evaluate In-Exam Map
    in_exam_map = {}
    for q in questions:
        q_num = q["q_num"]
        q_str = str(q_num)
        ans_item = phase1_answers.get(q_str)
        if isinstance(ans_item, dict):
            s = ans_item.get("status", "blank")
        elif isinstance(ans_item, str):
            s = ans_item
        else:
            s = "blank"
        in_exam_map[q_num] = s

    # Evaluate Outside-Exam Map
    outside_exam_map = {}
    outside_status_counts = {
        "solved_correctly_no_time": 0,
        "needed_answer_sheet": 0,
        "unsolved": 0,
        "not_attempted": 0
    }
    error_reasons_count = {
        "بی‌دقتی": 0,
        "دام آموزشی": 0,
        "کمبود زمان": 0,
        "ضعف علمی": 0,
        "استرس": 0
    }

    questions_journal_summary = []

    for q in questions:
        q_num = q["q_num"]
        q_str = str(q_num)
        in_status = in_exam_map[q_num]
        j_entry = journal_entries.get(q_str, {})
        outside_stat = j_entry.get("outside_status")
        err_reason = j_entry.get("error_reason")

        if in_status == "correct":
            outside_exam_map[q_num] = "correct"
        else:
            if outside_stat == "solved_correctly_no_time":
                outside_exam_map[q_num] = "correct"
                outside_status_counts["solved_correctly_no_time"] += 1
            elif outside_stat == "needed_answer_sheet":
                outside_exam_map[q_num] = in_status
                outside_status_counts["needed_answer_sheet"] += 1
            elif outside_stat == "unsolved":
                outside_exam_map[q_num] = in_status
                outside_status_counts["unsolved"] += 1
            else:
                outside_exam_map[q_num] = in_status
                outside_status_counts["not_attempted"] += 1

            if err_reason in error_reasons_count:
                error_reasons_count[err_reason] += 1

        tid = q.get("topic_id", "")
        questions_journal_summary.append({
            "q_num": q_num,
            "utid": q.get("utid", ""),
            "subject": q["subject"],
            "correct_opt": q["correct_opt"],
            "topic_id": tid,
            "topic_title": topic_names.get(tid, ""),
            "question_type": q.get("question_type", "Mafhoomi"),
            "question_type_fa": QUESTION_TYPE_FA.get(q.get("question_type", ""), ""),
            "time_taking_profile": q.get("time_taking_profile", "Standard"),
            "time_profile_fa": TIME_PROFILE_FA.get(q.get("time_taking_profile", ""), ""),
            "difficulty": q.get("difficulty", "متوسط"),
            "in_exam_status": in_status,
            "outside_status": outside_stat,
            "error_reason": err_reason,
            "solve_faster_note": j_entry.get("solve_faster_note", ""),
            "subchapter_bug_note": j_entry.get("subchapter_bug_note", ""),
            "personal_journal": j_entry.get("personal_journal", "")
        })

    in_exam_metrics = compute_dataset_metrics(in_exam_map)
    outside_exam_metrics = compute_dataset_metrics(outside_exam_map)

    error_reasons_list = [
        {"reason": r, "count": count}
        for r, count in error_reasons_count.items()
    ]

    return {
        "exam_id": exam_id,
        "exam_title": exam_row["title"],
        "provider": exam_row["provider"],
        "held_date": exam_row["held_date"],
        "total_questions": total_q,
        "in_exam": in_exam_metrics,
        "outside_exam": outside_exam_metrics,
        "error_reasons": error_reasons_list,
        "outside_status_counts": outside_status_counts,
        "questions_journal_summary": questions_journal_summary
    }

@router.post("/{exam_id}/analysis/reset")
def reset_analysis(exam_id: str, current_user: Dict = Depends(get_current_user)):
    """Resets student analysis session for the exam."""
    with get_user_db() as uconn:
        uc = uconn.cursor()
        uc.execute(
            "DELETE FROM student_exam_analyses WHERE user_id = ? AND exam_id = ?",
            (current_user["id"], exam_id)
        )
        uconn.commit()
    return {"message": "تحلیل آزمون با موفقیت ریست شد."}
