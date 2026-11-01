import json
import random
from pathlib import Path
from typing import Dict, List, Optional, Any
from app.core.config import COURSES_DIR

GRADE_FILES = {
    10: COURSES_DIR / "persian10_vocab.json",
    11: COURSES_DIR / "persian11_vocab.json",
    12: COURSES_DIR / "persian12_vocab.json",
}

EMLA_FILES = {
    10: COURSES_DIR / "persian10_emla.json",
    11: COURSES_DIR / "persian11_emla.json",
    12: COURSES_DIR / "persian12_emla.json",
}


class CourseDataLoader:
    def __init__(self):
        self.vocab_data: Dict[int, Dict[str, Any]] = {}
        self.emla_data: Dict[int, Dict[str, Any]] = {}
        self._load_all()

    def _load_all(self):
        for grade, path in GRADE_FILES.items():
            if path.exists():
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        self.vocab_data[grade] = json.load(f)
                except Exception as e:
                    print(f"Error loading vocab for grade {grade}: {e}")

        for grade, path in EMLA_FILES.items():
            if path.exists():
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        self.emla_data[grade] = json.load(f)
                except Exception as e:
                    print(f"Error loading emla for grade {grade}: {e}")

    def get_grade_title(self, grade: int) -> str:
        names = {10: "پایه دهم", 11: "پایه یازدهم", 12: "پایه دوازدهم"}
        return names.get(grade, f"پایه {grade}")

    def get_chapters(self, grade: int) -> List[Dict[str, Any]]:
        course = self.vocab_data.get(grade)
        if not course:
            return []
        parts = course.get("parts", [])
        chapters = []
        for idx, part in enumerate(parts):
            eus = part.get("eus", [])
            chapters.append({
                "index": idx,
                "part_id": part.get("part_id"),
                "title": part.get("title", f"فصل {idx+1}"),
                "words_count": len(eus),
            })
        return chapters

    def get_chapter_eus(self, grade: int, chapter_idx: int) -> List[Dict[str, Any]]:
        course = self.vocab_data.get(grade)
        if not course:
            return []
        parts = course.get("parts", [])
        if 0 <= chapter_idx < len(parts):
            return parts[chapter_idx].get("eus", [])
        return []

    def get_word_at(self, grade: int, chapter_idx: int, word_idx: int) -> Optional[Dict[str, Any]]:
        eus = self.get_chapter_eus(grade, chapter_idx)
        if 0 <= word_idx < len(eus):
            eu = eus[word_idx]
            payload = eu.get("payload", {})
            return {
                "id": eu.get("id"),
                "word": payload.get("word") or payload.get("term") or "واژه",
                "meaning": payload.get("meaning") or payload.get("definition") or "",
                "sentence": payload.get("sentence") or payload.get("example") or "",
                "total_in_chapter": len(eus),
            }
        return None

    def get_all_words_in_grade(self, grade: int) -> List[Dict[str, Any]]:
        course = self.vocab_data.get(grade)
        if not course:
            return []
        all_words = []
        for p_idx, part in enumerate(course.get("parts", [])):
            part_title = part.get("title", f"فصل {p_idx+1}")
            for w_idx, eu in enumerate(part.get("eus", [])):
                payload = eu.get("payload", {})
                w = payload.get("word") or payload.get("term")
                m = payload.get("meaning") or payload.get("definition")
                if w and m:
                    all_words.append({
                        "word": w,
                        "meaning": m,
                        "grade": grade,
                        "chapter_idx": p_idx,
                        "chapter_title": part_title,
                        "word_idx": w_idx,
                    })
        return all_words

    def generate_quiz_question(self, grade: int, chapter_idx: Optional[int] = None) -> Optional[Dict[str, Any]]:
        if chapter_idx is not None:
            eus = self.get_chapter_eus(grade, chapter_idx)
            words = []
            for eu in eus:
                p = eu.get("payload", {})
                w = p.get("word") or p.get("term")
                m = p.get("meaning") or p.get("definition")
                if w and m:
                    words.append({"word": w, "meaning": m})
        else:
            words = self.get_all_words_in_grade(grade)

        if len(words) < 4:
            all_fallback = self.get_all_words_in_grade(grade)
            if len(all_fallback) >= 4:
                distractor_pool = all_fallback
            else:
                distractor_pool = []
                for g in [10, 11, 12]:
                    distractor_pool.extend(self.get_all_words_in_grade(g))
        else:
            distractor_pool = words

        if not words or len(distractor_pool) < 4:
            return None

        target = random.choice(words)
        correct_meaning = target["meaning"]

        other_meanings = list({w["meaning"] for w in distractor_pool if w["meaning"] != correct_meaning})
        if len(other_meanings) < 3:
            return None

        wrong_options = random.sample(other_meanings, 3)
        options = wrong_options + [correct_meaning]
        random.shuffle(options)
        correct_idx = options.index(correct_meaning)

        return {
            "word": target["word"],
            "options": options,
            "correct_idx": correct_idx,
            "grade": grade,
            "chapter_idx": chapter_idx,
        }


data_loader = CourseDataLoader()
